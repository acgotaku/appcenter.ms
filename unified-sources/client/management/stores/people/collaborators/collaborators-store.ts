import { ResourceCollectionStore } from "@root/shared";
import { action, computed, runInAction, observable } from "mobx";
import { sortBy, remove, find, flatten, noop } from "lodash";
import * as memoize from "memoizee";
import { userStore, organizationStore } from "@root/stores";
import { apiGateway } from "@root/lib/http";
import { API } from "../../../constants/api";
import { ICollaborator } from "../../../constants/constants";
import { SerializedAzureTenant } from "../../../../data/management/models/azure-tenant";
import { OrganizationUserRole } from "@lib/common-interfaces";

export class CollaboratorsStore extends ResourceCollectionStore<ICollaborator> {
  private _sorty = (collaborator: ICollaborator) => collaborator.display_name?.toLowerCase();
  @observable private _currentCollaborator;
  protected getResourceId(collaborator): string {
    return collaborator.name;
  }

  constructor(private organizationName: string) {
    super();
  }

  @computed
  public get collaborators(): ICollaborator[] {
    let allCollborators = this.resourceArray;
    if (allCollborators.length > 0) {
      // Remove the current user's entry from the data
      const currentUserCollaborator = remove(allCollborators, (c) => c.name === userStore.currentUser.name)[0];
      const azureTenant = remove(allCollborators, (c) => c.isTenant)[0];

      // Sort all things
      allCollborators = sortBy(allCollborators, this._sorty);
      // Put the current user at the top of the list
      if (currentUserCollaborator) {
        allCollborators.unshift(currentUserCollaborator);
      }

      if (azureTenant) {
        allCollborators.unshift(azureTenant);
      }
    }

    return allCollborators;
  }

  @computed
  public get acceptedCollaborators(): ICollaborator[] {
    return this.collaborators.filter((collaborator) => !collaborator.invitePending);
  }

  @computed
  get onlyOneAdmin(): boolean {
    let count = 0;

    return !this.collaborators.some((c) => {
      const isAdmin = this.isAdmin(c);
      if (isAdmin && count === 1) {
        return true;
      }

      if (isAdmin) {
        count++;
      }

      return false;
    });
  }

  /**
   * Fetches collaborators and currently logged collaborator.
   */
  public fetch(): void {
    this.fetchCollborators();
  }

  /**
   * Fetches colaborators for the given organization name.
   */
  @action
  public fetchCollborators(): void {
    this.loadArray(Promise.all<ICollaborator[]>(this.fetchAllCollaborators(this.organizationName)).then((cs) => flatten(cs)));
  }

  /**
   * Gets currently logged collaborator.
   */
  public get currentCollaborator(): ICollaborator {
    return this._currentCollaborator;
  }

  /**
   * Fetches currently logged collaborator using user name and organization name.
   */
  public fetchCurrentCollaborator(): void {
    this.fetchOrganizationUserByUserName(this.organizationName, userStore.currentUser.name)
      .then((collaborator) => {
        runInAction(() => {
          this._currentCollaborator = collaborator;
        });
      })
      .catch(noop);
  }

  /**
   * Fetches all collaborators.
   */
  private fetchAllCollaborators(orgName: string): Promise<ICollaborator[]>[] {
    const aadCollaborators = this.fetchAzureTenant(orgName);
    return [this.fetchInvitedCollaborators(orgName), this.fetchCollaborators(orgName), aadCollaborators];
  }

  /**
   * Fetches admins for the given organization name.
   */
  @action
  public fetchAdmins(): Promise<ICollaborator[]> {
    return this.fetchCollaborators(this.organizationName).then((collaborators) => {
      return collaborators.filter((collaborator) => collaborator.role === OrganizationUserRole.Admin);
    });
  }

  /**
   * Finds a collaborator in the current list of collaborators using the given username.
   */
  public findCollaboratorByName(username: string): ICollaborator {
    if (!this.collaborators || !username) {
      return undefined as any;
    }

    return this.get(username)!;
  }

  /**
   * Returns the collaborator if already present in the list of invited collaborators.
   */
  public findCollaboratorByEmail(email: string): ICollaborator {
    if (!this.collaborators || !email) {
      return undefined as any;
    }

    return this.collaborators.find((c) => {
      return c.email === email;
    })!;
  }

  /**
   * Adds the collaborator to the list of collaborators
   */
  @action
  public addCollaborator(collaborator: ICollaborator): void {
    if (!this.collaborators || !collaborator) {
      return;
    }

    this.add(collaborator);
  }

