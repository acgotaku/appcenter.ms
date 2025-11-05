import { action, computed, observable, runInAction } from "mobx";
import { t } from "@root/lib/i18n";
import { IApp } from "@lib/common-interfaces";
import { appStore, locationStore } from "@root/stores";
import { apiGateway } from "@root/lib/http";
import { logger } from "@root/lib/telemetry";
import { notifyScreenReader } from "../../stores/notification-store";
import { notificationStore } from "../../stores";
import { ciStore } from "./ci-store";
import { BuildsStore } from "./builds-store";
import { BuildLogState } from "./build-logs-store";
import {
  IAHBuild,
  IAHBranchStatus,
  IAHBranchUpdate,
  IAHDistributionUpdate,
  BuildStatus,
  ReleaseDestinationWithType,
  ReleaseDestinationType,
} from "@root/data/build";
import { BranchConfigurationState } from "./branch-configuration-store";

export enum WebSocketStoreState {
  Pending = 0,
  Negotiating = 1,
  Connecting = 2,
  Open = 3,
  Closed = 4,
  Failed = 5,
}

export class WebSocketStore {
  private readonly HEARTBEAT_PAYLOAD = JSON.stringify({ type: "WEBSOCKET_HEARTBEAT_MESSAGE" });
  private readonly HEARTBEAT_INTERVAL = 45000; // Default websocket timeout is 60 seconds

  private app: IApp;
  private ws?: WebSocket;
  private heartbeatInterval: any;

  private listeners: { id: number; callback: Function }[];
  private lastGeneratedId: number;

  private watchedBuild?: { id: number; branch: string };
  private watchingRepoEvents?: boolean;

  @observable
  public state: WebSocketStoreState = WebSocketStoreState.Pending;

  @observable
  public error?: Error;

  constructor(app: IApp) {
    this.app = app;
    this.listeners = [];
    this.lastGeneratedId = 1;
  }

  @computed
  public get isFailed(): boolean {
    return this.state === WebSocketStoreState.Failed;
  }

  @computed
  public get isConnecting(): boolean {
    return this.state === WebSocketStoreState.Negotiating || this.state === WebSocketStoreState.Connecting;
  }

  @computed
  public get isOpen(): boolean {
    return this.state === WebSocketStoreState.Open;
  }

  @action
  public openWebSocket(): void {
    this.closeWebSocket();

    this.state = WebSocketStoreState.Negotiating;
    this.error = undefined;
    if (appStore.app) {
      const path = `/v0.1/apps/${appStore.app.owner.name}/${appStore.app.name}/websockets`;
      apiGateway
        .post<any[]>(path)
        .then((response: any) => {
          this.connectToWebsocket(response.url);
        })
        .catch(
          action((err) => {
            this.state = WebSocketStoreState.Failed;
            this.error = err as Error;
          })
        );
    }
  }

  @action
  private connectToWebsocket(url: string) {
    this.closeWebSocket();
    this.state = WebSocketStoreState.Connecting;

    const ws = (this.ws = new WebSocket(url));
    ws.onopen = this.onConnectionOpen;
    ws.onclose = this.onConnectionClose;
    ws.onerror = action(() => {
      this.state = WebSocketStoreState.Failed;
      this.error = new Error("WebSocket encountered an error");
    });
    ws.onmessage = this.onMessage;

    this.heartbeatInterval = setInterval(() => {
      if (!this.ws || this.ws.readyState !== this.ws.OPEN) {
        return;
      }

      try {
        this.ws.send(this.HEARTBEAT_PAYLOAD);
      } catch (err) {
        runInAction(() => {
          this.state = WebSocketStoreState.Failed;
          this.error = err as Error;
        });
      }
    }, this.HEARTBEAT_INTERVAL);
  }

  @action
  public closeWebSocket(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    if (!this.ws) {
      return;
    }

    this.ws.onopen = null;
    this.ws.onclose = null;
    this.ws.onerror = null;
    this.ws.onmessage = null;

    if (this.state === WebSocketStoreState.Open) {
      // invoke onClose manually
      this.onConnectionClose();
    }

    this.ws.close();
    this.ws = undefined;

    this.state = WebSocketStoreState.Closed;
    this.watchedBuild = undefined;
  }

  @action
  protected onConnectionOpen = (): void => {
    this.state = WebSocketStoreState.Open;

    if (this.watchingRepoEvents) {
      this.sendWatchRepoCommand();
    }

    if (this.watchedBuild) {
      this.sendWatchBuildCommand(this.watchedBuild.id);
    }
  };

