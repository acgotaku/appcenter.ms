import { DistributionGroupWithMembers } from "@root/distribute/models/distribution-group-with-members";
import { DistributionGroup } from "@root/data/distribute";
import { IApp } from "@lib/common-interfaces";
import { Origin } from "@root/data/distribute/constants";
import { GroupType } from "@root/data/distribute/models/group-type";
import { DistributionGroupUser } from "@root/distribute/models/distribution-group-user";
import { t } from "@root/lib/i18n";
import { computed } from "mobx";
import { DistributionGroupDetailsStore } from "../stores/distribution-group-details-store";

export class NormalizedDistributionGroup {
  public id!: string;
  public name!: string;
  public displayName?: string;
  public origin?: Origin;
  public groupType?: GroupType;
  public isPublic?: boolean;
  public isShared?: boolean;
  public users!: DistributionGroupUser[];
  public aadGroups!: DistributionGroupUser[];
  public totalUsersCount!: number;
  public totalGroupsCount!: number;
  public notifiedUsersCount!: number;
  public totalAppsCount?: number;
  public apps?: IApp[];
  public organizationName?: string;
  public ownerName?: string;
  public appName?: string;
  public hasMoreApps?: boolean;

  public toDistributionGroupInterface(): DistributionGroupWithMembers {
    return {
      id: this.id,
      name: this.name,
      display_name: this.displayName,
      origin: this.origin,
      group_type: this.groupType,
      is_public: this.isPublic,
      is_shared: this.isShared,
      users: this.users,
      aad_groups: this.aadGroups,
      total_user_count: this.totalUsersCount,
      total_apps_count: this.totalAppsCount,
      total_groups_count: this.totalGroupsCount,
      notified_user_count: this.notifiedUsersCount,
    };
  }

  @computed
  public get prettyPrintAppCount() {
    return t("management:distributionGroupList.appsCount", { count: this.totalAppsCount });
  }

  @computed
  public get prettyPrintTesterCount() {
    return t("management:distributionGroupList.testersCount", { count: this.totalUsersCount });
  }

  public static construct(distributionGroup: DistributionGroupWithMembers | DistributionGroup): NormalizedDistributionGroup {
    if (distributionGroup instanceof DistributionGroup) {
      return NormalizedDistributionGroup.constructFromDgClass(distributionGroup);
    } else {
      return NormalizedDistributionGroup.constructFromDgInterface(distributionGroup);
    }
  }

  private static constructFromDgClass(distributionGroup: DistributionGroup): NormalizedDistributionGroup {
    const normalizedDg = new NormalizedDistributionGroup();
    const theStore = new DistributionGroupDetailsStore(distributionGroup.name!);
    normalizedDg.id = distributionGroup.id;
    normalizedDg.name = distributionGroup.name!;
    normalizedDg.displayName = distributionGroup.displayName;
    normalizedDg.origin = distributionGroup.origin;
    normalizedDg.isPublic = distributionGroup.isPublic;
    normalizedDg.totalAppsCount = distributionGroup.totalAppsCount;
    normalizedDg.totalUsersCount = distributionGroup.totalUsersCount!;
    normalizedDg.apps = distributionGroup.apps;
    normalizedDg.organizationName = distributionGroup.organizationName;
    normalizedDg.ownerName = distributionGroup.ownerName;
    normalizedDg.appName = distributionGroup.appName;
    normalizedDg.hasMoreApps = distributionGroup.hasMoreApps;
    normalizedDg.totalGroupsCount = theStore.data.total_groups_count;

    return normalizedDg;
  }

  private static constructFromDgInterface(distributionGroup: DistributionGroupWithMembers): NormalizedDistributionGroup {
    const normalizedDg = new NormalizedDistributionGroup();
    normalizedDg.id = distributionGroup.id;
    normalizedDg.name = distributionGroup.name!;
    normalizedDg.displayName = distributionGroup.display_name;
    normalizedDg.origin = distributionGroup.origin;
    normalizedDg.groupType = distributionGroup.group_type;
    normalizedDg.isPublic = distributionGroup.is_public;
    normalizedDg.isShared = distributionGroup.is_shared;
    normalizedDg.users = distributionGroup.users;
    normalizedDg.aadGroups = distributionGroup.aad_groups;
    normalizedDg.totalUsersCount = distributionGroup.total_user_count;
    normalizedDg.totalAppsCount = distributionGroup.total_apps_count;
    normalizedDg.totalGroupsCount = distributionGroup.total_groups_count;
    normalizedDg.notifiedUsersCount = distributionGroup.notified_user_count;

    return normalizedDg;
  }
}
