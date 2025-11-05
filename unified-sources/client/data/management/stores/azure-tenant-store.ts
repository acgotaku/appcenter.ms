import { apiGateway } from "@root/lib/http";
import { Store } from "../../lib";
import { API } from "../constants";
import { RESPONSE_TYPES } from "@lib/common-interfaces";
import { AzureTenant, SerializedAzureTenant } from "../models/azure-tenant";
import { AADTenant } from "@lib/common-interfaces";

export class AzureTenantStore extends Store<AADTenant, SerializedAzureTenant, AzureTenant> {
  protected getCollection(query?: any, foreignKey?: keyof AADTenant, foreignKeyValue?: string): Promise<SerializedAzureTenant[]> {
    return apiGateway
      .get<SerializedAzureTenant>(API.ORG_AZURE_TENANT, {
        params: {
          org_name: foreignKeyValue,
        },
      })
      .then((tenant) => {
        return [tenant];
      });
  }

  protected deleteResource(resource: AzureTenant, options?: any): Promise<any> {
    return apiGateway.delete<void>(API.ORG_AZURE_TENANT, {
      params: {
        org_name: options.organizationName,
      },
      responseType: RESPONSE_TYPES.TEXT,
    });
  }

  protected deserialize(
    serialized: SerializedAzureTenant,
    queryOrOptions: any,
    foreignKey: keyof AADTenant | undefined,
    foreignKeyValue: string
  ): AADTenant {
    return {
      tenantId: serialized.aad_tenant_id,
      displayName: serialized.display_name,
      organizationName: foreignKeyValue,
    };
  }

  protected getModelId(model: AzureTenant): string | undefined {
    return model.tenantId;
  }
  protected ModelClass = AzureTenant;

  protected generateIdFromResponse(resource: SerializedAzureTenant, query?: any) {
    return resource.aad_tenant_id;
  }
}

export const azureTenantStore = new AzureTenantStore();