  @action
  protected onConnectionClose = (ev?: CloseEvent): void => {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    if (this.state !== WebSocketStoreState.Failed) {
      this.state = WebSocketStoreState.Closed;
    } else {
      // description of error codes: https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent
      const properties = ev ? { eventCode: ev.code, eventReason: ev.reason } : undefined;
      logger.warn("Failed to close web socket connection", this.error, properties);
    }

    // do we have a watched build?
    if (this.watchedBuild) {
      const buildsStore = this.getBuildsStore(this.watchedBuild.branch);
      if (!buildsStore || buildsStore.buildLogsStore.isBuildLogCompleted(this.watchedBuild.id)) {
        return;
      }
      buildsStore.buildLogsStore.setLogState(this.watchedBuild.id, BuildLogState.Interrupted);
      const lines = buildsStore.buildLogsStore.getBuildLog(this.watchedBuild.id);
      if (!lines || lines.length === 0) {
        return;
      }
      // TODO: better way to do this
      const message = "##[warning]Build agent connection lost";
      this.appendBuildLogLines(this.watchedBuildId!, [message]);
    }
  };

  private getBuildsStore(branch: string): BuildsStore | undefined {
    const repoStore = this.app.id && ciStore.getRepoStore(this.app.id);
    if (!repoStore) {
      return;
    }
    const branchConfigStore = repoStore.getBranchConfigurationStore(branch);
    if (!branchConfigStore) {
      return;
    }

    return branchConfigStore.buildsStore;
  }

  protected onMessage = (ev: MessageEvent): void => {
    const parsed = JSON.parse(ev.data);
    if (!parsed) {
      return;
    }

    switch (parsed.type) {
      case "logConsoleLines":
        const buildId = parsed.buildId as number;
        this.appendBuildLogLines(buildId, parsed.data);
        break;

      case "buildUpdated":
        const build = parsed.data as IAHBuild;
        this.processBuildUpdate(build);
        break;

      case "branchUpdated":
        const update = parsed.data as IAHBranchUpdate;
        this.processBranchUpdate(update);
        break;

      case "branchDelete":
        this.processBranchDelete(parsed.data.name);
        break;

      case "distributionUpdated":
        this.processDistributionEvent(parsed.data);
    }
  };

  private appendBuildLogLines(buildId: number, lines: string[]) {
    if (this.watchedBuildId === buildId) {
      const buildsStore = this.watchedBuild && this.getBuildsStore(this.watchedBuild.branch);
      if (buildsStore) {
        buildsStore.buildLogsStore.appendBuildLog(buildId, lines);
      }
    }
    for (const listener of this.listeners) {
      listener.callback(lines, buildId);
    }
  }

