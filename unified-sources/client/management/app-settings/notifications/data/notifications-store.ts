import { FetchStore } from "@root/data/lib";
import { appStore } from "@root/stores";
import { apiGateway } from "@root/lib/http";
import { API } from "./constants";
import {
  DeserializedEventType,
  SerializedSettings,
  SerializedEventType,
  NotificationSettings,
  SelectSetting,
  CheckboxSetting,
  DeserializedSettings,
  EventValue,
} from "@root/management/app-settings/notifications/data/notifications-model";

import { SettingType, EventType, NewAppReleaseSetting, NewCrashGroupCreatedSetting } from "@root/data/management";

import { differenceBy } from "lodash";
import { action } from "mobx";
import { t } from "@root/lib/i18n";
import { logger } from "@root/lib/telemetry";

const dailyCrashGroupNotifications = true;

const newAppRelease: Partial<DeserializedEventType>[] = [
  { [EventType.NewAppRelease]: EventValue.Enabled },
  { [EventType.NewAppRelease]: EventValue.Daily },
  { [EventType.NewAppRelease]: EventValue.Disabled },
];

const resignFailed: Partial<DeserializedEventType>[] = [
  {
    [EventType.ResignGenericFailure]: EventValue.Enabled,
    [EventType.ResignCertificateMismatch]: EventValue.Enabled,
    [EventType.ResignInvalidCredentials]: EventValue.Enabled,
  },
  {
    [EventType.ResignGenericFailure]: EventValue.Disabled,
    [EventType.ResignCertificateMismatch]: EventValue.Disabled,
    [EventType.ResignInvalidCredentials]: EventValue.Disabled,
  },
];

const newCrashGroup: Partial<DeserializedEventType>[] = [
  { [EventType.NewCrashGroupCreated]: EventValue.Enabled },
  ...(dailyCrashGroupNotifications ? [{ [EventType.NewCrashGroupCreated]: EventValue.Daily }] : []),
  { [EventType.NewCrashGroupCreated]: EventValue.Disabled },
];

export function deserializeEventType(eventTypes: SerializedEventType[]): DeserializedEventType {
  return eventTypes.reduce((output, { event_type, value, default_value }) => {
    return { ...output, [event_type]: value === "Default" ? default_value : value };
  }, {} as DeserializedEventType);
}

function serializeEventType(serverValue: Partial<DeserializedEventType>): SerializedEventType[] {
  return Object.keys(serverValue).reduce(
    (eventTypes, key) => [...eventTypes, { event_type: key, value: serverValue[key], default_value: EventValue.Enabled }] as any,
    []
  );
}

function getSelectedIndex(eventTypes: DeserializedEventType, serverValues: Partial<DeserializedEventType>[]): number {
  return serverValues.findIndex((serverValue) => {
    return Object.keys(serverValue).every((key) => eventTypes[key] === serverValue[key]);
  }, -1);
}

export abstract class NotificationSettingsStore extends FetchStore<NotificationSettings, SerializedSettings> {
  private url: string;
  private tracked: boolean = false;

  constructor(url: string) {
    super();
    this.url = url;
  }

  private get params() {
    if (!this.url.includes(":ownerName") && !this.url.includes(":appName")) {
      return;
    }
    const params: { ownerName?: string; appName?: string } = {};
    if (this.url.includes(":ownerName")) {
      params.ownerName = appStore.app.owner.name;
    }
    if (this.url.includes(":appName")) {
      params.appName = appStore.app.name;
    }
    return { params };
  }

  public send(resource: Partial<DeserializedSettings>): Promise<SerializedSettings> {
    const body = this.serialize({ ...this.data, ...resource });
    const data = apiGateway.put<SerializedSettings>(this.url, {
      ...this.params,
      body: {
        enabled: body.enabled,
        settings: body.settings,
      },
    });
    data.then((serializedData) => this.setData(this.deserialize(serializedData)));
    return data;
  }

  @action
  protected setData(data: NotificationSettings) {
    this.data = data;
    this.tracked = false;
  }

  protected fetchData(): Promise<SerializedSettings> {
    const data = apiGateway.get<SerializedSettings>(this.url, {
      ...this.params,
    });
    return data;
  }

