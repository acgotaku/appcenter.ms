import { observable } from "mobx";
import { Model } from "../../lib";

export interface SerializedAPIToken {
  id: string;
  api_token: string;
  description: string;
  app_scope: string;
  created_at: string;
  scope: ("all" | "viewer")[];
}

export interface DeserializedAPIToken {
  id?: string;
  apiToken?: string;
  description?: string;
  createdAt?: Date;
  scope: SerializedAPIToken["scope"][0] | null;
}

export class APIToken extends Model<DeserializedAPIToken> implements DeserializedAPIToken {
  // @ts-ignore. [Should fix it in the future] not null key
  public static scopes: { [key in DeserializedAPIToken["scope"]]: string } = {
    all: "Full Access",
    viewer: "Read Only",
  };

  public tokenType?: string;
  @observable public id?: string;
  @observable public description?: string;
  @observable public createdAt?: Date;
  @observable public apiToken?: string;
  @observable public scope!: DeserializedAPIToken["scope"];

  public get humanReadableScope() {
    return APIToken.scopes[this.scope!];
  }
}