  private processBuildUpdate(build: IAHBuild) {
    const repoStore = this.app.id && ciStore.getRepoStore(this.app.id);
    if (!repoStore) {
      return;
    }
    runInAction(() => {
      const sourceBranch = build.sourceBranch.replace(/^refs\/heads\//, "");
      const branchConfigStore = repoStore.getBranchConfigurationStore(sourceBranch);
      const buildsStore = branchConfigStore && branchConfigStore.buildsStore;
      if (branchConfigStore && branchConfigStore.configurationState !== BranchConfigurationState.Unconfigured) {
        if (buildsStore) {
          // this will update branchesStore as well
          buildsStore.updateBuildData(build);
        } else {
          repoStore.branchesStore.updateBranchLastBuild(build);
        }
      }
      if (buildsStore) {
        buildsStore.scheduleForRefresh();
      }

      if (build.status === BuildStatus.Completed && build.id === this.watchedBuildId) {
        // stop watching once we receive state update
        this.watchedBuild = undefined;

        if (buildsStore) {
          notifyScreenReader({ message: t("build:buildsStore.buildCompleted") });
          buildsStore.buildLogsStore.setLogState(build.id, BuildLogState.Completed);
        }
      }
    });
  }

  private processBranchUpdate(update: IAHBranchUpdate) {
    const repoStore = this.app.id && ciStore.getRepoStore(this.app.id);
    if (!repoStore) {
      return;
    }
    runInAction(() => {
      const branchesStore = repoStore.branchesStore;

      // cache commit info
      if (update.commitDetails) {
        repoStore.commitsStore.updateCommitInfoLocally(update.commitDetails);
      }
      // update last commit in branch status
      const found = branchesStore.updateStatusLocally(
        update.branch.name,
        (status) => {
          if (status.branch) {
            status.branch.commit = update.branch.commit;
          }
          if (update.lastBuild) {
            status.lastBuild = update.lastBuild;
          }
        },
        false
      );
      if (!found && branchesStore.data) {
        // we might have received update about a new branch
        const newStatus: IAHBranchStatus = {
          branch: update.branch,
          configured: false,
          lastBuild: update.lastBuild || undefined,
        };
        branchesStore.data.push(newStatus);
      }

      // and update builds
      const buildsStore = this.getBuildsStore(update.branch.name);
      if (update.lastBuild && buildsStore) {
        buildsStore.updateBuildData(update.lastBuild);
      }
    });
  }

  private processBranchDelete(branch: string) {
    const repoStore = this.app.id && ciStore.getRepoStore(this.app.id);
    if (!repoStore) {
      return;
    }
    runInAction(() => {
      const branchesStore = repoStore.branchesStore;
      if (!branchesStore.data) {
        return;
      }
      const idx = branchesStore.data.findIndex((status) => {
        return status.branch && status.branch.name === branch;
      });
      if (idx < 0) {
        return;
      }
      branchesStore.data.splice(idx, 1);

      // navigate away if the client is looking at this branch
      if (window && window.location && window.location.pathname.indexOf("/build/branches/" + encodeURIComponent(branch)) >= 0) {
        locationStore.pushWithApp("build/branches", this.app);
      }
    });
  }

  private processDistributionEvent(update: IAHDistributionUpdate) {
    const repoStore = this.app.id && ciStore.getRepoStore(this.app.id);
    if (!repoStore) {
      return;
    }

    if (update.status === "error") {
      logger.info("build-distribution-failure", update.details);
    }
    const wasUpdated = repoStore.distributionUploadStore.updateUploadStatus(update.uploadId, update.status);
    if (wasUpdated) {
      const uploadData = repoStore.distributionUploadStore.getUploadData(update.uploadId);
      const successful = update.status === "success";
      const errorMessage = (update.status === "error" && update.details && update.details.message) || "";
      let buttonProps = {};
      if (successful && uploadData && uploadData.destinations && this.isStoreDistribution(uploadData.destinations)) {
        buttonProps = {
          buttonText: t("build:distribute.storeReleaseStatusButtonText"),
          action: () => {
            locationStore.pushWithCurrentApp("distribute/distribution-stores/:name/releases/:id", {
              name: uploadData.destinations![0].name,
              id: update.details.releaseId,
            });
          },
        };
      }
      notificationStore.notify({
        persistent: true,
        message: successful
          ? t("build:distribute.buildDistributeSuccess", { buildId: uploadData && uploadData.buildId })
          : t("build:distribute.buildDistributeFailure", { buildId: uploadData && uploadData.buildId, errorMessage: errorMessage }),
        ...buttonProps,
      });
    }
  }

  private isStoreDistribution(destinations: ReleaseDestinationWithType[]) {
    return destinations && destinations[0] && destinations[0].type === ReleaseDestinationType.Store;
  }

  protected sendPayload(payload: any): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return false;
    }

    this.ws.send(JSON.stringify(payload));
    return true;
  }

  private sendWatchBuildCommand(buildId: number) {
    this.sendPayload({ method: "subscribe", buildId: buildId });
  }

  private sendWatchRepoCommand() {
    this.sendPayload({ method: "watch-repo" });
  }

  @action
  public subscribeToBuild(branch: string, buildId: number) {
    if (!branch || !Number.isInteger(buildId)) {
      return;
    }
    // connect if we're not
    if (!this.isOpen && !this.isConnecting) {
      this.openWebSocket();
    }

    if (this.watchedBuild && this.watchedBuild.id === buildId) {
      return;
    }
    this.watchedBuild = { id: buildId, branch: branch };

    if (!Number.isInteger(buildId)) {
      return;
    }
    this.sendWatchBuildCommand(buildId);
  }

  public get watchedBuildId(): number | undefined {
    return this.watchedBuild && this.watchedBuild.id;
  }

  @action
  public watchRepository() {
    if (!this.isOpen && !this.isConnecting) {
      this.openWebSocket();
    }

    this.watchingRepoEvents = true;

    this.sendWatchRepoCommand();
  }

  public unwatchRepository() {
    this.watchingRepoEvents = false;
  }

  public get watchingRepository(): boolean {
    return !!this.watchingRepoEvents;
  }

  public addConsoleListener(listener: (lines: string[], buildId: number) => void): number {
    const listenerId = this.lastGeneratedId++;
    const listenerObject = {
      id: listenerId,
      callback: listener,
    };
    this.listeners.push(listenerObject);
    return listenerId;
  }

  public removeConsoleListener(listenerId: number) {
    if (listenerId <= 0) {
      return;
    }
    const index = this.listeners.findIndex((item) => item.id === listenerId);
    if (index < 0) {
      return;
    }

    this.listeners.splice(index, 1);
  }
}
