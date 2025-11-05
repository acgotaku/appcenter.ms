import { distributionGroupStore } from "@root/data/distribute/stores/distribution-group-store";
import { computed } from "mobx";

export class DistributionGroupDetailsUIStore {
  constructor(private orgName: string) {}

  public findGroup = (groupName: string) => {
    return distributionGroupStore.findGroupForOrganization(this.orgName, groupName);
  };

  @computed
  public get resources() {
    return distributionGroupStore.resources;
  }

  @computed
  public get isFetching() {
    return distributionGroupStore.isFetchingRelationship(`organizationName-${this.orgName}`);
  }
}
