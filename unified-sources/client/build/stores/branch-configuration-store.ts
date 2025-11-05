import { action, observable } from "mobx";
import { t } from "@root/lib/i18n";
import { ExternalDataState, DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore } from "@root/shared";
import { IApp } from "@lib/common-interfaces";
import { notifyScreenReader, notificationStore } from "../../stores/notification-store";
import { CIBaseStore } from "./ci-base-store";
import { ciStore } from "./ci-store";
import { BuildsStore } from "./builds-store";

import { IAHBranchConfiguration, IAHBuild, GITHUB_PR_HEAD_BRANCH, GITHUB_PR_SHA, IDistributionStore } from "@root/data/build";
import { locationStore, appStore } from "@root/stores";
import { apiGateway } from "@root/lib/http";
import { logger } from "@root/lib/telemetry";
import { difference } from "lodash";
import * as qs from "qs";

export enum BranchConfigurationState {
  Unconfigured,
  ConfigurationInProgress,
  StartingBuild,
  ConfigurationComplete,
  ConfigurationFailed,
  LimitReached,
  Deleting,
}

export class ConfigureBranchStore extends DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore<IAHBranchConfiguration> {
  constructor() {
    super();

    // default state should be Loaded for non-fetch operations
    this.state = ExternalDataState.Loaded;
  }

  public load(dataPromise: Promise<IAHBranchConfiguration>) {
    return super.load(dataPromise);
  }
}

export class BranchConfigurationStore extends CIBaseStore<IAHBranchConfiguration | null> {
  private fetchPromise?: Promise<IAHBranchConfiguration | null>;
  private configurePromise?: Promise<IAHBranchConfiguration>;
  private deletePromise?: Promise<boolean>;

  public branch?: string = undefined;

  public buildsStore: BuildsStore;
  public configureBranchStore: ConfigureBranchStore;

  constructor(app: IApp, branch: string) {
    super(app);

    this.branch = branch;
    this.buildsStore = new BuildsStore(app, branch);
    this.configureBranchStore = new ConfigureBranchStore();
  }

  @action
  public fetch(background: boolean = false): Promise<void> {
    // refresh builds at the same time.
    this.buildsStore.refreshBuilds();

    this.lastFetchTimestamp = Date.now();

    const path = this.getPathWithSlug("branches/:branch/config");
    this.fetchPromise = apiGateway
      .get<IAHBranchConfiguration>(path, {
        params: {
          branch: this.branch || "",
        },
      })
      .catch((err) => {
        if (err && err.status === 404) {
          return null;
        }
        throw err;
      });

    if (background) {
      return this.loadInBackgroundVoid(this.fetchPromise);
    } else {
      return this.loadVoid(this.fetchPromise);
    }
  }

  @action
  public refresh() {
    if (this.fetchPromise && this.fetchPromise.isPending()) {
      return;
    }

    this.fetch(true);
  }

  @observable
  public configurationState: BranchConfigurationState = BranchConfigurationState.Unconfigured;

  @observable
  public queuingBuild = false;

