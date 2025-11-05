import { appStore } from "@root/stores";
import { apiGateway } from "@root/lib/http";
import { DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore, ExternalDataState } from "@root/shared";
import { Device, Status } from "../models/device";
import { Urls } from "../utils/constants";
import { upperFirst } from "lodash";

/**
 * Device interface(Server side).
 */
export interface ServerDevice {
  udid: string;
  device_name: string;
  os_version: string;
  status: string;
  owner_id: string;
}

const DeviceManufacturer = "Apple";

/**
 * Store for listing devices of a given distribution group.
 *
 */
export class DeviceListStore extends DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore<Device[]> {
  private _groupName: string;

  constructor(groupName: string) {
    super(ExternalDataState.Loaded);
    this._groupName = groupName;
  }

  public fetchDeviceList() {
    const fetchDataPromise = apiGateway.get<Device[]>(Urls.GetDevicesForDistributionGroupPath, {
      params: {
        app_id: appStore.name,
        owner_id: appStore.ownerName,
        distribution_group_name: this._groupName,
      },
    });

    if (this.data) {
      this.loadInBackgroundVoid(fetchDataPromise, DeviceListStore.transform.bind(this) as any);
    } else {
      this.loadVoid(fetchDataPromise, DeviceListStore.transform.bind(this) as any);
    }
  }

  public static transform(devices: ServerDevice[]): Device[] {
    return devices.map((d: ServerDevice) => ({
      udid: d.udid,
      manufacturer: DeviceManufacturer,
      deviceName: d.device_name,
      osVersion: d.os_version,
      status: Status[upperFirst(d.status)],
      ownerId: d.owner_id,
    }));
  }
}
