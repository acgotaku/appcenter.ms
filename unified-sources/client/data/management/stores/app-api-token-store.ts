import { apiGateway } from "@root/lib/http";
import { appStore } from "@root/stores";

import { Store } from "../../lib";
import { SerializedAPIToken, DeserializedAPIToken, APIToken } from "../models";

export class AppAPITokenStore extends Store<DeserializedAPIToken, SerializedAPIToken, APIToken> {
  protected getResource(id: string, query?: any): Promise<SerializedAPIToken> {
    throw new Error("Method not implemented.");
  }
  protected patchResource(resource: APIToken, changes: Partial<DeserializedAPIToken>, options?: any): Promise<any> {
    throw new Error("Method not implemented.");
  }

  protected ModelClass = APIToken;

  protected deserialize(serialized: SerializedAPIToken): DeserializedAPIToken {
    return {
      id: serialized.id,
      description: serialized.description,
      scope: serialized.scope ? serialized.scope[0] : null,
      apiToken: serialized.api_token,
      createdAt: new Date(serialized.created_at),
    };
  }

  protected generateIdFromResponse(resource: SerializedAPIToken): string {
    return resource.id;
  }

  protected getModelId(model: APIToken): string | undefined {
    return model.id;
  }

  protected getCollection(): Promise<SerializedAPIToken[]> {
    return apiGateway.get<SerializedAPIToken[]>("/v0.1/apps/:owner_name/:app_name/api_tokens", {
      params: {
        owner_name: appStore.app.owner.name,
        app_name: appStore.app.name,
      },
    });
  }

  protected postResource(resource: APIToken): Promise<SerializedAPIToken> {
    return apiGateway.post<SerializedAPIToken>("/v0.1/apps/:owner_name/:app_name/api_tokens", {
      body: {
        description: resource.description,
        scope: [resource.scope],
      },
      params: {
        owner_name: appStore.app.owner.name,
        app_name: appStore.app.name,
      },
    });
  }

  protected deleteResource(resource: APIToken): Promise<void> {
    return apiGateway.delete("/v0.1/apps/:owner_name/:app_name/api_tokens/:api_token_id", {
      params: { api_token_id: resource.id, owner_name: appStore.app.owner.name, app_name: appStore.app.name },
      responseType: "text",
    });
  }
}

export const appApiTokenStore = new AppAPITokenStore();
