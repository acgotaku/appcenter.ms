import { observable, computed } from "mobx";
import { Model } from "../../lib";

export type ExportType = "BlobStorage" | "AppInsights";
export const ExportType = {
  BlobStorage: "BlobStorage" as ExportType,
  AppInsights: "AppInsights" as ExportType,
};

export type Type =
  | "blob_storage_connection_string"
  | "application_insights_instrumentation_key"
  | "blob_storage_linked_subscription"
  | "application_insights_linked_subscription";
export const Type = {
  BlobStorageConnectionString: "blob_storage_connection_string" as Type,
  ApplicationInsightsInstrumentationKey: "application_insights_instrumentation_key" as Type,
  BlobStorageLinkedSubscription: "blob_storage_linked_subscription" as Type,
  ApplicationInsightsLinkedSubscription: "application_insights_linked_subscription" as Type,
};

export type ExportState = "Enabled" | "Disabled" | "Pending" | "Deleted" | "Invalid";
export const ExportState = {
  Enabled: "Enabled" as ExportState,
  Disabled: "Disabled" as ExportState,
  Pending: "Pending" as ExportState,
  Deleted: "Deleted" as ExportState,
  Invalid: "Invalid" as ExportState,
};

export interface BaseSerializedExportConfiguration {
  type: Type;
  connection_string?: string;
  instrumentation_key?: string;
  subscription_id?: string;
}

export interface BaseDeserializedExportConfiguration {
  type?: Type;
  connectionString?: string;
  instrumentationKey?: string;
  subscriptionId?: string;
  resourceName?: string;
  resourceGroup?: string;
}

export interface SerializedExportConfiguration {
  id: string;
  export_type: ExportType;
  creation_time: number;
  last_run_time?: number;
  state: ExportState;
  state_info?: string;
  resource_name?: string;
  resource_group?: string;
  export_configuration?: BaseSerializedExportConfiguration;
}

export interface DeserializedExportConfiguration extends BaseDeserializedExportConfiguration {
  id?: string;
  exportType?: ExportType;
  creationTime?: number;
  lastRunTime?: number;
  state?: ExportState;
  stateInfo?: string;
  resource_name?: string;
  resource_group?: string;
}

export class ExportConfiguration extends Model<DeserializedExportConfiguration> implements DeserializedExportConfiguration {
  @observable public id?: string;
  @observable public type?: Type;
  @observable public exportType?: ExportType;
  @observable public creationTime?: number;
  @observable public lastRunTime?: number;
  @observable public state?: ExportState;
  @observable public connectionString?: string;
  @observable public instrumentationKey?: string;
  @observable public subscriptionId?: string;
  @observable public resourceName?: string;
  @observable public resourceGroup?: string;
  @observable public stateInfo?: string;

  @computed
  public get custom() {
    return this.instrumentationKey || this.connectionString;
  }
}

export class ExportConfigurationsResult {
  public values?: SerializedExportConfiguration[];
  public total?: number;
}
