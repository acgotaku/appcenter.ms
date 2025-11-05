import { apiGateway } from "@root/lib/http";
import { GROUP_OWNER_TYPE, GroupOwnerType } from "../types";
import { RESPONSE_TYPES, IApp } from "@lib/common-interfaces";
import { Store } from "../../lib";
import { DistributionGroup, DeserializedDistributionGroup, SerializedDistributionGroup } from "../models/distribution-group-model";
import { appDistributionGroupAssociationStore } from "./app-distribution-group-association-store";
import { distributionGroupTesterAssociationStore } from "./distribution-group-tester-association-store";
import { API } from "../constants";
import { action } from "mobx";
import { appStore } from "@root/stores";
import { distributionGroupTesterStore } from "@root/data/distribute/stores/distribution-group-tester-store";
import { noop } from "lodash";

export type DistributionGroupQuery = {
  ownerType: GroupOwnerType;
  ownerName: string;
  groupName?: string;
  appName?: string;
};

export class DistributionGroupStore extends Store<DeserializedDistributionGroup, SerializedDistributionGroup, DistributionGroup> {
  protected ModelClass = DistributionGroup;

  protected generateIdFromResponse(resource: SerializedDistributionGroup, query?: any) {
    return resource.id;
  }

  protected getModelId(model: DistributionGroup): string {
    return model.id;
  }

  protected getResource(id: string, query?: DistributionGroupQuery): Promise<SerializedDistributionGroup> {
    if (query?.ownerType === GROUP_OWNER_TYPE.ORG) {
      return apiGateway.get<SerializedDistributionGroup>(API.ORG_DISTRIBUTION_GROUP, {
        params: {
          org_name: query.ownerName,
          group_name: id,
        },
      });
    }

    // TODO: implement for query.ownerType === GROUP_OWNER_TYPE.APP
    throw new Error(`Method not implemented for ${query?.ownerType}`);
  }

  protected getCollection(
    query?: DistributionGroupQuery,
    foreignKey?: keyof DeserializedDistributionGroup,
    foreignKeyValue?: DeserializedDistributionGroup[keyof DeserializedDistributionGroup]
  ): Promise<SerializedDistributionGroup[]> {
    if (query && query.ownerType === GROUP_OWNER_TYPE.ORG && foreignKey === "organizationName") {
      return apiGateway.get<SerializedDistributionGroup[]>(API.ORG_DISTRIBUTION_GROUPS_WITH_DETAILS, {
        params: {
          org_name: foreignKeyValue as string,
        },
      });
    }

    if (query) {
      return apiGateway.get<SerializedDistributionGroup[]>(API.APP_DISTRIBUTION_GROUPS, {
        params: {
          owner_name: query.ownerName,
          app_name: query.appName,
        },
      });
    }

    return Promise.resolve([]);
  }

  public refreshAllAppsForDistributionGroup(orgName: string, distributionGroupName: string) {
    return apiGateway
      .get<IApp[]>(API.ORG_DISTRIBUTION_GROUP_APPS, {
        params: {
          org_name: orgName,
          group_name: distributionGroupName,
        },
      })
      .then(
        action((data: IApp[]) => {
          // update the in-memory instance of this group with the entire list of apps (otherwise it may only contain a partial list)
          const distributionGroup = this.findGroupForOrganization(orgName, distributionGroupName);
          if (distributionGroup) {
            distributionGroup.applyChanges({
              apps: data,
              totalAppsCount: data.length,

              // this API returns all apps for a given group so we don't have additional apps to load
              hasMoreApps: false,
            });
          }

          return null;
        })
      )
      .catch(noop);
  }

  protected postResource(resource: DistributionGroup, options?: DistributionGroupQuery): Promise<void | SerializedDistributionGroup> {
    if (options?.ownerType === GROUP_OWNER_TYPE.ORG) {
      return apiGateway.post<SerializedDistributionGroup>(API.ORG_DISTRIBUTION_GROUPS, {
        params: {
          org_name: resource.organizationName,
        },
        body: {
          name: resource.name,
        },
      });
    }

    // TODO: implement for query.ownerType === GROUP_OWNER_TYPE.APP
    throw new Error(`Method not implemented for ${options?.ownerType}`);
  }

