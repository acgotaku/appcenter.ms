import { apiGateway } from "@root/lib/http";
import { Store, ResourceRequest } from "../../lib";
import { SerializedWebhook, DeserializedWebhook, Webhook, WebhooksResult, WebhookPingResult } from "../models";
import { API } from "../constants";
import { appStore } from "@root/stores";
import { ObservableMap, observable, action } from "mobx";

export class WebhookStore extends Store<DeserializedWebhook, SerializedWebhook, Webhook> {
  protected ModelClass = Webhook;
  private pingRequests = new ObservableMap<string, ResourceRequest<WebhookPingResult | undefined>>();
  @observable public pingResult?: WebhookPingResult;

  @action
  public ping(webhook: Webhook) {
    const request = new ResourceRequest<WebhookPingResult | undefined>(
      this.pingWebhook(webhook),
      () => this.pingResult,
      (error, result) => {
        this.pingResult = result || undefined;
      }
    );
    this.pingRequests.set(webhook.id || "", request);
    return request;
  }

  public isPinging(webhookId: string) {
    return (this.pingRequests.get(webhookId) && this.pingRequests.get(webhookId)?.isPending) || false;
  }

  public pingError(webhookId: string) {
    return (this.pingRequests.get(webhookId) && this.pingRequests.get(webhookId)?.error) || null;
  }

  public pingFailed(webhookId: string) {
    return (this.pingRequests.get(webhookId) && this.pingRequests.get(webhookId)?.isFailed) || false;
  }

  @action
  protected clearAdditionalCaches() {
    this.pingResult = undefined;
    this.pingRequests.clear();
  }

  public pingWebhook(webhook: Webhook): Promise<WebhookPingResult> {
    return apiGateway.post<WebhookPingResult>(API.PING_WEBHOOK, {
      params: {
        owner_name: appStore.app.owner.name,
        app_name: appStore.app.name,
        webhook_id: webhook.id,
      },
    });
  }

  protected deserialize(serialized: SerializedWebhook): DeserializedWebhook {
    return {
      id: serialized.id,
      name: serialized.name,
      url: serialized.url,
      enabled: serialized.enabled,
      eventTypes: serialized.event_types,
    };
  }

  protected generateIdFromResponse(resource: SerializedWebhook, query?: any) {
    return resource.id;
  }

  protected getModelId(model: Webhook): string | undefined {
    return model.id;
  }

  protected getCollection(): Promise<SerializedWebhook[]> {
    return apiGateway
      .get<WebhooksResult>(API.WEBHOOKS, {
        params: {
          owner_name: appStore.app.owner.name,
          app_name: appStore.app.name,
        },
      })
      .then((result: WebhooksResult) => {
        return result.values;
      });
  }

  protected getResource(id: string, query?: any): Promise<SerializedWebhook> {
    return apiGateway.get<SerializedWebhook>(API.WEBHOOK, {
      params: {
        owner_name: appStore.app.owner.name,
        app_name: appStore.app.name,
        webhook_id: id,
      },
    });
  }

  protected patchResource(resource: Webhook, changes: Partial<DeserializedWebhook>, options?: any): Promise<any> {
    const update = Object.assign({}, resource, changes);

    return apiGateway.put<SerializedWebhook>(API.WEBHOOK, {
      params: {
        owner_name: appStore.app.owner.name,
        app_name: appStore.app.name,
        webhook_id: resource.id,
      },
      body: {
        name: update.name,
        url: update.url,
        enabled: update.enabled,
        event_types: update.eventTypes,
      },
    });
  }

  protected postResource(resource: Webhook): Promise<SerializedWebhook> {
    return apiGateway.post<SerializedWebhook>(API.WEBHOOKS, {
      body: {
        name: resource.name,
        url: resource.url,
        enabled: true,
        event_types: resource.eventTypes,
      },
      params: {
        owner_name: appStore.app.owner.name,
        app_name: appStore.app.name,
      },
    });
  }

  protected deleteResource(resource: Webhook): Promise<any> {
    return apiGateway.delete(API.WEBHOOK, {
      params: {
        owner_name: appStore.app.owner.name,
        app_name: appStore.app.name,
        webhook_id: resource.id,
      },
      responseType: "text",
    });
  }

  public getGlobalCacheKey() {
    return appStore.app ? appStore.app.id : undefined;
  }
}

export const webhookStore = new WebhookStore();
