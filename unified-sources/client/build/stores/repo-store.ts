import { action, computed, reaction, when, autorun, observable, ObservableMap } from "mobx";
import { ExternalDataState, DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore } from "@root/shared";
import { IApp } from "@lib/common-interfaces";
import { userStore, appStore, locationStore, browserStore } from "@root/stores";
import { apiGateway } from "@root/lib/http";
import { CIBaseStore } from "./ci-base-store";
import { BranchesStore } from "./branches-store";
import { BranchConfigurationStore } from "./branch-configuration-store";
import { CommitsStore } from "./commits-store";
import { DistributionGroupsStore } from "./distribution-groups-store";
import { DistributionStoresStore } from "./distribution-stores-store";
import { DistributionUploadStore } from "./distribution-upload-store";
import { ProjectsStore } from "./projects-store";
import { WebSocketStore } from "./websocket-store";
import { IAHRepoConfig, IAHBranchStatus } from "@root/data/build";
import { SourceHostStore, RepoProviderState } from "./source-host-store";
import { noop } from "lodash";

export class ConfigureRepoStore extends DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore<any> {
  constructor() {
    super();

    // default state should be Loaded for non-fetch operations
    this.state = ExternalDataState.Loaded;
  }

  @observable
  public hasValidPermissions?: boolean;

  @computed
  get hasInvalidPermissions() {
    return this.hasValidPermissions === false;
  }

  @action
  public setHasValidPermissions(hasValidPermissions: boolean) {
    this.hasValidPermissions = hasValidPermissions;
  }

  public load(dataPromise: Promise<any>) {
    return super.load(dataPromise);
  }
}

export class UnconfigureRepoStore extends DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore<any> {
  constructor() {
    super();

    // default state should be Loaded for non-fetch operations
    this.state = ExternalDataState.Loaded;
  }

  public load(dataPromise: Promise<any>) {
    return super.load(dataPromise);
  }
}

export class RepoStore extends CIBaseStore<IAHRepoConfig | undefined> {
  private checkIsConfiguredPromise?: Promise<IAHRepoConfig | undefined>;
  private configureRepoPromise?: Promise<any>;
  private unconfigureRepoPromise?: Promise<any>;

  private branchConfigurationStores: ObservableMap<string, BranchConfigurationStore> = observable.map<
    string,
    BranchConfigurationStore
  >();
  private projectsStores: ObservableMap<string, ProjectsStore> = observable.map<string, ProjectsStore>();

  public branchesStore: BranchesStore;
  public commitsStore: CommitsStore;
  public distributionGroupsStore: DistributionGroupsStore;
  public distributionStoresStore: DistributionStoresStore;
  public distributionUploadStore: DistributionUploadStore;
  public configureRepoStore: ConfigureRepoStore;
  public unconfigureRepoStore: UnconfigureRepoStore;
  public websocketStore: WebSocketStore;

  private buildsPrefetchDisposer: any;
  private watchRepoDisposer: any;
  private focusAutorunDisposer: any;

  constructor(app: IApp) {
    super(app);

    this.branchesStore = new BranchesStore(app);
    this.commitsStore = new CommitsStore(app);
    this.distributionGroupsStore = new DistributionGroupsStore(app);
    this.distributionStoresStore = new DistributionStoresStore(app);
    this.distributionUploadStore = new DistributionUploadStore();
    this.configureRepoStore = new ConfigureRepoStore();
    this.unconfigureRepoStore = new UnconfigureRepoStore();
    this.websocketStore = new WebSocketStore(app);

    reaction(
      () => this.currentBranchStatus,
      (status) => {
        if (status) {
          this.setCurrentBranchConfigurationStore(status);
        }
      },
      { name: "configReloader" }
    );
  }

  @computed
  public get isConfigured(): boolean | null {
    if (!this.isLoaded) {
      return null;
    }

    return !!this.data;
  }

  @action
  public checkIsConfigured(background: boolean = false, skipBranchesRefresh: boolean = false): Promise<void> {
    const path = this.getPathWithSlug("repo_config");
    this.checkIsConfiguredPromise = apiGateway
      .get<IAHRepoConfig[]>(path, { params: { includeInactive: "true" } })
      .then((body) => {
        let isConfigured = false;
        let activeRepo: IAHRepoConfig | undefined;
        if (Array.isArray(body)) {
          activeRepo = body.find((item) => item.state === "active");
          isConfigured = !!activeRepo && !!activeRepo.id;
          body.forEach((item) => {
            if (item.state === "unauthorized") {
              SourceHostStore.forSourceHost(item.type).setProviderState(RepoProviderState.Unauthorized);
            }
          });
        }

        if (isConfigured) {
          if (!skipBranchesRefresh) {
            // refresh branches
            this.branchesStore.refresh();
          }

          return activeRepo;
        } else {
          return;
        }
      });

    if (background) {
      return this.loadInBackgroundVoid(this.checkIsConfiguredPromise);
    } else {
      return this.loadVoid(this.checkIsConfiguredPromise);
    }
  }

