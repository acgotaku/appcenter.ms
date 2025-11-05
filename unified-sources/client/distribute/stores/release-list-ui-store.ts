import { appStore, locationStore } from "@root/stores";
import { SortOptions } from "@root/shared";
import { DistributionStores } from "./distribution-stores";
import { DistributionGroupRemoveReleaseStore } from "./distribution-group-remove-release-store";
import { ReleaseDeleteStore } from "./release-delete-store";
import { Release } from "../models/release";
import { observable, computed, action } from "mobx";
import { OS } from "../models/os";
import { notificationStore } from "../../stores/notification-store";
import { distributionExternalStores } from "../stores/distribution-external-stores";
import { PartialRelease } from "@root/data/distribute/models/partial-release";
import { TelemetryProperty } from "../utils";
import { distributionStores } from "../stores/distribution-stores";
import { t } from "@root/lib/i18n";
import { releaseStore } from "@root/data/distribute/stores/release-store";
import { ReleaseModel, DeserializedPartialRelease, DeserializedFullRelease } from "@root/data/distribute/models/release";
import { releaseDestinationAssociationStore } from "@root/data/distribute/stores/release-destination-association-store";
import { sortData } from "../utils/sorting-helper";
import { logger } from "@root/lib/telemetry";

export enum ReleasesTableColumns {
  Release = 0,
  Version,
  Date,
  Destination,
  Type,
  Status,
}

export class ReleaseListUIStore {
  private _groupName?: string;
  private _distributionStores?: DistributionStores;
  private _distributionGroupDeleteReleaseStore = new DistributionGroupRemoveReleaseStore();
  private _releaseDeleteStore = new ReleaseDeleteStore();

  @observable public confirmDialogVisible: boolean = false;
  @observable public releaseToDelete?: PartialRelease;
  @observable private loadTopReleases: boolean = true;

  @observable public sort: SortOptions = {
    column: 0,
    descending: true,
  };
  private columnIds: (undefined | keyof Pick<DeserializedPartialRelease, "id" | "version" | "uploadedAt">)[] = [
    "id",
    "version",
    "uploadedAt",
    "uploadedAt",
    undefined,
    undefined,
  ];

  constructor(groupName?: string, distributionStores?: DistributionStores) {
    this._groupName = groupName;
    this._distributionStores = distributionStores;
  }

  public get distributionGroupDeleteReleaseIsPending() {
    return this._distributionGroupDeleteReleaseStore.isPending;
  }

  @computed get isPending() {
    return (
      releaseStore.isFetchingCollection ||
      releaseStore.isFetchingRelationship(`${releaseDestinationAssociationStore.id}-${this._groupName}`)
    );
  }

  @computed get isLoaded() {
    return !releaseStore.isFetchingCollection;
  }

  @computed get isLoadedAllReleases() {
    return !this.loadTopReleases;
  }

  private sortReleases(releases: ReleaseModel[] | undefined): ReleaseModel[] {
    const sortKey = this.sort.column != null && this.columnIds[this.sort.column];
    if (!releases) {
      return [];
    }
    if (!sortKey) {
      return releases.slice();
    }
    const multiplier = this.sort.descending ? -1 : 1;
    const data = sortData(releases, sortKey, multiplier);
    return data;
  }

  public getRelease(id: string): DeserializedPartialRelease | DeserializedFullRelease | undefined {
    return releaseStore.getRelease(id);
  }

  @computed get releases(): ReleaseModel[] {
    const releases = this._groupName ? releaseStore.getReleasesForDestination(this._groupName) : releaseStore.resources;
    return this.sortReleases(releases);
  }

  public fetchReleaseList(releaseId?: number) {
    if (this._groupName) {
      releaseStore.fetchReleasesForDistributionGroup(this._groupName);
    } else {
      releaseStore.fetchCollection({ top: this.loadTopReleases, releaseId: releaseId });
    }
  }

  @action
  public updateSort(sortBy: SortOptions) {
    logger.info("releases-sort", {
      sortBy: this.getSortCol(sortBy),
      sortDirection: this.getSortDir(sortBy),
    });
    this.sort = sortBy;
  }

  private getSortCol(sortOptions: SortOptions) {
    return sortOptions.column != null ? this.columnIds[sortOptions.column] : undefined;
  }

  private getSortDir(sortOptions: SortOptions) {
    return sortOptions.descending ? "desc" : "asc";
  }

  /**
   * Refreshes the "latest release" info section with the provided release (if applicable), instead of
   * just doing a refetch.
   * @param groupName The name of the distribution group whos latest release should be refreshed.
   * @param release The release to use for the refresh, rather than doing a refetch.
   * @deprecated This should only ever be used as a temporary retrofit. Try to avoid using this in new work.
   */
  @action
  public refreshLatestReleaseForGroup = (groupName: string, release: Release) => {
    // Get the data store for the group, so we can get the latest release details store from it (I know :/ )
    const groupStore = this._distributionStores && groupName && this._distributionStores.getDistributionGroupDetailsStore(groupName);
    if (groupStore) {
      const latestReleaseDetails = groupStore.latestReleaseDetailsStore.data;

      // If the group store's latest release is not the release we're asking about,
      // we should replace it's data with that release, so the LatestVersionInfo
      // component will be showing that release.
      if (!latestReleaseDetails || latestReleaseDetails.id !== release.id) {
        groupStore.latestReleaseDetailsStore.data = release;
      }
    }
  };

