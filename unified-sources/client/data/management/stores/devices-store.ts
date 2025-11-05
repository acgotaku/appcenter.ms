import { apiGateway } from "@root/lib/http";
import { API } from "../constants";
import { Store } from "../../lib";
import { Device, DeserializedDevice, SerializedDevice } from "../models/device";

export type DevicesQueryAndOptions = { userId?: string };

export class DevicesStore extends Store<DeserializedDevice, SerializedDevice, Device> {
  protected ModelClass = Device;

  protected getModelId(model: Device): string | undefined {
    return model.udid;
  }

  protected deserialize(serialized: SerializedDevice, queryOrOptions?: any): DeserializedDevice {
    return {
      deviceName: serialized.device_name,
      osVersion: serialized.os_version,
      udid: serialized.udid,
      model: serialized.model,
      manufacturer: "Apple",
      registeredOn: new Date(serialized.registered_at),
    };
  }

  protected getCollection(query?: DevicesQueryAndOptions): Promise<SerializedDevice[]> {
    return apiGateway.get<SerializedDevice[]>(API.GET_DEVICES_FOR_USER);
  }

  protected getResource(id: string, query?: DevicesQueryAndOptions): Promise<SerializedDevice> {
    return apiGateway.get<SerializedDevice>(API.DEVICE_FOR_USER, {
      params: {
        device_udid: id,
      },
    });
  }

  public deleteResource(resource: Device, options?: DevicesQueryAndOptions): Promise<any> {
    return apiGateway.delete(API.DEVICE_FOR_USER, {
      params: {
        device_udid: resource.udid,
      },
    });
  }

  protected generateIdFromResponse(resource: SerializedDevice, query?: any) {
    return resource.udid;
  }
}

export const devicesStore = new DevicesStore();
