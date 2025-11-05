import { observable } from "mobx";
import { Model } from "@root/data/lib";

export interface SerializedOrgComplianceSetting {
  id: string;
  org_id: string;
  certificate_connection_id: string;
  is_mam_enabled: boolean;
}

export interface DeserializedOrgComplianceSetting {
  id?: string;
  orgId?: string;
  certificateConnectionId?: string;
  isMamEnabled?: boolean;
}

export class OrgComplianceSetting extends Model<DeserializedOrgComplianceSetting> implements DeserializedOrgComplianceSetting {
  @observable public id?: string;
  @observable public orgId?: string;
  @observable public certificateConnectionId?: string;
  @observable public isMamEnabled?: boolean;
}
