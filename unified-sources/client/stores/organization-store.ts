import { observable, action, computed, ObservableMap, set } from "mobx";
import { remove, sortBy } from "lodash";
import { IOrganization, OrganizationUserRole } from "@lib/common-interfaces/organization";
import { Organization } from "@root/data/shell/models/organization";
import { API } from "@root/data/management/constants";
import { ResourceRequest } from "@root/data/lib";
import { apiGateway } from "@root/lib/http";
import { CategoryName } from "@lib/common-interfaces";

/**
 * Store which maintains the list of organizations for the current user.
 */
export class OrganizationStore {
  @observable private _organizations: Organization[];
  private readonly fetchOrgRequests = new ObservableMap<string, ResourceRequest<IOrganization>>({});
  private _sorty = (organization: Organization) =>
    (organization.display_name ? organization.display_name : organization.name).toLowerCase();

  constructor(organizations: IOrganization[]) {
    const orgModels = organizations.map((o) => new Organization(o));
    this._organizations = sortBy(orgModels, this._sorty);
  }

  /**
   * Returns the list of organizations in the store.
   */
  get organizations(): IOrganization[] {
    return this._organizations;
  }

  get whitelistedOrganizations(): IOrganization[] {
    return this._organizations.filter(
      (o) =>
        !!o.organization_category && [CategoryName.FirstParty, CategoryName.ThirdParty].includes(o.organization_category.category_name)
    );
  }

  get firstPartyOrganizations(): Organization[] {
    return this._organizations.filter(
      (o) => !!o.organization_category && o.organization_category.category_name === CategoryName.FirstParty
    );
  }

  @computed
  get organizationsWithCurrentUserAsAdmin(): IOrganization[] {
    return this._organizations.filter((o) => this.isCurrentUserAnAdmin(o));
  }

  @computed
  get isCurrentUserAdminOnSomeOrganizations(): boolean {
    return this.organizationsWithCurrentUserAsAdmin.length > 0;
  }

  /**
   * Returns true if there is atleast 1 organization in the store.
   */
  @computed
  get hasOrganizations(): boolean {
    return this._organizations && this._organizations.length > 0;
  }

  /**
   * Returns the url for home page (landing page) for the given organization.
   */
  public homePageUrl(organization: IOrganization): string | undefined {
    return organization ? `/orgs/${organization.name}` : undefined;
  }

  /**
   * Add the given organization to the store.
   */
  @action
  public addOrganization(organization: IOrganization | null): void {
    if (!organization) {
      return;
    }

    this._organizations.push(new Organization(organization));

    // Sort it
    this._organizations = sortBy(this._organizations, this._sorty);
  }

  /**
   * Remove the given organization from the store.
   */
  @action
  public removeOrganization(organization: IOrganization): void {
    if (!this.hasOrganizations || !organization) {
      return;
    }

    remove(this._organizations, (o) => {
      return o.name === organization.name;
    });
  }

  /**
   * Updates the given organization with the new value.
   */
  @action
  public updateOrganization(oldOrganization: Organization, newOrganization: Partial<IOrganization>): void {
    if (!this.hasOrganizations || !oldOrganization || !newOrganization || !this._organizations.includes(oldOrganization)) {
      return;
    }

    set(oldOrganization, newOrganization);

    // Sort it
    this._organizations = sortBy(this._organizations, this._sorty);
  }

  /**
   * Find an organization with the given name.
   */
  public find(name: string | undefined, { caseSensitive = false } = {}): Organization | undefined {
    if (!this.hasOrganizations || !name) {
      return;
    }

    let predicate = (org) => org.name === name;
    if (!caseSensitive) {
      predicate = (org) => org.name.toLowerCase() === name.toLowerCase();
    }

    return this._organizations.find(predicate);
  }

  public findOrgById(id: string): Organization | undefined {
    return this._organizations.find((org) => org.id === id);
  }

  /**
   * Since we don't have an organizationStore that actually is a "data-layer" store,
   * this method is using `ResourceRequest` directly. This will be removed
   * when `organizationStore` moves to be a "data-layer" store.
   */
  @action
  public fetchOrganization(name: string) {
    const request = new ResourceRequest(
      apiGateway.get<IOrganization>(API.USER_ORGANIZATION, {
        params: {
          org_name: name,
          include: ["collaborators_count", "collaborator_role"],
        },
      }),
      () => this.find(name)!,
      (error, data) => {
        if (error || this.find(data?.name)) {
          return;
        }
        this.addOrganization(data);
      }
    );
    // @ts-ignore. [Should fix it in the future] Type 'IOrganization' is not assignable to type 'Organization'.
    this.fetchOrgRequests.set(name, request);
    return request;
  }

  public fetchOrganizationError(name: string) {
    const request = this.fetchOrgRequests.get(name);
    return request && request.error;
  }

  public isCurrentUserAnAdminOfFirstPartyOrg(): boolean {
    return this.firstPartyOrganizations.some((org) => this.isCurrentUserAnAdmin(org));
  }

  public isCurrentUserAnAdmin(organization: IOrganization | undefined): boolean {
    if (!organization) {
      return false;
    }
    return organization.collaborator_role === OrganizationUserRole.Admin;
  }

  public isCurrentUserANonAdminOrgUser(organization: IOrganization): boolean {
    if (!organization) {
      return false;
    }
    return (
      organization.collaborator_role === OrganizationUserRole.Collaborator ||
      organization.collaborator_role === OrganizationUserRole.Member
    );
  }

  public IsCurrentUserInRole(organization: IOrganization, role: OrganizationUserRole) {
    if (!organization) {
      return false;
    }

    return organization.collaborator_role === role;
  }
}

export const organizationStore = new OrganizationStore((((window as any) || {}).initProps || {}).orgs || []);