  /**
   * Deletes a release. Retained for Distribution Stores flows.
   * @deprecated This should only ever be used as a temporary retrofit. Try to avoid using this in new work.
   */
  @action
  public oldDeleteReleaseDepricated(
    release: PartialRelease,
    telemetryProps: TelemetryProperty,
    storeDestinationName?: string,
    navigateUp?: boolean
  ): Promise<any> {
    let releaseDeleted: boolean;
    const deletePromise = this._releaseDeleteStore.deleteRelease(release.id).then(() => {
      releaseDeleted = true;

      if (storeDestinationName) {
        // Update the store release list
        const storeDetailsStore = distributionExternalStores.getDistributionStoreDetailsStore(storeDestinationName);
        storeDetailsStore.latestReleaseDetailsStore.fetchLatestStoreRelease();
        storeDetailsStore.storeReleaseListStore.fetchReleaseList();
      }
      distributionExternalStores.recentReleasesListStore.fetchList(true);

      // Update the distribution release list
      this.fetchReleaseList();
    });

    let errorMessage: string;
    return deletePromise
      .catch((e) => {
        errorMessage = e;
        if (!releaseDeleted) {
          notificationStore.notify({ message: t("distribute:releaseDeleteError"), persistent: false });
        }
        return null;
      })
      .then(() => {
        telemetryProps.result = releaseDeleted ? "succeed" : "failed";
        if (errorMessage) {
          telemetryProps.message = errorMessage;
        }
        logger.info("Deleted a release", telemetryProps);

        if (navigateUp) {
          locationStore.goUp();
        }
      });
  }

  @action
  public async deleteRelease(releaseId: string, telemetryProps: TelemetryProperty, navigateUp?: boolean): Promise<any> {
    releaseStore
      .delete(releaseId)
      .onSuccess((data) => {
        this.writeDeleteTelemetry(telemetryProps, /*releaseDeleted*/ true);

        if (navigateUp) {
          locationStore.goUp();
        }
      })
      .onFailure((error) => {
        const errorMessage = error && error.message;
        notificationStore.notify({ message: t("distribute:releaseDeleteError"), persistent: false });
        this.writeDeleteTelemetry(telemetryProps, /*releaseDeleted*/ false, errorMessage);
      });
  }

  private writeDeleteTelemetry(telemetryProps: TelemetryProperty, releaseDeleted: boolean, errorMessage?: string): void {
    telemetryProps.result = releaseDeleted ? "succeed" : "failed";
    if (errorMessage) {
      telemetryProps.message = errorMessage;
    }
    logger.info("Deleted a release", telemetryProps);
  }

  @action
  public toggleEnableRelease(release: DeserializedPartialRelease | PartialRelease, telemetryProps: TelemetryProperty) {
    const sendTelemetry = (errorMessage?: string) => {
      telemetryProps.result = !errorMessage ? "succeed" : "failed";
      if (errorMessage) {
        telemetryProps.message = errorMessage;
      }
      telemetryProps["enable_state"] = !release.enabled;
      logger.info(`Toggle enable a release`, telemetryProps);
    };

    const releaseModel = releaseStore.get(String(release.id));
    if (!releaseModel) {
      throw new Error(`Release with id ${release.id} not found in store`);
    }
    releaseStore
      .toggleEnableRelease(releaseModel)
      .onSuccess(() => {
        sendTelemetry();
      })
      .onFailure((error: Error | undefined) => {
        notificationStore.notify({
          message: t("distribute:releaseDisableError"),
          persistent: false,
        });
        sendTelemetry(error?.message);
      });
  }

  @action
  public removeRelease(release: PartialRelease, telemetryProps: TelemetryProperty): void {
    // These are spots where we know/are guaranteed that this._groupName will have a value, because
    // this method will only ever be called from a distribution group page.
    releaseDestinationAssociationStore
      .disassociate(this._groupName!, release.id.toString(), true, { type: "group", name: this._groupName })
      .onSuccess(() => {
        // Remove this distribution group from the list of destinations on the release.
        const fullRelease = releaseStore.get(release.id.toString());
        if (fullRelease && fullRelease.destinations) {
          const newDestinations = fullRelease.destinations.filter((dest) => dest.name !== this._groupName);
          fullRelease.applyChanges({ destinations: newDestinations });
        }

        const groupStore = distributionStores.getDistributionGroupDetailsStore(this._groupName!);
        if (groupStore) {
          // Keep the device stuff up to date as they should be.
          if (OS.isIos(appStore.app.os)) {
            groupStore.deviceWithTesterStore.fetchDevices();
          }
          // Refetch the latest release if this was the latest one.
          // REPLACETHIS Once the distributionGroupStore (new data layer) is used instead of the old stores for DGs/latest release.
          if (this._isLatest(release)) {
            groupStore.latestReleaseDetailsStore.fetchLatestRelease();
          }
        }
        // Log telemetry
        logger.info("Remove a release", telemetryProps);
      })
      .onFailure((error) => {
        notificationStore.notify({ message: t("distribute:releaseRemoveError"), persistent: false });
        logger.info("Remove a release", { ...telemetryProps, result: "failed" });
      });
  }

  private _isLatest(release: PartialRelease): boolean {
    const groupStore = this._groupName && distributionStores.getDistributionGroupDetailsStore(this._groupName);
    return release.id === (groupStore && groupStore.latestReleaseDetailsStore.data && groupStore.latestReleaseDetailsStore.data.id);
  }

  @action public prepareDeletion(release: PartialRelease) {
    this.confirmDialogVisible = true;
    this.releaseToDelete = release;
  }

  @action public resetDeletion() {
    this.confirmDialogVisible = false;
    this.releaseToDelete = undefined;
  }

  @action public fetchAllReleases() {
    this.loadTopReleases = false;
    this.fetchReleaseList();
  }
}
