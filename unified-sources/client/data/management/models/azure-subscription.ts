import { Model } from "../../lib";
import { observable } from "mobx";

export interface SerializedAzureSubscription {
  subscription_id: string;
  tenant_id: string;
  subscription_name: string;
  created_at: string;
  is_billable: boolean;
  is_billing: boolean;
}

export interface DeserializedAzureSubscription {
  id?: string;
  tenantId?: string;
  name?: string;
  isBillable?: boolean;
  isBilling?: boolean;
  createdAt?: Date;
  // foriegn key
  userId?: string;
}

export enum SubscriptionType {
  Organization,
  User,
}

export class AzureSubscription extends Model<DeserializedAzureSubscription> implements DeserializedAzureSubscription {
  @observable public id?: string;
  @observable public tenantId?: string;
  @observable public name?: string;
  @observable public createdAt?: Date;
  @observable public userId?: string;
  @observable public isBilling?: boolean;
  @observable public isBillable?: boolean;
}