  @computed
  public get isConfiguring(): boolean {
    return this.configureRepoStore.isPending;
  }

  @action
  public configureRepo(
    repoUrl: string,
    repoProvider?: string,
    repoId?: string,
    externalUserId?: string,
    serviceConnectionId?: string,
    hasValidProjectAccess?: boolean
  ): Promise<void> {
    this.configureRepoStore.setHasValidPermissions(!!hasValidProjectAccess);

    const requestOpts = {
      body: {
        user_id: userStore.currentUser.id,
        repo_url: repoUrl,
        repo_provider: repoProvider,
        repo_id: repoId && `${repoId}`,
        external_user_id: externalUserId && `${externalUserId}`,
        service_connection_id: serviceConnectionId && `${serviceConnectionId}`,
      },
    };

    const app = JSON.parse(JSON.stringify(appStore.app));

    const path = this.getPathWithSlug("repo_config");
    this.configureRepoPromise = apiGateway.post(path, requestOpts);

    return this.configureRepoStore
      .load(this.configureRepoPromise)
      .then(() => {
        this.clear();

        const updatedApp: IApp = Object.assign({}, app);
        const repo = (updatedApp.repositories || []).find((item) => {
          return item.repo_url === repoUrl;
        });
        if (!repo) {
          if (!updatedApp.repositories) {
            updatedApp.repositories = [];
          }
          updatedApp.repositories.push({ repo_url: repoUrl });
        }
        appStore.updateAppInAppsList(app, updatedApp);
        if (this.app) {
          locationStore.pushWithApp("build/branches", this.app);
        }
      })
      .catch(noop);
  }

  @computed
  public get isRemovingConfiguration(): boolean {
    return this.unconfigureRepoStore.isPending;
  }

  @action
  public unconfigureRepo(flushCache: boolean = false): Promise<any> {
    // check if we're already unconfigured.
    if (this.isConfigured !== true) {
      return Promise.resolve();
    }

    if (flushCache) {
      this.branchesStore.clear();
    }

    const app = JSON.parse(JSON.stringify(appStore.app));

    const path = this.getPathWithSlug("repo_config");
    this.unconfigureRepoPromise = apiGateway.delete(path).then(() => {
      this.clear();
      // clear caches
      this.branchConfigurationStores.clear();
      this.branchesStore.clear();

      const updatedApp: IApp = Object.assign({}, app);
      updatedApp.repositories = [];
      appStore.updateAppInAppsList(app, updatedApp);

      return this.checkIsConfigured().then(() => {
        if (this.app) {
          locationStore.pushWithApp("build/connect", this.app);
        }
      });
    });

    return this.unconfigureRepoStore.load(this.unconfigureRepoPromise);
  }

  @observable
  private currentBranch?: string;

  @computed get currentBranchStatus(): IAHBranchStatus | undefined {
    if (!this.branchesStore.data || !this.currentBranch) {
      return;
    }

    return this.branchesStore.data.find((branchStatus: IAHBranchStatus) => {
      return branchStatus.branch && branchStatus.branch.name === this.currentBranch;
    });
  }

  @action
  public setCurrentBranch(branch: string | undefined) {
    this.currentBranch = branch;
  }

  @observable
  public currentBranchConfigurationStore?: BranchConfigurationStore;

  @action
  public setCurrentBranchConfigurationStore(branchStatus: IAHBranchStatus): BranchConfigurationStore | undefined {
    if (!branchStatus) {
      this.currentBranchConfigurationStore = undefined;
      return;
    }
    // check if we have this store cached
    let branchConfigurationStore = branchStatus.branch && this.branchConfigurationStores.get(branchStatus.branch.name);
    if (branchConfigurationStore) {
      if (this.currentBranchConfigurationStore === branchConfigurationStore) {
        // if nothing changed, don't bother
        return;
      }
      this.currentBranchConfigurationStore = branchConfigurationStore;
      if (branchStatus.configured) {
        // kick off a refresh in the background
        branchConfigurationStore.fetch(true);
      }
    } else {
      branchConfigurationStore = this.currentBranchConfigurationStore =
        branchStatus.branch && this.getOrCreateBranchConfigurationStore(branchStatus.branch.name);
      if (branchStatus.configured && branchConfigurationStore) {
        branchConfigurationStore.fetch();
      }
    }
    return branchConfigurationStore;
  }

