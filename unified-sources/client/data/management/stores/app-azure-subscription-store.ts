import { apiGateway } from "@root/lib/http";
import { Store } from "../../lib";
import { RESPONSE_TYPES } from "@lib/common-interfaces";
import { AppAzureSubscription, IAppAzureSubscription } from "../models/app-azure-subscription";
import { SerializedAzureSubscription } from "../models/azure-subscription";
import { API } from "../constants";

type AppAzureSubscriptionQuery = { appName: string; ownerName: string; subscriptionId: string };

export class AppAzureSubscriptionStore extends Store<IAppAzureSubscription, SerializedAzureSubscription, AppAzureSubscription> {
  protected ModelClass = AppAzureSubscription;

  protected generateIdFromResponse(resource: SerializedAzureSubscription, query?: any) {
    return `${query.ownerName}-${query.appName}-${resource.subscription_id}`;
  }

  protected getModelId(model: AppAzureSubscription): string {
    return model.id;
  }

  protected deserialize(serialized: SerializedAzureSubscription, queryOrOptions?: AppAzureSubscriptionQuery): IAppAzureSubscription {
    return {
      appName: queryOrOptions?.appName || "",
      ownerName: queryOrOptions?.ownerName || "",
      subscriptionId: serialized.subscription_id,
    };
  }

  protected postResource(
    resource: AppAzureSubscription,
    options?: AppAzureSubscriptionQuery
  ): Promise<void | SerializedAzureSubscription> {
    return apiGateway.post<void>(API.APP_AZURE_SUBSCRIPTIONS, {
      params: {
        app_name: options?.appName,
        owner_name: options?.ownerName,
      },
      body: {
        subscription_id: resource.subscriptionId,
      },
      responseType: RESPONSE_TYPES.TEXT,
    });
  }

  protected deleteResource(resource: AppAzureSubscription, options?: AppAzureSubscriptionQuery): Promise<any> {
    return apiGateway.delete<void>(API.APP_AZURE_SUBSCRIPTION, {
      params: {
        app_name: options?.appName,
        owner_name: options?.ownerName,
        subscription_id: options?.subscriptionId,
      },
      responseType: RESPONSE_TYPES.TEXT,
    });
  }

  protected getResource(id: string, query?: any): Promise<SerializedAzureSubscription> {
    throw new Error("Method not implemented.");
  }
  protected getCollection(
    query?: any,
    foreignKey?: "subscriptionId" | "appName" | "ownerName",
    foreignKeyValue?: string
  ): Promise<SerializedAzureSubscription[]> {
    throw new Error("Method not implemented.");
  }
  protected patchResource(resource: AppAzureSubscription, changes: Partial<IAppAzureSubscription>, options?: any): Promise<any> {
    throw new Error("Method not implemented.");
  }
}

export const appAzureSubscriptionStore = new AppAzureSubscriptionStore();
