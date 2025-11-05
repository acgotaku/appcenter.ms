import { action, computed, observable, runInAction } from "mobx";
import { devicesStore, Device } from "@root/data/management";
import { INotificationMessage } from "../../constants/constants";
import { NotificationType } from "@root/shared";
import { RegisterDeviceStore } from "@root/stores/register-device-store";

const iPadImgSrc = require("@root/management/settings/devices/assets/iPad.jpg");
const iPhone5ImgSrc = require("@root/management/settings/devices/assets/iPhone5.jpg");
const iPhone6ImgSrc = require("@root/management/settings/devices/assets/iPhone6.jpg");
const iPhone7ImgSrc = require("@root/management/settings/devices/assets/iPhone7.jpg");
const iPhone10ImgSrc = require("@root/management/settings/devices/assets/iPhone10.jpg");

const iPhoneDeviceName = "iPhone";

export class DevicesUIStore {
  @observable public isVisible = false;
  @observable public isDeleteInProgress = false;
  private lastUdid!: string;
  private deviceToDelete!: string;
  private registerDeviceStore = new RegisterDeviceStore();

  @action
  public setDialogVisible(isVisible: boolean): void {
    this.isVisible = isVisible;
  }

  @action public setupDeleteDevice(udid: string) {
    this.deviceToDelete = udid;
    this.setDialogVisible(true);
  }

  public fetch(userId: string) {
    const options = {
      userId: userId,
    };
    devicesStore.fetchCollection(options);
  }

  public has(udid: string): boolean {
    return devicesStore.has(udid);
  }

  @computed
  get isFetching() {
    return devicesStore.isFetching(this.lastUdid) || devicesStore.isFetchingCollection;
  }

  @computed
  public get devices() {
    return devicesStore.resources;
  }

  @computed get isFetchingProfile() {
    return this.registerDeviceStore.isFetchingProfile;
  }

  @computed get currentDeviceUdid(): string | undefined {
    return this.registerDeviceStore.udid!;
  }

  @computed get currentDeviceIsRegistered(): boolean {
    return this.currentDeviceUdid ? !!devicesStore.get(this.currentDeviceUdid) : false;
  }

  public getDevice(deviceUdid: string) {
    this.lastUdid = deviceUdid;
    return devicesStore.get(deviceUdid) || devicesStore.fetchOne(deviceUdid).data;
  }

  @action
  public deleteDevice = (callback: (success: boolean) => void) => {
    if (this.deviceToDelete) {
      this.isDeleteInProgress = true;
      devicesStore
        .delete(this.deviceToDelete, false)
        .onSuccess(() => {
          runInAction(() => (this.isDeleteInProgress = false));
          callback(true);
          this.deviceToDelete = null as any;
        })
        .onFailure(() => {
          runInAction(() => (this.isDeleteInProgress = false));
          callback(false);
        });
    } else {
      callback(false);
    }
  };

  @action
  public registerDevice = () => {
    this.registerDeviceStore.fetchProfile(window.location.href);
  };

  @computed
  public get collectionNotification(): INotificationMessage | undefined {
    if (devicesStore.collectionFetchFailed) {
      return {
        type: NotificationType.Error,
        message: devicesStore.collectionFetchError!.message,
      };
    }
  }

  @computed
  public get getDeviceNotification(): INotificationMessage | undefined {
    if (devicesStore.fetchFailed(this.lastUdid)) {
      return {
        type: NotificationType.Error,
        message: devicesStore.fetchError(this.lastUdid).message,
      };
    }
  }

  @computed
  public get deletionNotification(): INotificationMessage | undefined {
    if (devicesStore.deletionFailed(this.lastUdid)) {
      return {
        type: NotificationType.Error,
        message: devicesStore.deletionError(this.lastUdid).message,
      };
    }
  }

  public getDeviceThumbnail(device: Device): string {
    const { deviceName } = device;
    if (deviceName!.indexOf(iPhoneDeviceName) > -1) {
      if (deviceName!.indexOf("5") > -1) {
        return iPhone5ImgSrc;
      } else if (deviceName!.indexOf("6") > -1) {
        return iPhone6ImgSrc;
      } else if (deviceName!.indexOf("7") > -1) {
        return iPhone7ImgSrc;
      } else {
        return iPhone10ImgSrc;
      }
    } else {
      return iPadImgSrc;
    }
  }
}

export const devicesUIStore = new DevicesUIStore();
