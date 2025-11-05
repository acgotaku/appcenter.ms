import { Model } from "@root/data/lib/model";
import { observable, computed } from "mobx";

export interface SerializedDevice {
  udid: string;
  device_name: string;
  os_version: string;
  model: string;
  os_build: string;
  status: string;
  registered_at: string;
}

export interface DeserializedDevice {
  udid?: string;
  deviceName?: string;
  osVersion?: string;
  model?: string;
  manufacturer?: string;
  registeredOn?: Date;
}

export class Device extends Model<DeserializedDevice> implements DeserializedDevice {
  @observable public udid?: string;
  @observable public deviceName?: string;
  @observable public osVersion?: string;
  @observable public model?: string;
  @observable public manufacturer?: string;
  @observable public registeredOn?: Date;

  @computed
  public get displayName(): string {
    return `${this.manufacturer} ${this.deviceName}`;
  }
}
