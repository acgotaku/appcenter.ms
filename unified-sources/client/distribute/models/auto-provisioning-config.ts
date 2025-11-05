import { observable } from "mobx";
import { Model } from "@root/data/lib";

export interface SerializedAutoProvisioningConfig {
  id: string;
  app_id: string;
  destination_id: string;
  apple_developer_account_key: string;
  apple_distribution_certificate_key: string;
  allow_auto_provisioning: boolean;
}

export interface DeserializedAutoProvisioningConfig {
  id: string;
  appId: string;
  destinationId: string;
  accountServiceConnectionId: string;
  certificateServiceConnectionId: string;
  allowAutoProvisioning: boolean;
}

export class AutoProvisioningConfig extends Model<DeserializedAutoProvisioningConfig> implements DeserializedAutoProvisioningConfig {
  @observable public id!: string;
  @observable public appId!: string;
  @observable public destinationId!: string;
  @observable public accountServiceConnectionId!: string;
  @observable public certificateServiceConnectionId!: string;
  @observable public allowAutoProvisioning!: boolean;
}
