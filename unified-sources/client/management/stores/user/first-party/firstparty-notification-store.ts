import { portalServer } from "@root/lib/http";
import { userStore } from "@root/stores";
import { FetchStore } from "@root/data/lib";
import { API } from "@lib/constants";

interface FirstPartyNotification {
  service?: string;
  status?: string;
}

export class FirstPartyNotificationStore extends FetchStore<FirstPartyNotification[], FirstPartyNotification[]> {
  protected getEndpoint(): string {
    return API.FIRST_PARTY_NOTIFICATION;
  }

  protected deserialize(data: FirstPartyNotification[]): FirstPartyNotification[] {
    return data;
  }

  protected fetchData() {
    return portalServer.get<FirstPartyNotification[]>(API.FIRST_PARTY_NOTIFICATION, {});
  }

  public getGlobalCacheKey() {
    return userStore.currentUser ? userStore.currentUser.id : undefined;
  }

  public reset() {
    this.clearCache();
  }
}

export const firstPartyNotificationStore = new FirstPartyNotificationStore();
