import { noop } from "lodash";
import { observable, computed, action } from "mobx";
import { AADTenant, AADTenantLinkingPayload, NotificationType } from "@lib/common-interfaces";
import { ResourceRequest } from "@root/data/lib";
import { organizationStore, locationStore, userStore } from "@root/stores";
import { azureTenantStore } from "../../data/management/stores";
import { AzureTenant } from "@root/data/management/models/azure-tenant";
import { INotificationMessage } from "./../constants/constants";
import { t } from "@root/lib/i18n";
import { portalServer } from "@root/lib/http";

export class ConnectTenantUIStore {
  constructor(private orgName: string) {}
  @observable public selectedTenantId!: string;
  @observable public request!: ResourceRequest<void>;

  @action public setSelectedTenantId(tenantId: string) {
    this.selectedTenantId = tenantId;
  }

  @action public initializeSelectedItem(tenants: AADTenant[]) {
    this.selectedTenantId = (tenants as any) && ((tenants.length > 0) as any) && tenants[0].tenantId!;
  }

  @computed get buttonIsDisabled(): boolean {
    return !this.selectedTenantId;
  }

  @computed get selectedTenantData(): AADTenant {
    return (window as any).initProps.aadTenantsData.find((tenantData) => tenantData.tenantId === this.selectedTenantId);
  }

  @computed get isLoading() {
    return this.request && this.request.isPending;
  }

  @computed
  get addTenantNotification(): INotificationMessage {
    if (!this.request || this.request.isPending || !this.request.isFailed) {
      return null as any;
    }
    return {
      type: NotificationType.Error,
      message: t("management:aadTenantSelectionList.error"),
    };
  }

  @action
  public connectTenant() {
    const requestBody: AADTenantLinkingPayload = {
      org_id: organizationStore.find(this.orgName)!.id!,
      tenant_id: this.selectedTenantData.tenantId!,
      display_name: this.selectedTenantData.displayName!,
      user_id: userStore.currentUser.id!,
    };
    this.request = new ResourceRequest(
      portalServer.post(`${(window as any).location.origin}/aad/link_tenant`, { body: requestBody }),
      noop,
      noop
    ).onSuccess(() => {
      azureTenantStore.add(
        new AzureTenant({
          tenantId: this.selectedTenantData.tenantId,
          displayName: this.selectedTenantData.displayName,
          organizationName: this.orgName,
        })
      );
      locationStore.goUp();
    }) as any;
  }
}
