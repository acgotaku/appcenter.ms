import { Store } from "../../lib";
import { DeserializedDataRetentionPolicy, SerializedDataRetentionPolicy, DataRetentionPolicy } from "../models/data-settings";
import { API } from "../constants";
import { apiGateway } from "@root/lib/http";
import { appStore } from "@root/stores";

export class DataSettingsStore extends Store<DeserializedDataRetentionPolicy, SerializedDataRetentionPolicy, DataRetentionPolicy> {
  protected ModelClass = DataRetentionPolicy;

  protected generateIdFromResponse(resource: SerializedDataRetentionPolicy, query?: any) {
    return appStore.app.id;
  }

  protected getModelId(model: DataRetentionPolicy): string {
    return appStore.app?.id || "";
  }

  protected getResource(id: string, query?: any): Promise<SerializedDataRetentionPolicy> {
    return apiGateway.get<SerializedDataRetentionPolicy>(API.DATA_RETENTION, {
      params: {
        owner_name: appStore.ownerName,
        app_name: appStore.app.name,
      },
    });
  }

  protected patchResource(resource: DataRetentionPolicy, options?: any): Promise<void | SerializedDataRetentionPolicy> {
    return apiGateway.put<SerializedDataRetentionPolicy>(API.DATA_RETENTION, {
      params: {
        owner_name: appStore.ownerName,
        app_name: appStore.app.name,
      },
      body: {
        retention_in_days: resource.retentionInDays,
      },
    });
  }

  protected deserialize<K extends "retentionInDays">(
    serialized: SerializedDataRetentionPolicy,
    queryOrOptions?: any,
    foreignKey?: K,
    foreignKeyValue?: DeserializedDataRetentionPolicy[K]
  ): DeserializedDataRetentionPolicy {
    return {
      retentionInDays: serialized.retention_in_days,
    };
  }
}

export const dataSettingsStore = new DataSettingsStore();
