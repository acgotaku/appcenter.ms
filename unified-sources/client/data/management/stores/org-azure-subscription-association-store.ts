import { apiGateway } from "@root/lib/http";
import { RESPONSE_TYPES } from "@lib/common-interfaces";
import { AssociationStore, ResourceRequest } from "../../lib";
import { OrgAzureSubscription } from "../models/org-azure-subscription";
import { Organization } from "../../shell/models/organization";
import { SerializedAzureSubscription } from "../models/azure-subscription";
import { API } from "../constants";

export class OrgAzureSubscriptionAssociationStore extends AssociationStore<OrgAzureSubscription> {
  public LeftClass = Organization;
  protected AssociationClass = OrgAzureSubscription;

  protected disassociateResources(organizationName: string, subscriptionId: string): Promise<void> {
    return apiGateway
      .delete<SerializedAzureSubscription[]>(API.ORG_AZURE_SUBSCRIPTION, {
        params: {
          org_name: organizationName,
          subscription_id: subscriptionId,
        },
        responseType: RESPONSE_TYPES.TEXT,
      })
      .then(() => void 0);
  }

  public disassociate(organizationName: string, subscriptionId: string): ResourceRequest<void, void> {
    return super.disassociate(organizationName, subscriptionId);
  }
}

export const orgAzureSubscriptionAssociationStore = new OrgAzureSubscriptionAssociationStore();
