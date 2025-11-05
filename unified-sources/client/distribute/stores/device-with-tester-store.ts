import { DeviceListStore } from "./device-list-store";
import { TesterListStore } from "./tester-list-store";
import { DeviceWithTester } from "../models/device-with-tester";
import { computed, action, observable } from "mobx";
import { forEach, assign, find, isEmpty } from "lodash";

/**
 * Store that is used to join devices with testers list.
 */
export class DeviceWithTesterStore {
  private deviceListStore: DeviceListStore;
  private testerListStore: TesterListStore;

  constructor(deviceListStore: DeviceListStore, testerListStore: TesterListStore) {
    this.deviceListStore = deviceListStore;
    this.testerListStore = testerListStore;
  }

  @action
  public fetchDevices() {
    if (!this.testerListStore.isPending) {
      this.testerListStore.fetchTesterList();
    }

    this.deviceListStore.fetchDeviceList();
  }

  @computed
  public get data(): DeviceWithTester[] {
    const devices = this.deviceListStore.data;
    const testers = this.testerListStore.data;
    if (!devices || isEmpty(testers)) {
      return null as any;
    }

    const data: DeviceWithTester[] = observable([]);
    forEach(devices, (device, key) => {
      const tester = find(testers!, (tester) => {
        return device.ownerId === tester.id;
      });
      if (tester) {
        data.push(assign(device, { tester: tester }) as DeviceWithTester);
      }
    });
    return data;
  }

  @computed
  public get error() {
    return this.deviceListStore.error || this.testerListStore.error;
  }

  @computed
  public get isPending() {
    return this.deviceListStore.isPending || this.testerListStore.isPending;
  }

  @computed
  public get isLoaded() {
    return this.deviceListStore.isLoaded && this.testerListStore.isLoaded;
  }

  @computed
  public get isFailed() {
    return this.deviceListStore.isFailed || this.testerListStore.isFailed;
  }
}
