import { observable } from "mobx";
import { Model } from "../../lib";
import { EventType, BuildCompleteSetting } from "@root/data/management/models/notification-settings";

export type BuildCompleteSucceedsSetting = BuildCompleteSetting.Never | BuildCompleteSetting.OnlyFixed | BuildCompleteSetting.Always;

export type BuildCompleteFailsSetting = BuildCompleteSetting.Never | BuildCompleteSetting.OnlyBroken | BuildCompleteSetting.Always;

export interface SerializedWebhook {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  event_types: EventType[];
}

export interface DeserializedWebhook {
  id?: string;
  name?: string;
  url?: string;
  enabled?: boolean;
  eventTypes?: EventType[];
}

export class Webhook extends Model<DeserializedWebhook> implements DeserializedWebhook {
  @observable public id?: string;
  @observable public name?: string;
  @observable public url?: string;
  @observable public enabled?: boolean;
  @observable public eventTypes?: EventType[];
}

export interface WebhooksResult {
  values: SerializedWebhook[];
}

export interface WebhookPingResult {
  response_status_code: number;
  response_reason: string;
}
