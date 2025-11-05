import { appStore, locationStore } from "@root/stores";
import { observable, computed, action } from "mobx";
import { ServiceConnectionDialogFormUIStore } from "@root/management/app-settings/services/service-connection-dialog-form-ui-store";
import { recentReleasesFetchStore } from "@root/data/distribute/stores/recent-releases-fetch-store";
import { ApiBasicReleaseDetailsResponse } from "@root/api/clients/releases/api";

export class OverviewUIStore {
  @observable public gettingStartedLoading = true;
  @observable public appQRCodeDialogVisible = false;
  @observable public isReleasesFetched = false;
  public serviceConnectionDialogFormUIStore: ServiceConnectionDialogFormUIStore = new ServiceConnectionDialogFormUIStore();

  @computed get isLoading(): boolean {
    return recentReleasesFetchStore.isPending;
  }

  @computed get isLoadingContent(): boolean {
    return this.gettingStartedLoading;
  }

  @computed get latestRelease(): ApiBasicReleaseDetailsResponse | undefined {
    return recentReleasesFetchStore.data && recentReleasesFetchStore.data[0];
  }

  @computed get appInstallPortalUrl(): string {
    return locationStore.getInstallPortalUrlWithCurrentApp("");
  }

  constructor() {
    if (appStore.app && appStore.app.isAppWhitelisted) {
      recentReleasesFetchStore.fetch();
      this.isReleasesFetched = true;
    }
  }

  @action
  public showAppQRCodeDialog = () => {
    this.appQRCodeDialogVisible = true;
  };

  @action
  public hideAppQRCodeDialog = () => {
    this.appQRCodeDialogVisible = false;
  };

  @action
  public asyncContentLoaded = () => {
    this.gettingStartedLoading = false;
  };
}
