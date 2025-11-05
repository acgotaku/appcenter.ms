import { LatestReleaseDetailsStore } from "./latest-release-details-store";
import { ReleaseListUIStore } from "./release-list-ui-store";
import { DeviceListStore } from "./device-list-store";
import { DeviceWithTesterStore } from "./device-with-tester-store";
import { TesterListStore } from "./tester-list-store";
import { TesterTableStore } from "./tester-table-store";
import { distributionStores } from "./distribution-stores";
import { DistributionGroupOverviewStore } from "./distribution-group-overview-store";
import { DistributionGroupStatisticsStore } from "./distribution-group-statistics-store";
import { DistributionGroupWithMembers } from "../models/distribution-group-with-members";
import { computed } from "mobx";
import { appStore } from "../../stores/index";
import { DistributionGroupUser } from "@root/distribute/models/distribution-group-user";
import { aadGroupsListStore } from "@root/data/distribute/stores/aad-groups-list-store";

export class DistributionGroupDetailsStore {
  /**
   * @deprecated Accessing the latest release in this way should be deprecated. Future work should focus on
   * using the new data layer instead.
   */
  public latestReleaseDetailsStore: LatestReleaseDetailsStore;
  public releaseListUIStore: ReleaseListUIStore;
  public deviceListStore: DeviceListStore;
  public deviceWithTesterStore: DeviceWithTesterStore;
  public testerListStore: TesterListStore;
  public testerTableStore: TesterTableStore;
  public distributionGroupOverviewStore: DistributionGroupOverviewStore;
  public readonly distributionGroupStatisticsStore: DistributionGroupStatisticsStore;

  private _groupName: string;

  constructor(groupName: string) {
    this._groupName = groupName;
    const groupWithMembers = this.data;
    this.latestReleaseDetailsStore = new LatestReleaseDetailsStore(groupName);
    this.releaseListUIStore = new ReleaseListUIStore(groupName);
    this.deviceListStore = new DeviceListStore(groupName);
    this.testerListStore = new TesterListStore(groupName, groupWithMembers.id ? groupWithMembers.users! : (null as any));
    this.testerTableStore = new TesterTableStore(groupName);
    this.distributionGroupOverviewStore = new DistributionGroupOverviewStore();
    this.deviceWithTesterStore = new DeviceWithTesterStore(this.deviceListStore, this.testerListStore);
    this.distributionGroupStatisticsStore = new DistributionGroupStatisticsStore(groupName, this.releaseListUIStore);
  }

  @computed
  public get data(): DistributionGroupWithMembers {
    const groupWithMembers = distributionStores
      .getDistributionGroupListStore(appStore.app)
      .dataArray.find((g) => g.name === this._groupName);
    return (
      groupWithMembers! || {
        id: null,
        name: this._groupName,
        display_name: null,
        is_public: false,
        users: [],
        aad_groups: [],
        total_user_count: 0,
        total_groups_count: 0,
        notified_user_count: 0,
      }
    );
  }

  @computed
  public get groupsAndTestersList(): DistributionGroupUser[] {
    return aadGroupsListStore.getAadGroupsForGroup(this._groupName).concat(this.testerListStore.dataArray);
  }
}
