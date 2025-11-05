import { observable, computed, action } from "mobx";
import { APP_OWNER_TYPES } from "@lib/common-interfaces";
import { userStore } from "@root/stores/user-store";
import { organizationStore } from "@root/stores/organization-store";
import { User } from "@root/data/shell/models/user";
import { Organization } from "@root/data/shell/models/organization";
import { SubscriptionType } from "@root/data/management/models/azure-subscription";
import { azureSubscriptionStore } from "@root/data/management/stores/azure-subscription-store";
import { azureTenantStore } from "@root/data/management/stores/azure-tenant-store";
import { orgAzureSubscriptionAssociationStore } from "@root/data/management/stores/org-azure-subscription-association-store";
import { AzureTenant } from "@root/data/management/models/azure-tenant";
import { notify } from "@root/stores/notification-store";
import { FetchError } from "@root/lib/http/fetch-error";
import { t } from "@root/lib/i18n";

export class AzureUIStore {
  constructor(private subscriptionType: SubscriptionType, private ownerName?: string) {
    this.fetchSubscriptions();
    this.fetchTenants();
  }

  @observable public isTenantRemovalDialogVisible: boolean = false;

  @computed
  public get owner(): Partial<User | Organization> {
    return this.subscriptionType === SubscriptionType.Organization ? organizationStore.find(this.ownerName)! : userStore.currentUser;
  }

  @computed
  public get subscriptions() {
    return this.owner.azureSubscriptions || [];
  }

  @computed
  get subscriptionRelationshipId(): string {
    return this.subscriptionType === SubscriptionType.Organization
      ? `${orgAzureSubscriptionAssociationStore.id}-${this.ownerName}`
      : `userId-${userStore.currentUser.id}`;
  }

  @computed
  public get isFetchingSubscriptions() {
    return azureSubscriptionStore.isFetchingRelationship(this.subscriptionRelationshipId);
  }

  @computed
  public get isFetchingSubscriptionFailed() {
    return azureSubscriptionStore.relationshipsFetchFailed(this.subscriptionRelationshipId);
  }

  @computed
  public get tenant(): AzureTenant {
    if (this.subscriptionType === SubscriptionType.Organization) {
      const org = this.owner as Partial<Organization>;
      return org.azureTenant!;
    }
    return null as any;
  }

  @computed
  get tenantRelationshipId(): string {
    return this.subscriptionType === SubscriptionType.Organization ? `organizationId-${this.ownerName}` : (null as any);
  }

  @computed
  public get isFetchingTenants() {
    return azureTenantStore.isFetchingRelationship(this.tenantRelationshipId);
  }

  @computed
  public get isFetchingTenantsFailed() {
    return azureTenantStore.relationshipsFetchFailed(this.tenantRelationshipId);
  }

  @action
  public startTennatRemoval = (event: React.MouseEvent<HTMLElement>): void => {
    this.isTenantRemovalDialogVisible = true;
  };

  @action
  public cancelTenantRemoval = (): void => {
    this.isTenantRemovalDialogVisible = false;
  };

  public fetchSubscriptions(): void {
    this.subscriptionType === SubscriptionType.Organization
      ? azureSubscriptionStore.fetchForManyToMany(orgAzureSubscriptionAssociationStore, this.ownerName!, {
          ownerName: this.ownerName,
          ownerType: APP_OWNER_TYPES.ORG,
        })
      : azureSubscriptionStore.fetchForRelationship("userId", userStore.currentUser.id, {
          userId: userStore.currentUser.id,
          ownerType: APP_OWNER_TYPES.USER,
        });
  }

  public fetchTenants(): void {
    if (this.subscriptionType === SubscriptionType.Organization) {
      azureTenantStore.fetchForRelationship("organizationName", this.ownerName);
    }
  }

  public disconnectTenant = (tenant: AzureTenant) =>
    action((): void => {
      this.isTenantRemovalDialogVisible = false;

      const request = azureTenantStore.delete(tenant.tenantId!, false, { organizationName: this.ownerName });

      request
        .onSuccess(() => {
          notify({
            persistent: false,
            message: `‘${tenant.displayName}’ was successfully removed.`,
          });
        })
        .onFailure((error: FetchError | any) => {
          notify({
            persistent: false,
            message: ((status, body) => {
              switch (status) {
                case 400:
                  return (
                    (body && body.error && body.error.message) ||
                    t("management:aadTenantCard.badDataRemovingError", { tenantDisplayName: tenant.displayName })
                  );
                case 403:
                  return t("management:aadTenantCard.authorizationRemovingError", { tenantDisplayName: tenant.displayName });
                case 404:
                  return t("management:aadTenantCard.notFoundRemovingError", { tenantDisplayName: tenant.displayName });
                default:
                  return t("management:aadTenantCard.aadRemovingError", { tenantDisplayName: tenant.displayName });
              }
            })(error.status, error.body),
          });
        });
    });
}
