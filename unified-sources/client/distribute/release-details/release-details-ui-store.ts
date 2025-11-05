import { StoreReleaseListStore } from "@root/distribute/stores/store-release-list-store";
import { ReleaseListUIStore } from "@root/distribute/stores/release-list-ui-store";
import { StorePublishingStatus } from "../models/store-publishing-status";
import { Release } from "../models/release";
import { ReleaseDestination } from "@root/data/distribute/models/release-destination";
import { action, observable, computed } from "mobx";
import { DistributionStore } from "@root/data/distribute/models/distribution-store";
import { StoreUrls, Routes } from "../utils/constants";
import { TelemetryProperty, StoresTelemetry } from "../utils";
import { appStore, locationStore } from "@root/stores";
import { releaseDestinationAssociationStore } from "@root/data/distribute/stores/release-destination-association-store";
import { releaseStore } from "@root/data/distribute/stores/release-store";
import { ReleaseModel } from "@root/data/distribute/models/release";
import { notificationStore } from "../../stores/notification-store";
import { t } from "@root/lib/i18n";
import { distributionStores } from "../stores/distribution-stores";
import { IApp } from "@lib/common-interfaces";
import { logger } from "@root/lib/telemetry";

export class ReleaseDetailsUIStore {
  public releaseListStore: ReleaseListUIStore | StoreReleaseListStore = undefined as any;
  public destinationName: string = "";
  @observable public releaseToDelete!: Release | ReleaseModel;
  @observable public confirmDialogVisible = false;
  @observable private releaseId!: string;
  @observable public appQRCodeDialogVisible = false;

  @action
  public setReleaseListStore(releaseListStore: ReleaseListUIStore | StoreReleaseListStore) {
    this.releaseListStore = releaseListStore;
  }

  @action
  public setDestinationName(destinationName: string) {
    this.destinationName = destinationName;
  }

  @computed get release(): ReleaseModel | undefined {
    return releaseStore.get(this.releaseId);
  }

  @computed
  public get isFetching() {
    if (this.releaseId) {
      return releaseStore.isFetching(this.releaseId);
    } else {
      return false;
    }
  }

  @action
  public fetchRelease(releaseId: string) {
    if (this.releaseId !== releaseId) {
      // Only refetch things if this is actually a different release.
      this.releaseId = releaseId;
      releaseStore.fetchOne(releaseId);
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

  public deleteRelease = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    this.prepareDeletion(this.release!);
  };

  public getInstallPortalUrlWithRelease(
    url: string,
    app?: IApp,
    release?: Release,
    params?: { [key: string]: string | string[] }
  ): string {
    const baseUrl = location.protocol + "//install." + location.host.toLowerCase() + locationStore.getUrlWithApp(url, app, params);
    return `${baseUrl}/releases/${release!.id}`;
  }

  public getDownloadStorePublishLogsURL(releaseId: number, store: DistributionStore) {
    StoresTelemetry.track(`store/publish/download_publish_logs`, store.type, store.track);
    const url: string = StoreUrls.GetStoreReleasePublishLogs.replace(":owner_name", appStore.ownerName!)
      .replace(":app_name", appStore.app.name!)
      .replace(":distribution_store_name", store.name!)
      .replace(":release_id", releaseId.toString());
    return `/download-stream?url=/${encodeURIComponent(url)}`;
  }

  public getCurrentStoreForRelease(release: Release, destinationName: string) {
    return (
      release.destinations &&
      release.destinations.find((store: ReleaseDestination) => store.name === destinationName && store.destinationType === "store")
    );
  }

  public onDeleteConfirmed = () => {
    if (this.releaseListStore instanceof StoreReleaseListStore) {
      if (this.releaseDestination()?.publishingStatus?.toLowerCase() !== StorePublishingStatus.Processing) {
        this.releaseListStore.removeRelease(this.releaseListStore.releaseToDelete);
      }
    } else {
      const telemetryProps: TelemetryProperty = { source: "Release Details" };
      releaseStore
        .delete(this.releaseId)
        .onSuccess(() => {
          telemetryProps.result = "success";
          logger.info("Deleted a release", telemetryProps);
          locationStore.goUp();
        })
        .onFailure((error) => {
          telemetryProps.result = "failed";
          telemetryProps.message = error ? error.message : undefined;
          logger.info("Deleted a release", telemetryProps);
          notificationStore.notify({ message: t("distribute:releaseDeleteError"), persistent: false });
          locationStore.goUp();
        });
    }
    this.releaseListStore.resetDeletion();
  };

  @action
  public onRemoveConfirmed = async () => {
    const telemetryProps: TelemetryProperty = { source: "Release Details" };
    const groupName = distributionStores.getDistributionGroupDetailsStore(this.destinationName).data.name;
    releaseDestinationAssociationStore
      .disassociate(groupName!, String(this.release!.id), /*optimistic*/ true, { type: "group" })
      .onSuccess(() => {
        telemetryProps.result = "success";
        logger.info("Remove a release", telemetryProps);
        // Remove this distribution group from the list of destinations on the release.
        const fullRelease = releaseStore.get(this.release!.id.toString());
        const newDestinations = fullRelease!.destinations!.filter((dest) => dest.name !== this.destinationName);
        fullRelease!.applyChanges({ destinations: newDestinations });

        locationStore.pushWithCurrentApp(Routes.DistributionGroupDetails, { tab: "releases", group_name: this.destinationName });
      })
      .onFailure((error) => {
        telemetryProps.result = "failed";
        telemetryProps.message = error ? error.message : undefined;
        logger.info("Remove a release", telemetryProps);
        notificationStore.notify({ message: t("distribute:releaseRemoveError"), persistent: false });
      });
  };

  @action
  public handleCancelButtonClick = () => {
    this.confirmDialogVisible = false;
  };

  public releaseDestination = () => {
    if (this.release && this.release.destinations) {
      // This needs to be filtered more in scenario where groupName and storeName can be same
      return this.release.destinations.find((dest) => dest.name === this.destinationName);
    } else {
      return null;
    }
  };

  public isStoreReleasePublishingFailed(releaseDestination: ReleaseDestination) {
    return (
      !!releaseDestination &&
      !!releaseDestination.publishingStatus &&
      releaseDestination.publishingStatus.toLowerCase() === StorePublishingStatus.Failed.toLowerCase()
    );
  }

  public releaseHasGroupDestination() {
    return Boolean(this.release?.destinations?.some((dest) => dest.destinationType === "group"));
  }

  public isAabRelease() {
    return this.release?.fileExtension === "aab";
  }

  public canDistributeToGroup() {
    return !this.isAabRelease() || this.releaseHasGroupDestination();
  }

  @action public prepareDeletion(release: Release) {
    this.confirmDialogVisible = true;
    this.releaseToDelete = release;
  }

  @action public resetDeletion(release: Release) {
    this.confirmDialogVisible = false;
    this.releaseToDelete = undefined as any;
  }
}
