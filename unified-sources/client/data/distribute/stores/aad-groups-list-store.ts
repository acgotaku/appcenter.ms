import { apiGateway } from "@root/lib/http";
import { Store } from "@root/data/lib";
import { appStore, organizationStore } from "@root/stores";
import { Urls, API } from "../constants";
import { DistributionGroupUser } from "../models/distribution-group-user";
import { observable, ObservableMap, action } from "mobx";
import { GROUP_OWNER_TYPE } from "@root/data/distribute";
import { Organization } from "@root/data/shell/models";

export interface DistributionGroupQuery {
  distributionGroupName: string;
  organizationName?: string;
}

export class AadGroupsListStore extends Store<DistributionGroupUser> {
  private distributionGroupsToAadGroupsMap: ObservableMap<string, DistributionGroupUser[]> = observable.map<
    string,
    DistributionGroupUser[]
  >({});
  private tenantId?: string;

  // MARK: Store boilerplate
  protected ModelClass = DistributionGroupUser;
  protected deserialize(serialized: DistributionGroupUser): DistributionGroupUser {
    return serialized;
  }
  protected generateIdFromResponse(resource: DistributionGroupUser, query?: any) {
    return `${resource.distribution_group_name}-${resource.id}`;
  }
  protected getModelId(model: DistributionGroupUser): string {
    return `${model.distribution_group_name}-${model.id}`;
  }
  protected getSharedGroupAadGroups(options: DistributionGroupQuery): Promise<DistributionGroupUser[]> {
    return apiGateway
      .get<DistributionGroupUser[]>(API.ORG_AAD_GROUPS_IN_GROUP, {
        params: {
          org_name: options.organizationName,
          group_name: options.distributionGroupName,
        },
      })
      .then((data) => {
        this.associateAadGroupsWithDistributionGroup(data);
        return data;
      });
  }

  protected addSharedGroupAadGroups(
    resources: DistributionGroupUser[],
    options: DistributionGroupQuery
  ): Promise<DistributionGroupUser[]> {
    return apiGateway
      .post<DistributionGroupUser[]>(API.ORG_AAD_GROUPS_IN_GROUP, {
        params: {
          org_name: options.organizationName,
          group_name: options.distributionGroupName,
        },
        body: {
          aad_groups: resources.map(({ id: aad_group_id, display_name, tenant_id }) => ({ aad_group_id, display_name, tenant_id })),
        },
      })
      .then(() => {
        return this.getCollection(options);
      });
  }
  @action
  protected removeSharedGroupAadGroups(
    resources: DistributionGroupUser[],
    options: DistributionGroupQuery
  ): Promise<DistributionGroupUser[]> {
    return apiGateway
      .post<DistributionGroupUser[]>(API.DELETE_AAD_GROUP_FROM_SHARED_GROUP, {
        params: {
          org_name: options.organizationName,
          group_name: options.distributionGroupName,
        },
        body: {
          aad_group_ids: resources.map(({ id }) => id),
        },
      })
      .then(() => {
        this.clearAadGroups();
        return this.getCollection(options);
      });
  }

  // MARK: Functions that describe how to make API requests for getting, creating, updating & deleting multiple resources
  protected getCollection(options: DistributionGroupQuery): Promise<DistributionGroupUser[]> {
    if (!this.tenantId) {
      return Promise.resolve([]);
    }
    if (options.organizationName) {
      // fetching for shared DG
      return this.getSharedGroupAadGroups(options);
    } else {
      return apiGateway
        .get<DistributionGroupUser[]>(Urls.DistributionGroupAadGroups, {
          params: {
            app_name: appStore.name,
            owner_name: appStore.ownerName,
            distribution_group_name: options.distributionGroupName,
          },
        })
        .then((data) => {
          this.associateAadGroupsWithDistributionGroup(data);
          return data;
        });
    }
  }
  public postResources(resources: DistributionGroupUser[], options: DistributionGroupQuery): Promise<DistributionGroupUser[]> {
    if (!this.tenantId) {
      return Promise.resolve([]);
    }
    if (options.organizationName) {
      return this.addSharedGroupAadGroups(resources, options);
    } else {
      return apiGateway
        .post<DistributionGroupUser[]>(Urls.DistributionGroupAadGroups, {
          params: {
            owner_name: appStore.app.owner.name,
            app_name: appStore.app.name,
            distribution_group_name: options.distributionGroupName,
          },
          body: {
            aad_groups: resources.map(({ id: aad_group_id, display_name, tenant_id }) => ({ aad_group_id, display_name, tenant_id })),
          },
        })
        .then(() => {
          return this.getCollection(options);
        });
    }
  }
  @action
  public deleteResources(resources: DistributionGroupUser[], options: DistributionGroupQuery): Promise<DistributionGroupUser[]> {
    if (!this.tenantId) {
      return Promise.resolve([]);
    }
    if (options.organizationName) {
      return this.removeSharedGroupAadGroups(resources, options);
    }
    return apiGateway
      .post(Urls.BulkDeleteDistributionGroupAadGroups, {
        params: {
          owner_name: appStore.app.owner.name,
          app_name: appStore.app.name,
          distribution_group_name: options.distributionGroupName,
        },
        body: { aad_group_ids: resources.map(({ id }) => id) },
      })
      .then<DistributionGroupUser[]>(() => {
        this.clearAadGroups();
        return this.getCollection(options);
      });
  }

  // MARK: Functions that examine resources in the store
  public getAadGroupsForGroup(groupName: string): DistributionGroupUser[] {
    const aadGroups = this.distributionGroupsToAadGroupsMap.get(groupName);
    return aadGroups || [];
  }
  public alreadyAdded(groupName: string, id: string): boolean {
    return this.getAadGroupsForGroup(groupName).some((group) => group.aad_group_id === id);
  }

  @action
  protected clearAadGroups() {
    this.distributionGroupsToAadGroupsMap.clear();
  }

  // There is a many-to-many relation between DGs and AADGs.
  // this function maps each DG to its AADGs so we can later fetch each DG AADGs with o(1),
  // for example - when we need to check for the existence of an AADG within a DG
  @action
  private associateAadGroupsWithDistributionGroup(aadGroups: DistributionGroupUser[]) {
    aadGroups.forEach((group) => {
      const association = this.distributionGroupsToAadGroupsMap.get(group.distribution_group_name || "") || [];
      if (!association.find((g) => g.aad_group_id === group.aad_group_id)) {
        association.push(group);
        this.distributionGroupsToAadGroupsMap.set(group.distribution_group_name || "", association);
      }
    });
  }

  public initTenantIdAndFetch(distributionGroupName: string, organizationName?: string) {
    if (
      !organizationName && // present if the tenant is being initialized from the organization level
      (!appStore.app || appStore.app.owner.type !== GROUP_OWNER_TYPE.ORG)
    ) {
      return;
    }

    const orgName = organizationName ? organizationName : appStore.app.owner.name;
    const iOrganization = organizationStore.find(orgName);
    const organization = new Organization(iOrganization);

    organization.fetchAzureTenant().onSuccess((data) => {
      this.tenantId = organization.azureTenant.tenantId;
      this.fetchCollection({ distributionGroupName: distributionGroupName, organizationName: organizationName });
    });
  }
}

export const aadGroupsListStore = new AadGroupsListStore();
