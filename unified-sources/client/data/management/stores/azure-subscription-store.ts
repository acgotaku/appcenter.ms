import { apiGateway } from "@root/lib/http";
import { Store } from "../../lib";
import { AzureSubscription, SerializedAzureSubscription, DeserializedAzureSubscription } from "../models/azure-subscription";
import { API } from "../constants";
import { RESPONSE_TYPES } from "@lib/common-interfaces";

export type AzureSubscriptionsQuery = { ownerType: "user" | "org"; ownerName: string };
export type AzureSubscriptionQuery = AzureSubscriptionsQuery & { subscriptionId: string };

export class AzureSubscriptionStore extends Store<DeserializedAzureSubscription, SerializedAzureSubscription, AzureSubscription> {
  protected getResource(id: string, query?: any): Promise<SerializedAzureSubscription> {
    throw new Error("Method not implemented.");
  }

  protected getCollection(query?: AzureSubscriptionsQuery): Promise<SerializedAzureSubscription[]> {
    if (query?.ownerType === "org") {
      return apiGateway.get<SerializedAzureSubscription[]>(API.ORG_AZURE_SUBSCRIPTIONS, {
        params: {
          org_name: query.ownerName,
        },
      });
    } else if (query?.ownerType === "user") {
      return apiGateway.get<SerializedAzureSubscription[]>(API.USER_AZURE_SUBSCRIPTIONS);
    }
    throw new Error(`Method not implemented for ${query?.ownerType}`);
  }

  protected deleteResource(resource: AzureSubscription, options?: AzureSubscriptionQuery): Promise<any> {
    if (options?.ownerType === "user") {
      return apiGateway.delete<void>(API.USER_AZURE_SUBSCRIPTION, {
        params: {
          subscription_id: resource.id,
        },
        responseType: RESPONSE_TYPES.TEXT,
      });
    }

    throw new Error(`Method not implemented for ${options?.ownerType}`);
  }

  protected deserialize(serialized: SerializedAzureSubscription): DeserializedAzureSubscription {
    return {
      id: serialized.subscription_id,
      tenantId: serialized.tenant_id,
      name: serialized.subscription_name,
      createdAt: new Date(serialized.created_at),
      isBilling: serialized.is_billing || false,
      isBillable: serialized.is_billable || false,
    };
  }

  protected getModelId(model: AzureSubscription): string | undefined {
    return model.id;
  }
  protected ModelClass = AzureSubscription;

  protected generateIdFromResponse(resource: SerializedAzureSubscription, query?: any) {
    return resource.subscription_id;
  }
}

export const azureSubscriptionStore = new AzureSubscriptionStore();
