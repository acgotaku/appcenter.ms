import { action, set, observable, computed } from "mobx";
import { t } from "@root/lib/i18n";
import { ExternalDataState, DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore } from "@root/shared";
import { IApp } from "@lib/common-interfaces";
import { notifyScreenReader } from "@root/stores";
import { locationStore } from "@root/stores";
import { apiGateway } from "@root/lib/http";
import { CIBaseStore } from "./ci-base-store";
import { ciStore } from "./ci-store";
import { BuildLogsStore, BuildLogState } from "./build-logs-store";
import { BuildDistributionStore } from "./build-distribution-store";

import { IAHBuild, IAHBuildLog, BuildStatus, ReleaseDestinationWithType, DistributionResponse } from "@root/data/build";
import { noop } from "lodash";

const MAX_PREFETCHED_COMMITS = 30;

export class QueueBuildStore extends DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore<IAHBuild> {
  constructor() {
    super();

    // default state should be Loaded for non-fetch operations
    this.state = ExternalDataState.Loaded;
  }

  public load(dataPromise: Promise<IAHBuild>) {
    return super.load(dataPromise);
  }
}

export class UpdateBuildStore extends DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore<IAHBuild> {
  constructor() {
    super();

    // default state should be Loaded for non-fetch operations
    this.state = ExternalDataState.Loaded;
  }

  public load(dataPromise: Promise<IAHBuild>) {
    return super.load(dataPromise);
  }
}

export class DistributeBuildStore extends DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore<any> {
  constructor() {
    super();

    // default state should be Loaded for non-fetch operations
    this.state = ExternalDataState.Loaded;
  }

  public reset() {
    this.setState(ExternalDataState.Loaded);
  }

  public loadVoid(dataPromise: Promise<any>) {
    return super.loadVoid(dataPromise);
  }
}

/**
 * BuildsStore fetches and stores the builds for a given app
 */
export class BuildsStore extends CIBaseStore<IAHBuild[]> {
  private fetchPromise?: Promise<IAHBuild[]>;
  private fetchBuildDetailsPromise?: Promise<void>;
  private fetchBuildLogPromise?: Promise<string[]>;
  private updateBuildPromise?: Promise<IAHBuild>;
  private queueBuildPromise?: Promise<IAHBuild>;

  public queueBuildStore: QueueBuildStore;
  public updateBuildStore: UpdateBuildStore;
  public buildDistributionStore: BuildDistributionStore;
  public buildLogsStore: BuildLogsStore;
  public distributeBuildStore: DistributeBuildStore;

  private branch?: string;
  private needsRefresh: boolean;

  constructor(app: IApp, branch: string) {
    super(app);

    this.branch = branch;

    this.queueBuildStore = new QueueBuildStore();
    this.updateBuildStore = new UpdateBuildStore();
    this.distributeBuildStore = new DistributeBuildStore();
    this.buildDistributionStore = new BuildDistributionStore(app);
    this.buildLogsStore = new BuildLogsStore();
    this.needsRefresh = false;
  }

  @action
  public fetchBuilds(background: boolean = false, cancelBranchesRefresh: boolean = true): Promise<void> {
    const path = this.getPathWithSlug("branches/:branch/builds");
    this.fetchPromise = apiGateway
      .get<IAHBuild[]>(path, {
        params: {
          branch: this.branch || "",
        },
      })
      .then((builds: IAHBuild[]) => {
        if (Array.isArray(builds)) {
          // sort the builds, cause the backend doesn't do it always
          builds = builds.sort((a: IAHBuild, b: IAHBuild) => {
            return b.id - a.id;
          });

          const repoStore = this.app && this.app.id && ciStore.getRepoStore(this.app.id);
          if (repoStore) {
            // preload commit info (though not necessarily all of it)
            for (let i = 0; i < builds.length && i < MAX_PREFETCHED_COMMITS; i++) {
              repoStore.commitsStore.ensureCommitInfo(builds[i].sourceVersion);
            }
          }
          this.updateBranchLastBuild(builds[0], cancelBranchesRefresh);
        }
        return builds;
      });

    if (background) {
      return this.loadInBackgroundVoid(this.fetchPromise);
    } else {
      return this.loadVoid(this.fetchPromise);
    }
  }

