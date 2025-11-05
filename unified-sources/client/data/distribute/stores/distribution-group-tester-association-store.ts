import { AssociationStore, Association } from "@root/data/lib";
import { apiGateway } from "@root/lib/http";
import { API } from "@root/data/distribute/constants";
import { RESPONSE_TYPES } from "@lib/common-interfaces";
import { SerializedDistributionGroupTester } from "@root/data/distribute/models/distribution-group-tester";
import { observable, action } from "mobx";
import { DistributionGroup } from "@root/data/distribute/models";

type AssociationQueryOptions = {
  emails?: string[];
  email: string;
  organizationName: string;
  groupName: string;
};

export class DistributionGroupTesterAssociation extends Association<SerializedDistributionGroupTester> {
  @observable public invitePending?: boolean;
  @action public setMetaInfo(tester: SerializedDistributionGroupTester) {
    this.invitePending = tester.invite_pending;
  }
}

export class DistributionGroupTesterAssociationStore extends AssociationStore<
  DistributionGroupTesterAssociation,
  SerializedDistributionGroupTester
> {
  public LeftClass = DistributionGroup;
  protected AssociationClass = DistributionGroupTesterAssociation;

  protected disassociateManyResources(
    internalGroupKey: string,
    testerEmails: string[],
    options?: AssociationQueryOptions
  ): Promise<void> {
    return apiGateway.post(API.DELETE_ORG_TESTERS_IN_GROUP, {
      params: {
        org_name: options?.organizationName,
        group_name: options?.groupName,
      },
      body: {
        user_emails: testerEmails,
      },
      responseType: RESPONSE_TYPES.TEXT,
    });
  }

  protected associateManyResources(
    internalGroupKey: string,
    testerEmails: string[],
    options?: AssociationQueryOptions
  ): Promise<SerializedDistributionGroupTester[]> {
    return apiGateway.post<SerializedDistributionGroupTester[]>(API.ORG_TESTERS_IN_GROUP, {
      params: {
        org_name: options?.organizationName,
        group_name: options?.groupName,
      },
      body: {
        user_emails: testerEmails,
      },
      responseType: RESPONSE_TYPES.JSON,
    });
  }

  public internalDistributionGroupKey(organizationName: string | undefined, groupName: string | undefined): string {
    return `${organizationName}-${groupName}`;
  }

  public addTesterToGroup(testerEmail: string, organizationName: string, groupName: string) {
    return super.associateMany(this.internalDistributionGroupKey(organizationName, groupName), [testerEmail], false, {
      organizationName,
      groupName,
    });
  }

  public removeTestersFromGroup(testerEmails: string[], organizationName: string | undefined, groupName: string | undefined) {
    return super.disassociateMany(this.internalDistributionGroupKey(organizationName, groupName), testerEmails, false, {
      organizationName,
      groupName,
    });
  }

  public getAssociation(testerEmail: string, organizationName: string | undefined, groupName: string) {
    return super.get(this.internalDistributionGroupKey(organizationName, groupName), testerEmail);
  }
}

export const distributionGroupTesterAssociationStore = new DistributionGroupTesterAssociationStore();
