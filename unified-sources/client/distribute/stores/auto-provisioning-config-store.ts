import {
  SerializedAutoProvisioningConfig,
  DeserializedAutoProvisioningConfig,
  AutoProvisioningConfig,
} from "../models/auto-provisioning-config";
import { Store, ProxiedModel } from "@root/data/lib";
import { apiGateway } from "@root/lib/http";
import { AUTO_PROVISIONING_CONFIG_API as API } from "../utils/constants";
import { IApp, RESPONSE_TYPES } from "@lib/common-interfaces";

export type AutoProvisioningConfigQueryOrOptions = { ownerName: string; appName: string; destinationName: string };

export class AutoProvisioningConfigStore extends Store<
  DeserializedAutoProvisioningConfig,
  SerializedAutoProvisioningConfig,
  AutoProvisioningConfig
> {
  protected ModelClass = AutoProvisioningConfig;
  private ownerName!: string;
  private appName!: string;
  private destinationName!: string;

  protected generateIdFromResponse(resource: SerializedAutoProvisioningConfig, query?: any) {
    return resource.id;
  }

  protected getModelId(model: ProxiedModel<AutoProvisioningConfig>): string {
    return model.id;
  }

  protected getResource(id?: string, query?: AutoProvisioningConfigQueryOrOptions): Promise<SerializedAutoProvisioningConfig> {
    if (!this.checkOptions(query!)) {
      throw new Error("Please provide proper query details options for getting the resource details");
    }

    return apiGateway.get<SerializedAutoProvisioningConfig>(API.GET_AUTO_PROVISIONING_CONFIG, {
      params: {
        owner_name: query!.ownerName,
        app_name: query!.appName,
        destination_name: query!.destinationName,
      },
    });
  }

  protected postResource(
    resource: AutoProvisioningConfig,
    options: AutoProvisioningConfigQueryOrOptions
  ): Promise<void | SerializedAutoProvisioningConfig> {
    if (!this.checkOptions(options)) {
      throw new Error("Please provide proper query details options for creating the resource");
    }

    const postBody = {
      apple_developer_account_key: resource.accountServiceConnectionId,
      apple_distribution_certificate_key: resource.certificateServiceConnectionId,
      allow_auto_provisioning: resource.allowAutoProvisioning,
    };

    return apiGateway.post<SerializedAutoProvisioningConfig>(API.POST_AUTO_PROVISIONING_CONFIG, {
      params: {
        owner_name: options.ownerName,
        app_name: options.appName,
        destination_name: options.destinationName,
      },
      body: postBody,
    });
  }

  protected patchResource(
    resource: AutoProvisioningConfig,
    changes: Partial<AutoProvisioningConfig>,
    options: AutoProvisioningConfigQueryOrOptions
  ): Promise<any> {
    if (!this.checkOptions(options)) {
      throw new Error("Please provide proper query details options for updating the resource");
    }

    const patchBody = {
      apple_developer_account_key: changes.accountServiceConnectionId,
      apple_distribution_certificate_key: changes.certificateServiceConnectionId,
      allow_auto_provisioning: changes.allowAutoProvisioning,
    };

    return apiGateway.patch<SerializedAutoProvisioningConfig>(API.PATCH_AUTO_PROVISIONING_CONFIG, {
      params: {
        owner_name: options.ownerName,
        app_name: options.appName,
        destination_name: options.destinationName,
      },
      body: patchBody,
    });
  }

  protected deleteResource(resource: AutoProvisioningConfig, options: AutoProvisioningConfigQueryOrOptions): Promise<any> {
    if (!this.checkOptions(options)) {
      throw new Error("Please provide proper query details options for deleting the resource");
    }

    return apiGateway.delete<SerializedAutoProvisioningConfig>(API.DELETE_AUTO_PROVISIONING_CONFIG, {
      params: {
        owner_name: options.ownerName,
        app_name: options.appName,
        destination_name: options.destinationName,
      },
      responseType: RESPONSE_TYPES.TEXT,
    });
  }

  protected deserialize(serialized: SerializedAutoProvisioningConfig): DeserializedAutoProvisioningConfig {
    return {
      id: `${this.ownerName}-${this.appName}-${this.destinationName}`,
      appId: serialized.app_id,
      destinationId: serialized.destination_id,
      accountServiceConnectionId: serialized.apple_developer_account_key,
      certificateServiceConnectionId: serialized.apple_distribution_certificate_key,
      allowAutoProvisioning: serialized.allow_auto_provisioning || false,
    };
  }

  public getGlobalCacheKey() {
    // Here our global cache key should be distribution group id
    // retruning new uuid every time as currently not able to find the correct way to get the distribution group id
    return `${this.ownerName}-${this.appName}-${this.destinationName}`;
  }

  public configurationKey(app: IApp, distributionGroupName: string) {
    return `${app?.owner?.name}-${app?.name}-${distributionGroupName}`;
  }

  private checkOptions(options: AutoProvisioningConfigQueryOrOptions): boolean {
    if (!options || !options.appName || !options.destinationName || !options.ownerName) {
      return false;
    }

    this.appName = options.appName;
    this.ownerName = options.ownerName;
    this.destinationName = options.destinationName;

    return true;
  }
}

export const autoProvisioningConfigStore = new AutoProvisioningConfigStore();
