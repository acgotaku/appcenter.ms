import { apiGateway } from "@root/lib/http";
import { Store, ResourceRequest } from "../../lib";
import { RESPONSE_TYPES } from "@lib/common-interfaces";
import {
  SerializedExportConfiguration,
  BaseSerializedExportConfiguration,
  DeserializedExportConfiguration,
  ExportConfiguration,
  ExportConfigurationsResult,
  Type,
  ExportState,
} from "../models";
import { API } from "../constants";
import { appStore } from "@root/stores";

export type ExportConfigurationQuery = {
  ownerName?: string;
  appName?: string;
};

export class ExportConfigurationStore extends Store<
  DeserializedExportConfiguration,
  SerializedExportConfiguration,
  ExportConfiguration
> {
  protected ModelClass = ExportConfiguration;

  protected generateIdFromResponse(resource: SerializedExportConfiguration, query?: any) {
    return resource.id;
  }

  protected getModelId(model: ExportConfiguration): string | undefined {
    return model.id;
  }

  protected getResource(id: string, query?: ExportConfigurationQuery): Promise<SerializedExportConfiguration> {
    return apiGateway.get<SerializedExportConfiguration>(API.EXPORT_CONFIGURATION, {
      params: {
        owner_name: query?.ownerName,
        app_name: query?.appName,
        export_configuration_id: id,
      },
    });
  }

  protected getCollection(query?: ExportConfigurationQuery): Promise<SerializedExportConfiguration[]> {
    return apiGateway
      .get<ExportConfigurationsResult>(API.EXPORT_CONFIGURATIONS, {
        params: {
          owner_name: query?.ownerName,
          app_name: query?.appName,
        },
      })
      .then((result: ExportConfigurationsResult) => {
        return result.values || [];
      });
  }

  protected postResource(resource: ExportConfiguration, query?: ExportConfigurationQuery): Promise<SerializedExportConfiguration> {
    const body: Partial<BaseSerializedExportConfiguration> = {
      type: resource.type,
    };

    switch (resource.type) {
      case Type.BlobStorageConnectionString:
        body.connection_string = resource.connectionString;
        break;
      case Type.ApplicationInsightsInstrumentationKey:
        body.instrumentation_key = resource.instrumentationKey;
        break;
      default:
        body.subscription_id = resource.subscriptionId;
    }

    return apiGateway.post<SerializedExportConfiguration>(API.EXPORT_CONFIGURATIONS, {
      params: {
        owner_name: query?.ownerName,
        app_name: query?.appName,
      },
      body,
    });
  }

  protected patchResource(
    resource: ExportConfiguration,
    changes: Partial<DeserializedExportConfiguration>,
    query?: ExportConfigurationQuery
  ): Promise<any> {
    const update: Partial<BaseSerializedExportConfiguration> = {
      type: changes.type || resource.type,
    };

    switch (resource.type) {
      case Type.BlobStorageConnectionString:
        update.connection_string = changes.connectionString || resource.connectionString;
        break;
      case Type.ApplicationInsightsInstrumentationKey:
        update.instrumentation_key = changes.instrumentationKey || resource.instrumentationKey;
        break;
      default:
        update.subscription_id = changes.subscriptionId || resource.subscriptionId;
    }

    return apiGateway.patch<SerializedExportConfiguration>(API.EXPORT_CONFIGURATION, {
      params: {
        owner_name: query?.ownerName,
        app_name: query?.appName,
        export_configuration_id: resource.id,
      },
      body: update,
    });
  }

  protected postState(
    resource: ExportConfiguration,
    state: ExportState,
    query?: ExportConfigurationQuery
  ): Promise<SerializedExportConfiguration> {
    const endpoint = state === ExportState.Enabled ? API.EXPORT_CONFIGURATION_ENABLE : API.EXPORT_CONFIGURATION_DISABLE;
    return apiGateway.post<SerializedExportConfiguration>(endpoint, {
      responseType: RESPONSE_TYPES.TEXT,
      params: {
        owner_name: query?.ownerName,
        app_name: query?.appName,
        export_configuration_id: resource.id,
      },
      body: {},
    });
  }

  public setState(resource: ExportConfiguration, state: ExportState, optimistic = true, query?: ExportConfigurationQuery) {
    const id = this.getModelId(resource);
    const changes = { state };
    const resourceCopy = optimistic ? Object.assign({}, resource) : null;
    if (optimistic) {
      resource.applyChanges(changes);
    }

    const request = new ResourceRequest(
      this.postState(resource, state, query),
      () => this.get(id!),
      (error) => {
        if (optimistic && error && resourceCopy) {
          resource.revertChanges(resourceCopy, changes);
        } else if (!optimistic && !error) {
          resource.applyChanges(changes);
        }
      }
    );

    return request;
  }

  protected deleteResource(resource: ExportConfiguration, query?: ExportConfigurationQuery): Promise<any> {
    return apiGateway.delete(API.EXPORT_CONFIGURATION, {
      params: {
        owner_name: query?.ownerName,
        app_name: query?.appName,
        export_configuration_id: resource.id,
      },
      responseType: "text",
    });
  }

  protected deserialize(serialized: SerializedExportConfiguration): DeserializedExportConfiguration {
    return {
      id: serialized.id,
      type: serialized.export_configuration ? serialized.export_configuration.type : undefined,
      exportType: serialized.export_type,
      connectionString: serialized.export_configuration ? serialized.export_configuration.connection_string : undefined,
      instrumentationKey: serialized.export_configuration ? serialized.export_configuration.instrumentation_key : undefined,
      subscriptionId: serialized.export_configuration ? serialized.export_configuration.subscription_id : undefined,
      resourceGroup: serialized.resource_group ? serialized.resource_group : undefined,
      resourceName: serialized.resource_name ? serialized.resource_name : undefined,
      creationTime: serialized.creation_time,
      lastRunTime: serialized.last_run_time,
      state: serialized.state,
      stateInfo: serialized.state_info,
    };
  }

  public getGlobalCacheKey() {
    return appStore.app ? appStore.app.id : undefined;
  }
}

export const exportConfigurationStore = new ExportConfigurationStore();