  // Formatting data from the UI to send back to the server
  public serialize(resource: DeserializedSettings | NotificationSettings): SerializedSettings {
    return {
      enabled: resource.enabled,
      user_enabled: true,
      settings: resource.sections.reduce(
        (_: SerializedEventType[], { settings }: Partial<{ title: string; settings: (SelectSetting | CheckboxSetting)[] }>) => [
          ..._,
          ...settings!.reduce((_: SerializedEventType[], setting: SelectSetting | CheckboxSetting) => {
            return setting.selectedIndex > -1 ? [..._, ...serializeEventType(setting.serverValues[setting.selectedIndex])] : _;
          }, []),
        ],
        []
      ),
    };
  }

  // Cleaning up data from the server for use in the UI
  protected deserialize(resource: SerializedSettings): NotificationSettings {
    const enabled = resource.hasOwnProperty("user_enabled") ? resource.user_enabled && resource.enabled : resource.enabled;
    const eventTypes = deserializeEventType(resource.settings);
    const distributionNewReleaseSettings: any = {
      id: "distribution-newAppRelease",
      type: SettingType.Select,
      label: t("management:notifications.newVersion"),
      telemetryKey: "app/emailNotifications/distribute/newReleaseNotification",
      selectedIndex: getSelectedIndex(eventTypes, newAppRelease),
      displayValues: [NewAppReleaseSetting.Immediately, NewAppReleaseSetting.Daily, NewAppReleaseSetting.Never],
      serverValues: newAppRelease,
    };
    const distributionSettings = [
      distributionNewReleaseSettings,
      {
        id: "distribution-resignFailed",
        type: SettingType.Checkbox,
        label: t("management:notifications.resignFailed"),
        telemetryKey: "app/emailNotifications/distribute/resignFailedNotification",
        selectedIndex: getSelectedIndex(eventTypes, resignFailed),
        displayValues: [true, false],
        serverValues: resignFailed,
      },
    ];

    const sections: NotificationSettings["sections"] = (!!appStore.app && appStore.app.isAppWhitelisted
      ? [
          {
            title: t("management:notifications.distribution"),
            settings: distributionSettings,
          },
        ]
      : []
    ).concat([
      {
        title: t("management:notifications.crashes"),
        settings: dailyCrashGroupNotifications
          ? [
              {
                id: "crashes-newCrashGroup",
                type: SettingType.Select,
                label: t("management:notifications.newCrashGroup"),
                telemetryKey: "app/emailNotifications/crash/newCrashGroupNotification",
                selectedIndex: getSelectedIndex(eventTypes, newCrashGroup),
                displayValues: [
                  NewCrashGroupCreatedSetting.Immediately,
                  NewCrashGroupCreatedSetting.Daily,
                  NewCrashGroupCreatedSetting.Never,
                ],
                serverValues: newCrashGroup,
              },
            ]
          : [
              {
                id: "crashes-newCrashGroup",
                type: SettingType.Checkbox,
                label: t("management:notifications.newCrashGroup"),
                telemetryKey: "app/emailNotifications/crash/newCrashGroupNotification",
                selectedIndex: getSelectedIndex(eventTypes, newCrashGroup),
                displayValues: [true, false],
                serverValues: newCrashGroup,
              },
            ],
      },
    ]);
    return new NotificationSettings({
      enabled,
      interactive: resource.user_enabled,
      sections: differenceBy<NotificationSettings["sections"][0]>(sections, [null, null], "title"),
    });
  }

  public trackNotificationSettings() {
    if (!this.tracked) {
      const notifications = this.serialize(this.data);
      logger.info("email-notifications-saved", {
        enabled: notifications.enabled,
        user_enabled: notifications.user_enabled,
        ...notifications.settings.reduce((properties, setting) => {
          if (setting.value === EventValue.Enabled) {
            properties[setting.event_type] = true;
          }
          return properties;
        }, {}),
      });
      this.tracked = true;
    }
  }
}

export class UserNotificationSettingsStore extends NotificationSettingsStore {
  constructor() {
    super(API.USER_EMAIL_SETTINGS);
  }
}

export class AppNotificationSettingsStore extends NotificationSettingsStore {
  constructor() {
    super(API.APP_EMAIL_SETTINGS);
  }

  public getGlobalCacheKey() {
    return appStore.app && appStore.app.id;
  }
}

export const userNotificationSettingsStore = new UserNotificationSettingsStore();
export const appNotificationSettingsStore = new AppNotificationSettingsStore();