  protected patchResource(
    resource: DistributionGroup,
    changes: Partial<DeserializedDistributionGroup>,
    options?: DistributionGroupQuery
  ): Promise<any> {
    if (options?.ownerType === GROUP_OWNER_TYPE.ORG) {
      return apiGateway.patch<SerializedDistributionGroup>(API.ORG_DISTRIBUTION_GROUP, {
        params: {
          org_name: resource.organizationName,
          group_name: encodeURIComponent(resource.name),
        },
        body: {
          name: changes.name,
          is_public: changes.isPublic,
        },
      });
    }

    // TODO: implement for query.ownerType === GROUP_OWNER_TYPE.APP
    throw new Error(`Method not implemented for ${options?.ownerType}`);
  }

  protected deleteResource(resource: DistributionGroup, options?: DistributionGroupQuery): Promise<any> {
    if (options?.ownerType === GROUP_OWNER_TYPE.ORG) {
      return apiGateway.delete<void>(API.ORG_DISTRIBUTION_GROUP, {
        params: {
          org_name: resource.organizationName,
          group_name: encodeURIComponent(resource.name),
        },
        responseType: RESPONSE_TYPES.TEXT,
      });
    }

    // TODO: implement for query.ownerType === GROUP_OWNER_TYPE.APP
    throw new Error(`Method not implemented for ${options?.ownerType}`);
  }

  protected deserialize(
    serialized: SerializedDistributionGroup,
    queryOrOptions?: any,
    foreignKey?: keyof DeserializedDistributionGroup,
    foreignKeyValue?: DeserializedDistributionGroup[keyof DeserializedDistributionGroup]
  ): DeserializedDistributionGroup {
    return {
      id: serialized.id,
      name: serialized.name,
      origin: serialized.origin,
      displayName: serialized.display_name,
      isPublic: serialized.is_public,
      totalAppsCount: serialized.total_apps_count || 0,
      totalUsersCount: serialized.total_users_count || serialized.total_user_count || 0,
      apps: serialized.apps || [],
      ownerName: queryOrOptions.ownerName,
      appName: queryOrOptions.appName,

      // this API returns up to 10 apps for a given group so we may have additional apps to load
      hasMoreApps: true,
    };
  }

  public getGlobalCacheKey() {
    return appStore.app ? appStore.app.id : undefined;
  }

  public fetchAppsForDistributionGroup(ownerName: string, ownerType: GroupOwnerType) {
    if (ownerType === GROUP_OWNER_TYPE.ORG) {
      return this.fetchForManyToMany(appDistributionGroupAssociationStore, ownerName, { ownerName, ownerType: GROUP_OWNER_TYPE.ORG });
    }

    throw new Error(`Method not implemented for ${ownerType}`);
  }

  public findGroupForOrganization(orgName: string, groupName: string) {
    return this.resources.find((group) => {
      return (group.name === groupName || group.displayName === groupName) && group.organizationName === orgName;
    });
  }

  public deleteGroup(resource: DistributionGroup, optimistic = true, options?: DistributionGroupQuery) {
    const request = super.delete(resource, optimistic, options);
    return request.onSuccess(() => {
      appDistributionGroupAssociationStore.disassociateMany(
        resource.name || "",
        resource.apps?.map((app) => app.name || "") || [],
        true,
        {
          ownerName: resource.organizationName,
          ownerType: GROUP_OWNER_TYPE.ORG,
        }
      );
      const emails = distributionGroupTesterStore.getTestersForGroup(resource).map((tester) => tester.email || "");
      distributionGroupTesterAssociationStore.removeTestersFromGroup(emails, resource.organizationName, resource.name);
    });
  }

  public addAppsToDistributionGroup(orgName: string, ownerType: string, groupName: string, appNames: string[]) {
    return appDistributionGroupAssociationStore.associateMany(groupName, appNames, true, {
      orgName,
      ownerType,
    });
  }

  public removeAppsFromDistributionGroup(orgName: string, ownerType: string, groupName: string, appNames: string[]) {
    return appDistributionGroupAssociationStore.disassociateMany(groupName, appNames, true, {
      orgName,
      ownerType,
    });
  }
}

export const distributionGroupStore = new DistributionGroupStore();
