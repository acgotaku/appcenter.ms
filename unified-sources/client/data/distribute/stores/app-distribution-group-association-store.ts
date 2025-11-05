import { apiGateway } from "@root/lib/http";
import { RESPONSE_TYPES } from "@lib/common-interfaces";
import { AssociationStore, ResourceRequest } from "../../lib";
import { AppDistributionGroup } from "../models";
import { API } from "../constants";
import { noop } from "lodash";
import { GroupOwnerType, GROUP_OWNER_TYPE } from "../types";
import { App } from "@root/data/shell/models/app";

export type AppDistributionGroupOptions = {
  orgName: string;
  ownerType: GroupOwnerType;
};

export class AppDistributionGroupAssociationStore extends AssociationStore<AppDistributionGroup> {
  public LeftClass = App;
  protected AssociationClass = AppDistributionGroup;

  protected disassociateResources(internalAppName: string, groupName: string, query?: AppDistributionGroupOptions): Promise<void> {
    const ownerAppName = internalAppName.split("|");
    if (ownerAppName.length !== 2) {
      throw new Error(`Invalid internalAppName ${ownerAppName}. Must be in the format ownerName|appName`);
    }

    if (query?.ownerType === GROUP_OWNER_TYPE.ORG) {
      return apiGateway
        .delete<void>(API.ORG_DISTRIBUTION_GROUP_APP, {
          params: {
            org_name: internalAppName.split("|")[0],
            group_name: groupName,
            app_name: internalAppName.split("|")[1],
          },
          responseType: RESPONSE_TYPES.TEXT,
        })
        .then(() => void 0);
    }

    // TODO: implement for query.ownerType === GROUP_OWNER_TYPE.APP
    throw new Error(`Method not implemented for ${query?.ownerType}`);
  }

  public disassociate(appName: string, groupName: string): ResourceRequest<void, void> {
    return super.disassociate(appName, groupName);
  }

  protected associateManyResources(groupName: string, appNames: string[], options?: AppDistributionGroupOptions): Promise<any[]> {
    if (options?.ownerType === GROUP_OWNER_TYPE.ORG) {
      return apiGateway.post(API.ORG_DISTRIBUTION_GROUP_APPS, {
        responseType: RESPONSE_TYPES.TEXT /** expecting an empty response otherwise JSON will not work */,
        params: {
          org_name: options.orgName,
          group_name: groupName,
        },
        body: {
          apps: appNames.map((appName) => ({ name: appName })),
        },
      });
    }

    throw new Error(`Method not implemented for ${options?.ownerType}`);
  }

  protected disassociateManyResources(groupName: string, appNames: string[], options?: AppDistributionGroupOptions): Promise<void> {
    if (options?.ownerType === GROUP_OWNER_TYPE.ORG) {
      return apiGateway
        .post(API.DELETE_ORG_DISTRIBUTION_GROUP_APPS, {
          responseType: RESPONSE_TYPES.TEXT /** expecting an empty response otherwise JSON will not work */,
          params: {
            org_name: options.orgName,
            group_name: groupName,
          },
          body: {
            apps: appNames.map((appName) => ({ name: appName })),
          },
        })
        .then<void>(noop);
    }

    throw new Error(`Method not implemented for ${options?.ownerType}`);
  }
}

export const appDistributionGroupAssociationStore = new AppDistributionGroupAssociationStore();
