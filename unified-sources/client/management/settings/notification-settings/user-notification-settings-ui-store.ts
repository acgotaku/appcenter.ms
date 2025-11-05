import { userNotificationSettingsStore } from "@root/management/app-settings/notifications/data/notifications-store";
import { DeserializedSettings } from "@root/management/app-settings/notifications/data/notifications-model";
import { action, observable, computed, reaction } from "mobx";
import { browserStore, userStore } from "@root/stores";
import { logger } from "@root/lib/telemetry";
import { AccountsManagementServiceApi } from "@root/api/clients/accounts-management-service/api";

export class UserNotificationSettingsUIStore {
  @observable private _data!: DeserializedSettings;
  private focusDisposer;

  constructor() {
    // @ts-ignore. [Should fix it in the future] Strict error.
    userNotificationSettingsStore.fetch().onSuccess(({ clientId, ...data }) => {
      this._data = data as any;
    });
    this.focusDisposer = reaction(
      () => browserStore.focused,
      (focused) => {
        if (!focused) {
          userNotificationSettingsStore.trackNotificationSettings();
        }
      }
    );
  }

  public dispose() {
    userNotificationSettingsStore.trackNotificationSettings();
    if (this.focusDisposer) {
      this.focusDisposer();
    }
  }

  @computed get isPending() {
    return userNotificationSettingsStore.isPending;
  }

  @computed get isLoaded() {
    return userNotificationSettingsStore.isLoaded;
  }

  @computed get data() {
    return this._data;
  }

  @computed get optIn() {
    return userStore.currentUser.settings!.marketing_opt_in === "true";
  }

  @action public toggleYourApps = (value: boolean) => {
    this._data.enabled = value;
    userNotificationSettingsStore.send(this._data);

    logger.info("user/emailNotifications/toggle", { selection: value ? "on" : "off" });
  };

  @action public toggleAppCenter = (value: boolean) => {
    const OPT_IN_SETTING_NAME = "marketing_opt_in";
    userStore.currentUser.settings!.marketing_opt_in = value ? "true" : "false";

    AccountsManagementServiceApi.putUsersSettings({ name: OPT_IN_SETTING_NAME }, { value: value.toString() });
  };
}