  @action
  public refreshBuilds(cancelBranchesRefresh: boolean = true) {
    if (this.fetchPromise && this.fetchPromise.isPending()) {
      return;
    }

    this.fetchBuilds(!this.isPending, cancelBranchesRefresh);
  }

  public scheduleForRefresh() {
    this.needsRefresh = true;
  }

  @action
  public refreshBuildsIfNeeded(slowTick: boolean = false, cancelBranchesRefresh: boolean = true) {
    // Since there is no event for the transition from "queued" to "building", we need to poll
    if (
      slowTick &&
      this.data?.some((build: IAHBuild, index: number, array: IAHBuild[]) => {
        return build.status !== BuildStatus.Completed;
      })
    ) {
      this.needsRefresh = true;
    }

    if (!this.needsRefresh) {
      return;
    }

    this.needsRefresh = false;
    this.refreshBuilds(cancelBranchesRefresh);
  }

  @action
  public updateBuildData(build: IAHBuild) {
    // find the build in data or add it if it doesn't exist.
    const existingBuild = this.getBuildById(build.id);

    if (existingBuild) {
      set(existingBuild, build);
    } else {
      if (!this.data) {
        this.data = [];
        if (this.isPending) {
          this.setState(ExternalDataState.Loaded);
        }
      }
      this.data.unshift(build);
    }

    // also update status in branchesStore, but TODO: change things, so we don't need to do this
    this.updateBranchLastBuild(build);
  }

  private updateBranchLastBuild(build: IAHBuild, cancelBranchesRefresh: boolean = true) {
    if (!build) {
      return;
    }
    const repoStore = this.app && this.app.id && ciStore.getRepoStore(this.app.id);
    if (repoStore) {
      repoStore.branchesStore.updateBranchLastBuild(build, cancelBranchesRefresh);
    }
  }

  private _lastBuildDetailsId?: number;

  @action
  public fetchBuildDetails(buildId: number): Promise<void> {
    if (this.fetchBuildDetailsPromise) {
      if (this.fetchBuildDetailsPromise.isPending() && this._lastBuildDetailsId === buildId) {
        return this.fetchBuildDetailsPromise;
      }
    }

    this._lastBuildDetailsId = buildId;

    const path = this.getPathWithSlug("builds/:build_id");
    this.fetchBuildDetailsPromise = apiGateway
      .get<IAHBuild>(path, {
        params: {
          build_id: String(buildId),
        },
      })
      .then((build: IAHBuild) => {
        this.updateBuildData(build);
      }, noop);

    return this.fetchBuildDetailsPromise;
  }

  @observable private currentBuildId?: number;

  @action
  public setCurrentBuildId(buildId: number) {
    this.currentBuildId = buildId;
  }

  @computed get currentBuild(): IAHBuild | undefined {
    // make it pretty explicit what we're observing
    const buildId = this.currentBuildId;
    const arr = this.data || [];
    if (!buildId || arr.length === 0) {
      return;
    }

    return this.getBuildById(buildId);
  }

  public getBuildById(buildId: number): IAHBuild | undefined {
    return (this.data || []).find((item: IAHBuild) => {
      return item.id === buildId;
    });
  }

  @action
  public queueBuild(branch: string, redirect: boolean = false, sourceVersion?: string, sourceBranch?: string): Promise<IAHBuild> {
    const repoStore = this.app && this.app.id && ciStore.getRepoStore(this.app.id);
    if (repoStore) {
      // we'll want to subscribe to the build, pre-open ws connection
      const wsStore = repoStore.websocketStore;
      if (!wsStore.isConnecting && !wsStore.isOpen) {
        wsStore.openWebSocket();
      }
    }

    const path = this.getPathWithSlug("branches/:branch/builds");
    const buildRequest = {
      params: {
        branch: branch,
      },
      body: {
        sourceVersion: sourceVersion,
      },
    };

    if (sourceBranch) {
      buildRequest.body["sourceBranch"] = sourceBranch;
      buildRequest.body["buildReason"] = "pullRequest";
    }

    this.queueBuildPromise = apiGateway
      .post<IAHBuild>(path, buildRequest)
      .then((build: IAHBuild) => {
        this.updateBuildData(build);

        if (repoStore) {
          repoStore.websocketStore.subscribeToBuild(branch, build.id);
        }

        if (redirect) {
          // only redirect if we're still on the /builds/start page
          const currentPath = window.location.pathname;
          if (this.app && currentPath && currentPath.endsWith("/start")) {
            locationStore.pushWithApp("build/branches/:branch/builds/:build_id", this.app, {
              branch: branch,
              build_id: String(build.id),
            });
          }
        }

        return build;
      })
      .catch((err) => {
        if (this.app) {
          locationStore.pushWithApp("build/branches/:branch/builds/start", this.app, { branch: branch });
        }

        throw err;
      });

    this.queueBuildStore.load(this.queueBuildPromise);

    return this.queueBuildPromise;
  }

