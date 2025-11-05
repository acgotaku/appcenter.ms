import { apiGateway } from "@root/lib/http";
import { Store } from "../../lib";
import { SerializedAPIToken, DeserializedAPIToken, APIToken } from "../models";

export class UserAPITokenStore extends Store<DeserializedAPIToken, SerializedAPIToken, APIToken> {
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
    return apiGateway.get<SerializedAPIToken[]>("/v0.1/api_tokens", {});
  }

  protected postResource(resource: APIToken, options: { token_type?: string } = {}): Promise<SerializedAPIToken> {
    return apiGateway.post<SerializedAPIToken>("/v0.1/api_tokens", {
      body: {
        description: resource.description,
        scope: [resource.scope],
        ...options,
      },
    });
  }

  protected deleteResource(resource: APIToken): Promise<void> {
    return apiGateway.delete("/v0.1/api_tokens/:api_token_id", {
      params: { api_token_id: resource.id },
      responseType: "text",
    });
  }

  // Just putting this here to add nice typings for `options`
  public create(resource: APIToken, optimistic?: boolean, options?: { token_type?: string }) {
    return super.create(resource, optimistic, options);
  }
}

export const userApiTokenStore = new UserAPITokenStore();
