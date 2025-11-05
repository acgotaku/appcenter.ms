import { action, computed } from "mobx";
import { firstPartyNotificationStore } from "./firstparty-notification-store";

export class FirstPartyNotificationUIStore {
  @action
  public fetchData() {
    if (!firstPartyNotificationStore.isLoaded || !firstPartyNotificationStore.data) {
      firstPartyNotificationStore.fetch();
      setTimeout(() => {
        firstPartyNotificationStore.reset();
      }, 5 * 60 * 1000);
    }
  }

  public displayNotification(): boolean {
    return !!firstPartyNotificationStore.isLoaded && !!firstPartyNotificationStore.data && !!this.displayMessage;
  }

  public thereAreNotifications(): boolean {
    return !!firstPartyNotificationStore.isLoaded && !!firstPartyNotificationStore.data;
  }

  @computed
  public get displayMessage(): string {
    return firstPartyNotificationStore.data![0].status!;
  }
}