  @action
  public cancelBuild(buildId: number): Promise<IAHBuild> {
    const payload = {
      status: BuildStatus.Cancelling,
    };
    return this.updateBuild(buildId, payload).then((): any => {
      notifyScreenReader({ message: t("build:buildsStore.buildCanceled") });
    });
  }

  @action
  public updateBuild(buildId: number, payload: any): Promise<IAHBuild> {
    const path = this.getPathWithSlug("builds/:build_id");
    const options = {
      params: {
        build_id: String(buildId),
      },
      body: payload,
    } as any;

    this.updateBuildPromise = apiGateway.patch<IAHBuild>(path, options).then((build: IAHBuild) => {
      this.updateBuildData(build);
      return build;
    });

    this.updateBuildStore.load(this.updateBuildPromise);

    return this.updateBuildPromise;
  }

  private _lastBuildLogId?: number;

  @action
  public fetchBuildLog(buildId: number): Promise<string[]> {
    if (this.fetchBuildLogPromise) {
      if (this.fetchBuildLogPromise.isPending() && this._lastBuildLogId === buildId) {
        return this.fetchBuildLogPromise;
      }
    }

    this._lastBuildLogId = buildId;

    const path = this.getPathWithSlug("builds/:build_id/logs");
    const options = {
      params: {
        build_id: String(buildId),
      },
    } as any;

    this.fetchBuildLogPromise = apiGateway
      .get<IAHBuildLog>(path, options)
      .then((logContainer: IAHBuildLog) => {
        let linesArr: string[] = logContainer.value || [];
        // TODO: reconsider removing the timestamps
        linesArr = linesArr.map((line) => line.replace(/^\d{4}-\d{2}-\d{2}T[0-9:.]{16}Z /, ""));
        this.buildLogsStore.assignBuildLog(buildId, linesArr);
        return linesArr;
      })
      .catch((err) => {
        if (err && err.status === 404) {
          this.buildLogsStore.assignBuildLog(buildId, [], BuildLogState.Failure);
        }
        return [];
      });

    return this.fetchBuildLogPromise;
  }

  public getDownloadUrl(buildId: number, downloadType: string): string {
    return this.getPathWithSlug(`builds/${buildId}/downloads/${downloadType}`);
  }

  public distributeBuild(
    buildId: number,
    destinations: ReleaseDestinationWithType[],
    releaseNotes: string,
    notifyTesters: boolean,
    mandatoryUpdate: boolean
  ): Promise<void> | undefined {
    if (!Array.isArray(destinations) || destinations.length === 0) {
      return;
    }

    const path = this.getPathWithSlug("builds/:build_id/distribute");
    const body = {
      destinations: destinations,
      releaseNotes: releaseNotes || "",
      mandatoryUpdate: mandatoryUpdate,
      notifyTesters: notifyTesters,
    };
    const options = {
      body: body,
      params: {
        build_id: String(buildId),
      },
    };

    const promise = apiGateway.post<DistributionResponse>(path, options).then((backgroundTask) => {
      const repoStore = this.app && this.app.id && ciStore.getRepoStore(this.app.id);
      const uploadId = backgroundTask.upload_id;
      if (repoStore && this.branch) {
        repoStore.distributionUploadStore.addUpload(uploadId, backgroundTask.status, buildId, this.branch, destinations);
      }
      this.buildDistributionStore.associateUpload(buildId, uploadId);
      if (this.app) {
        locationStore.pushWithApp("build/branches/:branch/builds/:build_id", this.app, {
          branch: this.branch,
          build_id: String(buildId),
        });
      }
      return backgroundTask;
    });

    return this.distributeBuildStore.loadVoid(promise);
  }
}
