import { observable } from "mobx";
import { Model } from "../../lib";
import { BugTrackerType } from "./bugtracker";

export interface SerializedBugTrackerAccount {
  access_token_id: string;
  external_provider_name: string;
  external_user_email: string;
  external_account_name: string;
}

export interface DeserializedBugTrackerAccount {
  accessTokenId?: string;
  externalProviderName?: BugTrackerType;
  externalUserEmail?: string;
  externalAccountName?: string;
}

export class BugTrackerAccount extends Model<DeserializedBugTrackerAccount> implements DeserializedBugTrackerAccount {
  @observable public accessTokenId?: string;
  @observable public externalProviderName?: BugTrackerType;
  @observable public externalUserEmail?: string;
  @observable public externalAccountName?: string;
}
