import { Model } from "@root/data/lib";
import { SettingType, Setting, SettingsSection, EventType } from "@root/data/management";

export enum EventValue {
  Enabled = "Individual",
  Disabled = "Disabled",
  Daily = "Daily",
}

export type SerializedEventType = {
  event_type: EventType;
  value: EventValue | "Default";
  default_value: EventValue;
  [key: string]: any;
};

export interface SerializedSettings {
  enabled: boolean;
  user_enabled: boolean;
  settings: SerializedEventType[];
  [key: string]: any;
}

export type DeserializedEventType = {
  [key in EventType]: EventValue;
};

export interface DeserializedSetting<T, ValueT> extends Setting<T, ValueT> {
  serverValues: Partial<DeserializedEventType>[];
}

export type SelectSetting = DeserializedSetting<SettingType.Select, string>;
export type CheckboxSetting = DeserializedSetting<SettingType.Checkbox, boolean>;

export interface DeserializedSettings {
  enabled: boolean;
  interactive: boolean;
  sections: SettingsSection<SelectSetting | CheckboxSetting>[];
}

export class NotificationSettings extends Model<DeserializedSettings> implements DeserializedSettings {
  public enabled!: boolean;
  public interactive!: boolean;
  public sections!: SettingsSection<SelectSetting | CheckboxSetting>[];
}