  /**
   * Removes a collaborator from the list of collaborators.
   */
  @action
  public removeCollaborator(collaborator: ICollaborator): void {
    if (!this.collaborators || !collaborator) {
      return;
    }

    this.remove(collaborator);
  }

  /**
   * Adds a collaborator who was invited to the list of collaborators using their email.
   * This function inserts a `ICollaborator` object to the list using the given email.
   */
  @action
  public addInvitedCollaborator(email: string, role: OrganizationUserRole): void {
    if (!email) {
      return;
    }

    this.addCollaborator(this.invitedCollaborator(email, role));
  }

  /**
   * Removes a collaborator who was invited to the list of collaborators using their email.
   * This function creates a `ICollaborator` object using the given email and removes the collaborator
   * if there is a match.
   */
  @action
  public removeInvitedCollaborator(email: string): void {
    if (!email) {
      return;
    }

    this.removeCollaborator(this.invitedCollaborator(email));
  }

  /**
   * Returns true if the given collaborator's role is admin.
   */
  public isAdmin(collaborator: ICollaborator): boolean {
    if (!collaborator) {
      return false;
    }

    return collaborator.role === OrganizationUserRole.Admin;
  }

  /**
   * Returns true if the given collaborator's role is collaborator.
   */
  public isCollaborator(collaborator: ICollaborator): boolean {
    if (!collaborator) {
      return false;
    }

    return collaborator.role === OrganizationUserRole.Collaborator;
  }

  /**
   * Returns true if the given collaborator's role is member.
   */
  public isMember(collaborator: ICollaborator): boolean {
    if (!collaborator) {
      return false;
    }

    return collaborator.role === OrganizationUserRole.Member;
  }

  /**
   * Gets a collaborator object for an invited user's email.
   */
  public invitedCollaborator(email: string, role?: OrganizationUserRole): ICollaborator {
    return {
      email: email,
      role,
      id: undefined,
      display_name: email,
      name: email,
      invitePending: true,
    };
  }

  @action
  private fetchInvitedCollaborators(orgName: string): Promise<ICollaborator[]> {
    return apiGateway
      .get<ICollaborator[]>(API.ORG_INVITATIONS, {
        params: {
          org_name: orgName,
        },
      })
      .then((invitees) => {
        return invitees.map((i) => {
          const email = i.email;

          // Create a invitee from the email provided.
          const invitee: ICollaborator = {
            email: email,
            role: i.role,
            id: undefined,
            display_name: email,
            name: email,
            invitePending: true,
          };

          return invitee;
        });
      })
      .catch(() => {
        return [];
      });
  }

  @action
  private fetchCollaborators(orgName: string): Promise<ICollaborator[]> {
    return apiGateway
      .get<ICollaborator[]>(API.ORG_USERS, {
        params: {
          org_name: orgName,
        },
      })
      .then((collaborators) => {
        runInAction(() => {
          // Find the current user's entry from the data
          const currentUserCollaborator = find(collaborators, (c) => c.name === userStore.currentUser.name);

          // Update the current user's role & the nav items for the Organization if the role has changed.
          const organization = organizationStore.find(orgName);
          if (organization && currentUserCollaborator && currentUserCollaborator.role !== organization.collaborator_role) {
            organization.collaborator_role = currentUserCollaborator.role;
          }
        });
        return collaborators;
      })
      .catch(() => {
        return [];
      });
  }

  @action
  private fetchAzureTenant(orgName: string): Promise<ICollaborator[]> {
    return apiGateway
      .get<SerializedAzureTenant>(API.ORG_AZURE_TENANT, {
        params: {
          org_name: orgName,
        },
      })
      .then((tenant) => {
        return [
          {
            display_name: tenant.display_name,
            name: tenant.display_name,
            role: "collaborator",
            id: tenant.aad_tenant_id,
            isTenant: true,
          } as ICollaborator,
        ];
      })
      .catch(() => {
        return [];
      });
  }

  @action
  public fetchOrganizationUserByUserName(orgName: string, userName: string): Promise<ICollaborator> {
    return apiGateway
      .get<ICollaborator>(API.ORG_USER, {
        params: {
          org_name: orgName,
          user_name: userName,
        },
      })
      .then((collaborator) => {
        return collaborator;
      });
  }
}

export const getCollaboratorsStore = memoize((organizationName: string) => new CollaboratorsStore(organizationName), { max: 10 });
