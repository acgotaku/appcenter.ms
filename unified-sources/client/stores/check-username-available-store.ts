import { DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore } from "@root/lib/utils/external-data";
import { apiGateway } from "@root/lib/http";
import { API, PARAM_KEYS } from "@lib/constants/api";
import { action, computed } from "mobx";

export interface UsernameAvailability {
  name: string;
  available: boolean;
}

export class CheckUsernameAvailableStore extends DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore<UsernameAvailability> {
  @computed
  get available(): boolean {
    if (!this.data) {
      return true;
    }
    return this.data.available;
  }

  @action
  public checkUsernameAvailable(username: string): Promise<void> {
    const promise = apiGateway.get<UsernameAvailability>(API.CHECK_USERNAME_AVAILABILITY, {
      noBifrostToken: true,
      params: { [`${PARAM_KEYS.USER_NAME}`]: username },
    });

    return this.loadVoid(promise);
  }
}
