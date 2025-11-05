import { apiGateway } from "@root/lib/http";
import { Store } from "../../lib";
import { DeserializedBugTrackerAccount, SerializedBugTrackerAccount, BugTrackerAccount, isValidBugTrackerType } from "../models";
import { API } from "../constants";
import { appStore } from "@root/stores";

export class BugTrackerAccountStore extends Store<DeserializedBugTrackerAccount, SerializedBugTrackerAccount, BugTrackerAccount> {
  protected ModelClass = BugTrackerAccount;

  protected getCollection(query?: any): Promise<any> {
    return apiGateway.get<BugTrackerAccount[]>(API.BUGTRACKER_TOKENS, {});
  }

  protected deserialize(serialized: SerializedBugTrackerAccount): DeserializedBugTrackerAccount {
    const providerName = serialized.external_provider_name.toLowerCase();
    if (isValidBugTrackerType(providerName)) {
      return {
        accessTokenId: serialized.access_token_id,
        externalProviderName: providerName,
        externalUserEmail: serialized.external_user_email,
        externalAccountName: serialized.external_account_name,
      };
    }

    throw new Error(`Provider \`${providerName}\` is not a valid BugTrackerType`);
  }

  public getGlobalCacheKey() {
    return appStore.app ? appStore.app.id : undefined;
  }

  protected generateIdFromResponse(resource: SerializedBugTrackerAccount, query?: any) {
    return resource.access_token_id;
  }

  protected getModelId(model: BugTrackerAccount): string | undefined {
    return model.accessTokenId;
  }
}

export const bugtrackerAccountStore = new BugTrackerAccountStore();
