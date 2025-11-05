import { Model } from "@root/data/lib/model";
import { observable, computed } from "mobx";
import { IApp } from "@lib/common-interfaces";
import { t } from "@root/lib/i18n";
import { Origin } from "../constants";
import { releaseStore } from "../stores/release-store";

export interface SerializedDistributionGroup {
  id: string;
  name?: string;
  origin?: Origin;
  display_name?: string;
  is_public?: boolean;
  total_apps_count?: number;
  total_users_count?: number;
  // same as "total_users_count", just needed to handle inconsistency in two apis
  total_user_count?: number;
  apps?: IApp[];

  // when the response is limited to 10 apps (by the server) -
  // we raise this flag to indicate that we need to fetch all apps from the server if we want to render the entire list
  hasMoreApps?: boolean;
}

export interface DeserializedDistributionGroup {
  id: string;
  name?: string;
  origin?: Origin;
  displayName?: string;
  isPublic?: boolean;
  totalAppsCount?: number;
  totalUsersCount?: number;
  apps?: IApp[];
  hasMoreApps?: boolean;

  organizationName?: string;
  ownerName?: string;
  appName?: string;

  latestReleaseId?: string;
}

export class DistributionGroup extends Model<DeserializedDistributionGroup> implements DeserializedDistributionGroup {
  @observable public id!: string;
  @observable public name?: string;
  @observable public origin?: Origin;
  @observable public displayName?: string;
  @observable public isPublic?: boolean;
  @observable public totalAppsCount?: number;
  @observable public totalUsersCount?: number;
  @observable public apps?: IApp[];

  @observable public organizationName?: string;
  @observable public ownerName?: string;
  @observable public appName?: string;
  @observable public hasMoreApps?: boolean;

  @observable public latestReleaseId!: string; // fetching workaround

  @computed
  public get prettyPrintAppCount() {
    return t("management:distributionGroupList.appsCount", { count: this.totalAppsCount });
  }

  @computed
  public get prettyPrintTesterCount() {
    return t("management:distributionGroupList.testersCount", { count: this.totalUsersCount });
  }

  @computed
  public get latestRelease() {
    return this.latestReleaseId ? releaseStore.getRelease(this.latestReleaseId) : undefined;
  }
}
