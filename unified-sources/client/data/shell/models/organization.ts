import { computed, observable, action } from "mobx";
import { IOrganization, Origin, OrganizationUserRole, ICategory, CategoryName } from "@lib/common-interfaces";
import { Model, ResourceRequest } from "../../lib";
import { orgAzureSubscriptionAssociationStore } from "../../management/stores/org-azure-subscription-association-store";
import { azureSubscriptionStore } from "../../management/stores/azure-subscription-store";
import { azureTenantStore } from "../../management/stores/azure-tenant-store";
import { AzureSubscription } from "../../management/models/azure-subscription";
import { AzureTenant, SerializedAzureTenant } from "../../management/models/azure-tenant";

export class Organization extends Model<IOrganization> implements IOrganization {
  // Hack for making IOrganization assignable to IAppOwner
  // which lets App#owner be assignable to IApp['owner']
  public type = "org";

  @observable public id?: string;
  @observable public name!: string; // Hack for making IOrganization assignable to IAppOwner
  @observable public display_name!: string; // Hack for making IOrganization assignable to IAppOwner
  @observable public avatar_url?: string;
  @observable public description?: string;
  @observable public email!: string; // Hack for making IOrganization assignable to IAppOwner
  @observable public collaborators_count?: number;
  @observable public collaborator_role?: OrganizationUserRole;
  @observable public origin?: Origin;
  @observable public created_at?: string;
  @observable public organization_category?: ICategory;

  constructor(organization?: IOrganization) {
    super(organization || {});
  }

  @computed
  get azureSubscriptions(): AzureSubscription[] {
    return azureSubscriptionStore.relatedTo(this.name, orgAzureSubscriptionAssociationStore);
  }

  @computed
  get azureTenant(): AzureTenant {
    return azureTenantStore.resources.filter((tenant) => tenant.organizationName === this.name)[0];
  }

  @computed
  get isOrgWhitelisted(): boolean {
    return (
      !!this.organization_category &&
      [CategoryName.FirstParty, CategoryName.ThirdParty].includes(this.organization_category.category_name)
    );
  }

  @computed
  get isOrgFirstParty(): boolean {
    return !!this.organization_category && this.organization_category.category_name === CategoryName.FirstParty;
  }

  @action
  public setUserRole(role: OrganizationUserRole) {
    this.collaborator_role = role;
  }

  public fetchAzureTenant(): ResourceRequest<AzureTenant[], SerializedAzureTenant[]> {
    return azureTenantStore.fetchForRelationship("organizationName", this.name);
  }
}
