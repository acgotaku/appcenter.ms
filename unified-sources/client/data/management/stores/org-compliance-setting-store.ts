import {
  SerializedOrgComplianceSetting,
  OrgComplianceSetting,
  DeserializedOrgComplianceSetting,
} from "@root/data/management/models/org-compliance-setting";
import { Store, ProxiedModel } from "@root/data/lib";
import { apiGateway } from "@root/lib/http";
import { API } from "../constants";
import { RESPONSE_TYPES } from "@lib/common-interfaces";

export type OrgComplianceSettingQueryOrOptions = { orgName: string };

export class OrgComplianceSettingStore extends Store<
  DeserializedOrgComplianceSetting,
  SerializedOrgComplianceSetting,
  OrgComplianceSetting
> {
  protected ModelClass = OrgComplianceSetting;

  protected generateIdFromResponse(resource: SerializedOrgComplianceSetting, query?: any) {
    return resource.id;
  }

  protected getModelId(model: ProxiedModel<OrgComplianceSetting>): string | undefined {
    return model.id;
  }

  protected getResource(id: string, query: OrgComplianceSettingQueryOrOptions): Promise<SerializedOrgComplianceSetting> {
    return apiGateway.get<SerializedOrgComplianceSetting>(API.ORG_COMPLIANCE_SETTINGS_WITH_ID, {
      params: {
        org_name: query.orgName,
        compliance_setting_id: id,
      },
    });
  }

  protected getCollection(query: OrgComplianceSettingQueryOrOptions): Promise<SerializedOrgComplianceSetting[]> {
    return apiGateway.get<SerializedOrgComplianceSetting[]>(API.ORG_COMPLIANCE_SETTINGS, {
      params: {
        org_name: query.orgName,
      },
    });
  }

  protected postResource(
    resource: OrgComplianceSetting,
    options: OrgComplianceSettingQueryOrOptions
  ): Promise<void | SerializedOrgComplianceSetting> {
    const postBody = {
      certificate_connection_id: resource.certificateConnectionId,
    };

    return apiGateway.post<SerializedOrgComplianceSetting>(API.ORG_COMPLIANCE_SETTINGS, {
      params: {
        org_name: options.orgName,
      },
      body: postBody,
    });
  }

  protected patchResource(
    resource: OrgComplianceSetting,
    changes: Partial<OrgComplianceSetting>,
    options: OrgComplianceSettingQueryOrOptions
  ): Promise<void | SerializedOrgComplianceSetting> {
    const patchBody = {
      certificate_connection_id: changes.certificateConnectionId,
    };

    return apiGateway.patch<SerializedOrgComplianceSetting>(API.ORG_COMPLIANCE_SETTINGS_WITH_ID, {
      params: {
        org_name: options.orgName,
        compliance_setting_id: resource.id,
      },
      body: patchBody,
    });
  }
  protected deleteResource(resource: OrgComplianceSetting, options: OrgComplianceSettingQueryOrOptions): Promise<any> {
    return apiGateway.delete<SerializedOrgComplianceSetting>(API.ORG_COMPLIANCE_SETTINGS_WITH_ID, {
      params: {
        org_name: options.orgName,
        compliance_setting_id: resource.id,
      },
      responseType: RESPONSE_TYPES.TEXT,
    });
  }
  protected deserialize(serialized: SerializedOrgComplianceSetting, query: any = {}): DeserializedOrgComplianceSetting {
    return {
      id: serialized.id,
      certificateConnectionId: serialized.certificate_connection_id,
      isMamEnabled: serialized.is_mam_enabled,
      orgId: serialized.org_id,
    };
  }
}

export const orgComplianceSettingStore = new OrgComplianceSettingStore();
