import { observable, action, computed } from "mobx";
import { IApp } from "@lib/common-interfaces";
import { CIBaseStore } from "./ci-base-store";

import { RepoStore } from "./repo-store";
import { XcodeVersionsStore } from "./xcode-versions-store";
import { XamarinSDKBundlesStore } from "./xamarin-sdk-bundles-store";
import { NodeVersionsStore } from "./node-versions-store";
import { DestinationWrapper } from "@root/distribute/models/destination-wrapper";
import { DistributeSourceType } from "@root/distribute/stores/wizard-store";
import { CommonDistributionSummaryStore } from "@root/stores/common-distribution-summary-store";

/**
 * Store for CI beacon.
 */
export class CIStore extends CommonDistributionSummaryStore {
  private repoStores: { [appId: string]: RepoStore | undefined } = {};
  private xcodeVersions: { [appId: string]: XcodeVersionsStore } = {};
  private xamarinSDKBundles: { [appId: string]: XamarinSDKBundlesStore } = {};
  private nodeVersions: { [appId: string]: NodeVersionsStore } = {};

  public source: DistributeSourceType = DistributeSourceType.Branch;

  @computed
  // @ts-ignore
  get branch(): string | undefined {
    return (
      this.currentRepoStore &&
      this.currentRepoStore.currentBranchConfigurationStore &&
      this.currentRepoStore.currentBranchConfigurationStore.branch
    );
  }

  @computed
  get iconUrl(): string | undefined {
    return this.currentRepoStore && this.currentRepoStore.app && this.currentRepoStore.app.icon_url;
  }

  @observable
  public currentRepoStore?: RepoStore;

  @observable private selectedGroups = observable.array<DestinationWrapper>();
  @observable private selectedTesters = observable.array<DestinationWrapper>();

  @computed
  get destinations(): DestinationWrapper[] {
    return [...this.selectedGroups, ...this.selectedTesters];
  }

  @action
  public setCurrentRepoStore(app: IApp): RepoStore | undefined {
    if (!app || !app.id) {
      return;
    }

    if (this.currentRepoStore) {
      this.currentRepoStore.disableFocusRefresh();
    }

    const hasLinkedRepo = app.repositories && app.repositories.length > 0;

    // check if we have this store cached and app was not transfered or renamed
    let repoStore = this.repoStores[app.id];
    if (repoStore && this.storeAppIsUnchanged(repoStore, app)) {
      this.currentRepoStore = repoStore;
      // kick off a refresh in the background
      repoStore.checkIsConfigured(true, hasLinkedRepo);
    } else {
      this.repoStores[app.id] = this.currentRepoStore = repoStore = new RepoStore(app);
      repoStore.checkIsConfigured(false, hasLinkedRepo);
    }

    if (hasLinkedRepo) {
      repoStore.branchesStore.refresh();
    }

    return repoStore;
  }

  @action
  public closeCurrentRepoStore(): void {
    if (this.currentRepoStore) {
      this.currentRepoStore.disableFocusRefresh();
      this.currentRepoStore.disableRepositoryWatching();
      this.currentRepoStore.websocketStore.closeWebSocket();
      this.currentRepoStore.distributionGroupsStore.clearLastFetch();
    }
  }

  public getRepoStore(appId: string): RepoStore | undefined {
    return this.repoStores[appId];
  }

  @action
  public disposeRepoStore(app: IApp): void {
    if (app && app.id) {
      this.repoStores[app.id] = undefined;
    }
  }

  @observable
  public currentXcodeVersionsStore?: XcodeVersionsStore;

  @action
  public setCurrentXcodeVersionsStore(app: IApp, noFetch: boolean = false): XcodeVersionsStore | undefined {
    if (!app.id) {
      return;
    }

    // check if we have this store cached
    let xcodeVersionStore = this.xcodeVersions[app.id];
    let bgFetch = false;
    if (xcodeVersionStore && this.storeAppIsUnchanged(xcodeVersionStore, app)) {
      this.currentXcodeVersionsStore = xcodeVersionStore;
      bgFetch = true;
    } else {
      this.xcodeVersions[app.id] = this.currentXcodeVersionsStore = xcodeVersionStore = new XcodeVersionsStore(app);
    }
    if (!noFetch) {
      xcodeVersionStore.fetchVersions(bgFetch);
    }
    return xcodeVersionStore;
  }

  @observable
  public currentXamarinSDKBundlesStore?: XamarinSDKBundlesStore;

  @action
  public setCurrentXamarinSDKBundlesStore(app: IApp, noFetch: boolean = false): XamarinSDKBundlesStore | undefined {
    if (!app.id) {
      return;
    }

    // check if we have this store cached
    let xamarinSDKBundlesStore = this.xamarinSDKBundles[app.id];
    let bgFetch = false;
    if (xamarinSDKBundlesStore && this.storeAppIsUnchanged(xamarinSDKBundlesStore, app)) {
      this.currentXamarinSDKBundlesStore = xamarinSDKBundlesStore;
      bgFetch = true;
    } else {
      this.xamarinSDKBundles[app.id] = this.currentXamarinSDKBundlesStore = xamarinSDKBundlesStore = new XamarinSDKBundlesStore(app);
    }
    if (!noFetch) {
      xamarinSDKBundlesStore.fetchVersions(bgFetch);
    }
    return xamarinSDKBundlesStore;
  }

  @observable
  public currentNodeVersionsStore?: NodeVersionsStore;

  @action
  public setCurrentNodeVersionsStore(app: IApp, noFetch: boolean = false): NodeVersionsStore | undefined {
    if (!app.id) {
      return;
    }

    let nodeVersionsStore = this.nodeVersions[app.id];
    let bgFetch = false;
    if (nodeVersionsStore && this.storeAppIsUnchanged(nodeVersionsStore, app)) {
      this.currentNodeVersionsStore = nodeVersionsStore;
      bgFetch = true;
    } else {
      this.nodeVersions[app.id] = this.currentNodeVersionsStore = nodeVersionsStore = new NodeVersionsStore(app);
    }
    if (!noFetch) {
      nodeVersionsStore.fetchVersions(bgFetch);
    }
    return nodeVersionsStore;
  }

  private storeAppIsUnchanged(store: CIBaseStore<any>, app: IApp) {
    return store.app && store.app.owner && app.owner && store.app.owner.name === app.owner.name && store.app.name === app.name;
  }
}

// Export the ciStore store
export const ciStore = new CIStore();