  @action
  public configure(
    properties: IAHBranchConfiguration,
    updatingExisting: boolean,
    quickSetup?: boolean,
    queueBuild?: boolean,
    sourceBranch?: string,
    prSourceVersion?: string
  ): Promise<IAHBranchConfiguration> {
    this.queuingBuild = !!queueBuild;

    const path = this.getPathWithSlug("branches/:branch/config");
    const options = {
      params: {
        branch: this.branch,
      },
      body: properties,
    } as any;

    this.configurationState = BranchConfigurationState.ConfigurationInProgress;
    notifyScreenReader({ message: t("build:configure.messages.configurationInProgress") });

    let allCreateDistributionStorePromises = Promise.resolve<void>(undefined);

    if (
      properties.toolsets.distribution &&
      properties.toolsets.distribution.destinations &&
      properties.toolsets.distribution.destinations.length > 0
    ) {
      const originalDestinations = properties.toolsets.distribution.destinations;
      const properDestinations: string[] = [];
      const createDistributionStorePromises: Promise<IDistributionStore | null>[] = [];

      originalDestinations.forEach((destination) => {
        if (ciStore.currentRepoStore) {
          const createDistributionStorePromise = ciStore.currentRepoStore.distributionStoresStore
            .createStoreIfNotExists(destination)
            .then((store) => {
              if (store && store.id) {
                properDestinations.push(store.id);
              } else {
                properDestinations.push(destination);
              }
              return store;
            });
          createDistributionStorePromises.push(createDistributionStorePromise);
        }
      });

      allCreateDistributionStorePromises = Promise.all(createDistributionStorePromises).then(() => {
        if (ciStore.currentRepoStore) {
          ciStore.currentRepoStore.distributionStoresStore.fetch(); // update stores list
        }
        if (properties.toolsets.distribution) {
          properties.toolsets.distribution.destinations = properDestinations;
        }
      });
    }

    if (updatingExisting) {
      this.configurePromise = allCreateDistributionStorePromises.then(() => apiGateway.put<IAHBranchConfiguration>(path, options));
    } else {
      this.configurePromise = allCreateDistributionStorePromises.then(() => apiGateway.post<IAHBranchConfiguration>(path, options));
    }

    this.configureBranchStore
      .load(this.configurePromise)
      .then(
        action((config: IAHBranchConfiguration) => {
          this.configurationState = BranchConfigurationState.StartingBuild;

          let sourceVersion: string | undefined;
          // refresh branch statuses in background
          const repoStore = this.app && this.app.id && ciStore.getRepoStore(this.app.id);
          if (repoStore && this.branch) {
            repoStore.branchesStore.updateStatusLocally(this.branch, (status) => {
              status.configured = true;
              sourceVersion = status.branch && status.branch.commit && status.branch.commit.sha;
            });
            repoStore.branchesStore.refresh();
          }

          // Update sourceVersion for PR build
          if (sourceBranch && prSourceVersion) {
            sourceVersion = prSourceVersion;
          }

          // update the BranchConfigurationStore's data and state.
          this.data = config;
          this.state = ExternalDataState.Loaded;

          if (queueBuild && this.branch) {
            notifyScreenReader({ message: t("build:configure.messages.startingBuild") });
            return this.buildsStore.queueBuild(this.branch, false, sourceVersion, sourceBranch);
          }
        })
      )
      .then(
        action((build: IAHBuild | undefined) => {
          this.configurationState = BranchConfigurationState.ConfigurationComplete;
          this.queuingBuild = false;
          notifyScreenReader({ message: t("build:configure.messages.configurationComplete"), delay: 500 });

          // By default, url-parse uses querystringify to parse
          // querystringify cannot handle arrays. Use qs instead.
          // Details:
          // - https://github.com/unshiftio/url-parse/issues/70
          // - https://github.com/unshiftio/querystringify/issues/15
          const { appIds, ...query } = qs.parse(window.location.search.replace(/^\?/, "")) as any;
          const apps = (appIds || []).map((appId) => appStore.apps.find(({ id }) => id === appId));
          if (apps.includes(this.app)) {
            difference(apps, [this.app]).forEach((app) => {
              if (app) {
                notificationStore.notify({
                  persistent: true,
                  message: `You can now configure and run the ${app.os} build`,
                  buttonText: `Configure ${app.os} build`,
                  action: () => {
                    logger.info("Configure other os clicked", { scenario: "github-integration", next_os: app.os });
                    window.location.href = locationStore.getUrlWithApp(
                      `/build/branches/${encodeURIComponent(this.branch)}/setup`,
                      app,
                      {
                        ...(query[GITHUB_PR_HEAD_BRANCH] && { [GITHUB_PR_HEAD_BRANCH]: query[GITHUB_PR_HEAD_BRANCH] }),
                        ...(query[GITHUB_PR_SHA] && { [GITHUB_PR_SHA]: query[GITHUB_PR_SHA] }),
                      }
                    );
                  },
                  onDismiss: () => {
                    logger.info("Configure other os dismissed", {
                      scenario: "github-integration",
                      current_os: this.app && this.app.os,
                    });
                  },
                });
              }
            });
          }

          if (!this.app) {
            return null;
          }

          // navigate here to the build details page if we have a build
          if (build) {
            locationStore.pushWithApp("build/branches/:branch/builds/:build", this.app, {
              branch: this.branch,
              build: String(build.id),
            });
          } else if (quickSetup) {
            locationStore.pushWithApp("build/branches", this.app);
          } else {
            locationStore.pushWithApp("build/branches/:branch", this.app, { branch: this.branch });
          }

          return null;
        })
      )
      .catch(
        action((error: any) => {
          if (error && error.status === 402) {
            this.configurationState = BranchConfigurationState.LimitReached;
            notifyScreenReader({ message: t("build:configure.messages.configurationFailedLimit") });
          }
          if (error && error.status === 409) {
            // if somehow the branch is already present in the backing account but we did not detect it, we should update the existing branch
            const updateExisting = true;
            return this.configure(properties, updateExisting, quickSetup, queueBuild, sourceBranch, prSourceVersion);
          }
          this.configurationState = BranchConfigurationState.ConfigurationFailed;
          notifyScreenReader({ message: t("build:configure.messages.configurationFailed") });
        })
      );

    return this.configurePromise;
  }

  @action
  public deleteConfiguration(quickSetup?: boolean): Promise<boolean> {
    const path = this.getPathWithSlug("branches/:branch/config");
    const options = {
      params: {
        branch: this.branch,
      },
      body: {},
    } as any;

    const previousState = this.configurationState;
    this.configurationState = BranchConfigurationState.Deleting;

    this.deletePromise = apiGateway
      .delete<any>(path, options)
      .then(
        action((response: any) => {
          this.configureBranchStore = new ConfigureBranchStore();
          this.configurationState = BranchConfigurationState.Unconfigured;

          // reset our state
          this.clear();
          this.buildsStore.clear();

          // refresh branch statuses in background
          const repoStore = this.app && this.app.id && ciStore.getRepoStore(this.app.id);
          if (repoStore && this.branch) {
            repoStore.branchesStore.updateStatusLocally(this.branch, (status) => {
              status.configured = false;
              status.lastBuild = undefined;
            });
          }

          if (this.app) {
            if (quickSetup) {
              locationStore.pushWithApp("build/branches", this.app);
            } else {
              locationStore.pushWithApp("build/branches/:branch", this.app, { branch: this.branch });
            }
          }

          notifyScreenReader({ message: t("build:configure.messages.configurationDeleted"), delay: 1500 });

          return true;
        })
      )
      .catch(
        action(() => {
          this.configurationState = previousState;
          return false;
        })
      );

    return this.deletePromise;
  }

  @action
  public resetState() {
    this.configurationState = BranchConfigurationState.Unconfigured;
  }
}
