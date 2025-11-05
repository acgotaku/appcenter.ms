import { appNotificationSettingsStore } from "@root/management/app-settings/notifications/data/notifications-store";
import { DeserializedSettings } from "@root/management/app-settings/notifications/data/notifications-model";
import { action, observable, computed, reaction } from "mobx";
import { browserStore } from "@root/stores";
import { logger } from "@root/lib/telemetry";
import { BuildCompleteSetting, NewAppReleaseSetting } from "@root/data/management/models/notification-settings";

export class NotificationsUIStore {
  @observable private _data!: DeserializedSettings;
  private focusDisposer;

  constructor() {
    // @ts-ignore. [Should fix it in the future] Strict error.
    appNotificationSettingsStore.fetch().onSuccess(({ clientId, ...data }) => {
      this._data = data as any;
    });
    this.focusDisposer = reaction(
      () => browserStore.focused,
      (focused) => {
        if (!focused) {
          appNotificationSettingsStore.trackNotificationSettings();
        }
      }
    );
  }

  public dispose() {
    appNotificationSettingsStore.trackNotificationSettings();
    if (this.focusDisposer) {
      this.focusDisposer();
    }
  }

  @computed get isPending() {
    return appNotificationSettingsStore.isPending;
  }

  @computed get isLoaded() {
    return appNotificationSettingsStore.isLoaded;
  }

  @computed get data() {
    return this._data;
  }

  @computed get hockeyAppSections() {
    return this.data.sections.filter((section) => section.title === "Test");
  }

  @action public toggle = (value: boolean) => {
    this._data.enabled = value;
    appNotificationSettingsStore.send(this._data);

    logger.info("app/emailNotifications/toggle", { selection: value ? "on" : "off" });
  };

  @action public handleChange = (id: string, value: string | boolean) => {
    this._data.sections.forEach((section) => {
      section.settings.forEach((setting) => {
        if (setting.id === id) {
          const displayValues: (string | boolean)[] = setting.displayValues;
          setting.selectedIndex = displayValues.findIndex((x) => x === value);

          logger.info(setting.telemetryKey, { selection: this.getSettingTelemetry(value) });
        }
      });
    });
    appNotificationSettingsStore.send(this._data);
  };

  private getSettingTelemetry(setting: string | boolean): string {
    if (typeof setting === "boolean") {
      return setting ? "on" : "off";
    }

    switch (setting) {
      case BuildCompleteSetting.Always:
      case BuildCompleteSetting.Never:
      case NewAppReleaseSetting.Immediately:
      case NewAppReleaseSetting.Daily:
      case NewAppReleaseSetting.Never:
        return setting.toLowerCase();
      case BuildCompleteSetting.OnlyFixed:
        return "prevFailed";
      case BuildCompleteSetting.OnlyBroken:
        return "prevSucceeded";
      default:
        return "unset";
    }
  }
}
