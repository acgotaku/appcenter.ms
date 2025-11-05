import { assign, isEmpty, filter } from "lodash";
import { observable, computed, action } from "mobx";
import { t } from "@root/lib/i18n";
import { appStore, locationStore } from "@root/stores";
import { apiGateway } from "@root/lib/http";
import { DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore } from "@root/shared";
import { IApp } from "@lib/common-interfaces";
import { notifyScreenReader } from "@root/stores";
import { DistributionGroupWithMembers } from "../models/distribution-group-with-members";
import { Urls, Routes, MicrosoftInternalGroupId } from "../utils/constants";
import { DistributionGroupUpdateStore } from "./distribution-group-update-store";
import { DistributionGroupDeleteStore } from "./distribution-group-delete-store";
import { distributionStores } from "../stores/distribution-stores";
import { notFoundStore } from "../../stores/not-found-store";
import { logger } from "@root/lib/telemetry";
import { TelemetryProperty, ResponseHelper } from "../utils";

const userLimit: number = 10;

export class DistributionGroupListStore extends DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore<
  DistributionGroupWithMembers[]
> {
  @observable public selectedGroupName!: string;
  private _app: IApp;
  private _distributionGroupUpdateStore = new DistributionGroupUpdateStore();
  private _distributionGroupDeleteStore = new DistributionGroupDeleteStore();

  constructor(app: IApp) {
    super();
    this._app = app;
  }

  @computed
  public get distributionGroupUpdateInProgress() {
    return this._distributionGroupUpdateStore.updateInProgress;
  }

  @computed
  public get distributionGroupDeleteInProgress() {
    return this._distributionGroupDeleteStore.deletionInProgress;
  }

  @computed
  public get distributionGroupUpdateFailed() {
    return this._distributionGroupUpdateStore.isFailed;
  }

  @computed
  public get selectedGroup() {
    if (!isEmpty(this.data)) {
      return this.data!.find((o) => o.name === this.selectedGroupName);
    }
  }

  @computed
  public get dataArray() {
    return this.data ? Array.from(this.data) : [];
  }

  @action
  public setSelectedGroupName(groupName: string) {
    if (groupName === undefined || this.isPending || this.hasDistributionGroupWithName(groupName)) {
      this.selectedGroupName = groupName;
    } else {
      notFoundStore.notify404();
    }
  }

  public hasDistributionGroupWithName(name: string): boolean {
    return !!this.dataArray.find((dg) => dg.name!.toLowerCase() === name.trim().toLowerCase());
  }

  public fetchDistributionGroupsList(forceLoad?: boolean): Promise<void> {
    const fetchDataPromise = apiGateway
      .get<DistributionGroupWithMembers[]>(Urls.GetDistributionGroupsPath, {
        params: {
          app_name: this._app.name!,
          owner_name: this._app.owner!.name,
          users_limit: userLimit.toString(),
        },
      })
      .then((groups: DistributionGroupWithMembers[]) => {
        // Simulate that the accounts-management service will _not_ return Microsoft Internal groups for
        // apps that are not marked as `microsoft_internal` yet. This filtering can be removed when
        //   https://msmobilecenter.visualstudio.com/Mobile-Center/_git/appcenter/pullrequest/18617
        // has been merged and deployed.
        return filter(groups, (group) => this._app.microsoft_internal || group.id !== MicrosoftInternalGroupId);
      });

    if (!forceLoad && this.data) {
      return this.loadInBackgroundVoid(fetchDataPromise);
    } else {
      return this.loadVoid(fetchDataPromise);
    }
  }

  @action
  public updateDistributionGroup(
    oldGroupName: string,
    newGroupName: string,
    isPublic: boolean,
    telemetryProps: TelemetryProperty,
    onComplete?: () => void
  ) {
    newGroupName = newGroupName.trim();
    const updateGroupIndex: number = this.data!.findIndex((group) => group.name === oldGroupName);
    this.data![updateGroupIndex].name = newGroupName;
    this.data![updateGroupIndex].is_public = isPublic;

    this.setSelectedGroupName(newGroupName);
    return this._distributionGroupUpdateStore
      .updateDistributionGroup(oldGroupName, newGroupName, isPublic)
      .then(() => {
        telemetryProps.result = "succeed";
        logger.info("Update distribution group complete", telemetryProps);
        this.fetchDistributionGroupsList();
        distributionStores.deleteDistributionGroupDetailsStore(oldGroupName); // Invalidate cache for the group’s old name
        distributionStores.getDistributionGroupDetailsStore(newGroupName).releaseListUIStore.fetchReleaseList();
        distributionStores.getDistributionGroupDetailsStore(newGroupName).deviceWithTesterStore.fetchDevices();
        notifyScreenReader({ message: t("distribute:groups.wasUpdated", { name: newGroupName }), delay: 1500 });
        return null;
      })
      .catch((error: any) => {
        telemetryProps.result = "failed";
        telemetryProps = assign(telemetryProps, ResponseHelper.extractResponse(error));
        logger.info("Update distribution group complete", telemetryProps);
        throw error;
      })
      .finally(() => {
        if (onComplete) {
          onComplete();
        }
      });
  }

  @action
  public deleteDistributionGroup(groupName: string, telemetryProps: TelemetryProperty, onComplete?: () => void): void {
    const removeGroupIndex: number = this.data!.findIndex((group) => group.name === groupName);
    this.data!.splice(removeGroupIndex, 1);

    this._distributionGroupDeleteStore
      .deleteDistributionGroup(groupName)
      .then(() => {
        telemetryProps.result = "succeed";
        logger.info("Remove distribution group complete", telemetryProps);
        this.fetchDistributionGroupsList();
        distributionStores.deleteDistributionGroupDetailsStore(groupName); // Invalidate cache for the group’s old name
        return null;
      })
      .catch((error: any) => {
        telemetryProps.result = "failed";
        telemetryProps = assign(telemetryProps, ResponseHelper.extractResponse(error));
        logger.info("Remove distribution group complete", telemetryProps);
      })
      .finally(() => {
        if (onComplete) {
          onComplete();
        }
        locationStore.pushWithCurrentApp(Routes.DistributionGroups);
        notifyScreenReader({ message: t("distribute:groups.wasDeleted", { name: groupName }), delay: 1500 });
      });
  }

  @action
  public disableDogfooding(telemetryProps: TelemetryProperty): void {
    const app = appStore.app;

    appStore
      .update(app, { microsoft_internal: false }, false)
      .onSuccess(() => {
        telemetryProps.result = "succeed";
        logger.info("Disabled dogfooding", telemetryProps);

        this.fetchDistributionGroupsList();
        locationStore.pushWithCurrentApp(Routes.DistributionGroups);
      })
      .onFailure(() => {
        telemetryProps.result = "failed";
        logger.info("Disabling of dogfooding failed", telemetryProps);

        this.fetchDistributionGroupsList();
        locationStore.pushWithCurrentApp(Routes.DistributionGroups);
      });
  }
}
