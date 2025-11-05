import { distributionGroupStore, GROUP_OWNER_TYPE, DistributionGroup } from "@root/data/distribute";
import { computed, action } from "mobx";
import { IApp, APP_OWNER_TYPES, CollaboratorRole } from "@lib/common-interfaces";
import { appStore } from "@root/stores";
import { differenceWith } from "lodash";
import { distributionGroupTesterStore } from "@root/data/distribute/stores/distribution-group-tester-store";
import { FetchMode } from "@root/data/lib/store";

export class DistributionGroupsUIStore {
  constructor(private organizationName: string) {}

  public fetch = () => {
    distributionGroupStore.fetchForRelationship("organizationName", this.organizationName, {
      ownerType: GROUP_OWNER_TYPE.ORG,
    });
  };

  public refreshAllApps(distributionGroupName: string) {
    return distributionGroupStore.refreshAllAppsForDistributionGroup(this.organizationName, distributionGroupName);
  }

  public fetchAllMembers = () => {
    distributionGroupTesterStore.fetchCollection(
      {
        organizationName: this.organizationName,
      },
      {
        fetchMode: FetchMode.PreserveAppend,
      }
    );
  };

  @computed
  public get isFetching() {
    return distributionGroupStore.isFetchingRelationship(`organizationName-${this.organizationName}`);
  }

  @computed
  public get distributionGroups() {
    return distributionGroupStore.resources.filter((group) => group.organizationName === this.organizationName);
  }

  @computed
  public get hasNoDistributionGroups() {
    return this.distributionGroups.length === 0;
  }

  public getDistributionGroup(distributionGroupName: string): DistributionGroup {
    const distributionGroups = distributionGroupStore.resources
      .filter((group) => group.organizationName === this.organizationName)
      .filter((group) => group.name === distributionGroupName);

    return distributionGroups ? distributionGroups[0] : (null as any);
  }

  @action
  public async deleteApps(distributionGroupName: string, apps: IApp[]): Promise<void> {
    const appNames = apps.map((app) => app.name);
    return new Promise<void>((resolve, reject) => {
      return distributionGroupStore
        .removeAppsFromDistributionGroup(this.organizationName, GROUP_OWNER_TYPE.ORG, distributionGroupName, appNames as any)
        .onSuccess(() => {
          return distributionGroupStore.refreshAllAppsForDistributionGroup(this.organizationName, distributionGroupName).then(
            action(() => {
              return resolve();
            })
          );
        })
        .onFailure(
          action(() => {
            return resolve();
          })
        );
    });
  }

  @action
  public async addApps(distributionGroupName: string, apps: IApp[]) {
    //: Promise<void> {
    const appNames = apps.map((app) => app.name);
    return new Promise<void>((resolve, reject) => {
      return distributionGroupStore
        .addAppsToDistributionGroup(this.organizationName, GROUP_OWNER_TYPE.ORG, distributionGroupName, appNames as any)
        .onSuccess(() => {
          return distributionGroupStore
            .refreshAllAppsForDistributionGroup(this.organizationName, distributionGroupName)
            .then(resolve as any);
        })
        .onFailure((err) => {
          reject(err);
        });
    });
  }

  public getAppsForTheOrganization(organizationName: string): IApp[] {
    return appStore.appsForOwner(APP_OWNER_TYPES.ORG, organizationName);
  }

  private diffWithOrgApps(groupApps: IApp[]): IApp[] {
    const allowedPermissions: CollaboratorRole[] = ["manager", "developer"];
    const allowedApps = this.getAppsForTheOrganization(this.organizationName).filter((app) =>
      appStore.hasAnyCollaboratorRoleForApp(allowedPermissions, app)
    );
    return differenceWith(allowedApps, groupApps, (allowedApp: IApp, groupApp: IApp) => {
      return allowedApp && groupApp && allowedApp.id === groupApp.id;
    });
  }

  public appsThatCanBeManaged(groupApps: IApp[]): IApp[] {
    return this.diffWithOrgApps(groupApps);
  }
}
