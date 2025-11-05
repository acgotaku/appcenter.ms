import { action, computed, observable } from "mobx";
import { DistributionGroup, distributionGroupStore, GROUP_OWNER_TYPE } from "@root/data/distribute";
import { locationStore } from "@root/stores";

export class NewDistributionGroupUIStore {
  private newDistributionGroup: DistributionGroup = new DistributionGroup();
  @observable private error!: string;

  @action
  public create(organizationName: string, distributionGroupName: string) {
    this.newDistributionGroup.applyChanges({
      name: distributionGroupName,
      organizationName: organizationName,
      totalAppsCount: 0,
      totalUsersCount: 0,
    });

    distributionGroupStore
      .create(this.newDistributionGroup, false, { ownerType: GROUP_OWNER_TYPE.ORG })
      .onSuccess((distributionGroup: DistributionGroup | undefined) => {
        this.setErrorMessage(null as any);
        distributionGroupStore.fetchForRelationship("organizationName", organizationName, {
          ownerType: GROUP_OWNER_TYPE.ORG,
        });
        const encodedName = encodeURIComponent(distributionGroup!.name!);
        const url = `/orgs/${organizationName}/people/distribution-groups/${encodedName}/testers`;
        locationStore.router.push(url);
      })
      .onFailure((error: any) => {
        if (error.status === 409) {
          this.setErrorMessage("A distribution group of this name already exists.");
        } else {
          this.setErrorMessage(error.message);
        }
      });
  }

  @computed
  public get isCreating() {
    return distributionGroupStore.isCreating(this.newDistributionGroup);
  }

  @computed
  public get errorMessage() {
    return this.error;
  }

  @action
  public setErrorMessage(value: string) {
    this.error = value;
  }
}