  private getOrCreateBranchConfigurationStore(branch: string): BranchConfigurationStore {
    let branchConfigurationStore = this.branchConfigurationStores.get(branch);
    if (branchConfigurationStore) {
      return branchConfigurationStore;
    }
    branchConfigurationStore = new BranchConfigurationStore(this.app!, branch);
    this.branchConfigurationStores.set(branch, branchConfigurationStore);
    return branchConfigurationStore;
  }

  public getBranchConfigurationStore(branch: string): BranchConfigurationStore | undefined {
    return branch ? this.branchConfigurationStores.get(branch) : undefined;
  }

  @observable
  public currentProjectsStore?: ProjectsStore;

  @action
  public setCurrentProjectsStore(branch: string): ProjectsStore {
    // check if we have this store cached
    let projectsStore = this.projectsStores.get(branch);
    if (projectsStore) {
      this.currentProjectsStore = projectsStore;
    } else {
      this.currentProjectsStore = projectsStore = new ProjectsStore(this.app!, branch);
      this.projectsStores.set(branch, projectsStore);
    }
    // unlike most places, this doesn't auto-fetch
    return projectsStore;
  }

  public prefetchBuildsOnce(cancelBranchesRefresh: boolean = true): void {
    if (this.buildsPrefetchDisposer) {
      this.buildsPrefetchDisposer();
      this.buildsPrefetchDisposer = null;
    }

    this.buildsPrefetchDisposer = when(
      () => {
        return this.branchesStore.isLoaded;
      },
      () => {
        // run a speculative prefetch
        const branches = this.branchesStore.data;
        if (!branches) {
          return;
        }
        const configuredBranches = branches.filter((branch) => {
          return branch.configured;
        });
        configuredBranches.sort((a: IAHBranchStatus, b: IAHBranchStatus) => {
          if (a.lastBuild && !b.lastBuild) {
            return -1;
          }

          if (!a.lastBuild && b.lastBuild) {
            return 1;
          }

          // neither have lastBuild
          if (!a.lastBuild && a.branch && b.branch) {
            return a.branch.name.localeCompare(b.branch.name);
          }

          // both have lastBuild
          const aTime = a.lastBuild!.finishTime || a.lastBuild!.startTime || a.lastBuild!.queueTime;
          const bTime = b.lastBuild!.finishTime || b.lastBuild!.startTime || b.lastBuild!.queueTime;

          return Date.parse(bTime) - Date.parse(aTime);
        });

        for (let i = 0; i < 2 && i < configuredBranches.length; i++) {
          const branchName = configuredBranches[i].branch!.name;
          const branchConfigurationStore = this.getOrCreateBranchConfigurationStore(branchName);
          branchConfigurationStore.buildsStore.refreshBuilds(cancelBranchesRefresh);
        }
      },
      { name: "buildsPrefetcher" }
    );
  }

  public watchRepositoryAfterLoad(): void {
    this.disableRepositoryWatching();

    this.watchRepoDisposer = when(
      () => {
        return this.branchesStore.isLoaded;
      },
      () => {
        this.websocketStore.watchRepository();
      },
      { name: "watchRepoAwaiter" }
    );
  }

  public disableRepositoryWatching(): void {
    if (this.watchRepoDisposer) {
      this.watchRepoDisposer();
      this.watchRepoDisposer = null;
    }

    this.websocketStore.unwatchRepository();
  }

  public enableFocusRefresh(): void {
    this.disableFocusRefresh();

    this.focusAutorunDisposer = autorun(
      () => {
        if (!browserStore.focused) {
          return;
        }

        const refreshDelta = this.branchesStore.lastFetchToNow();
        // do refresh if last refresh was over 60 seconds ago, and websocket is down
        if (!refreshDelta || refreshDelta < 60 * 1000) {
          return;
        }
        const websocketWatchAlive = this.websocketStore.isOpen && this.websocketStore.watchingRepository;

        // we don't do builds over websocket yet, so refresh those
        if (this.currentBranchConfigurationStore) {
          this.currentBranchConfigurationStore.buildsStore.refreshBuilds();
        }

        // no need to refresh branches if websocket is watching
        if (websocketWatchAlive) {
          // if we had reliable build updates we could return here, but we don't
          // return;
        }

        this.branchesStore.refresh();
      },
      { name: "focusRefresher" }
    );
  }

  public disableFocusRefresh(): void {
    if (this.focusAutorunDisposer) {
      this.focusAutorunDisposer();
      this.focusAutorunDisposer = null;
    }
  }

  @computed
  public get hasNonUniqueBranches(): boolean {
    if (this.branchesStore && this.branchesStore.data && this.branchesStore.isLoaded) {
      return this.branchesStore.data.some((branch1, i1) => {
        return this.branchesStore.data!.some((branch2, i2) => {
          if (i1 !== i2) {
            return branch1.branch!.name.toLocaleLowerCase() === branch2.branch!.name.toLocaleLowerCase();
          }
        });
      });
    }
    return false;
  }
}
