import { Model } from "../../lib";
import { observable } from "mobx";
import { AADTenant } from "@lib/common-interfaces";

export interface SerializedAzureTenant {
  aad_tenant_id: string;
  display_name: string;
}

export class AzureTenant extends Model<AADTenant> implements AADTenant {
  @observable public tenantId?: string;
  @observable public displayName?: string;
  @observable public organizationName?: string;
}
