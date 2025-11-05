import { action, computed, observable } from "mobx";
import { APP_OWNER_TYPES, Origin } from "@lib/common-interfaces";
import { userStore } from "@root/stores/user-store";
import { appStore } from "@root/stores/app-store";
import { AccountsManagementServiceApi, ApiCloseAccountOrganizationResponse } from "@root/api/clients/accounts-management-service/api";

export interface CloseAccountOrganization {
  organization: ApiCloseAccountOrganizationResponse;
  appsCount: number;
  collaboratorsCount: number;
  origin: Origin;
}

export interface CloseAccountUser {
  id: string;
  name: string;
  email: string;
  appsCount: number;
}

export class CloseAccountStore {
  @observable private closeAccountOrganizations: ApiCloseAccountOrganizationResponse[] = [];
  @observable private isLoadingOrganizations: boolean = false;

  @action
  closeAccount(): Promise<any> {
    return AccountsManagementServiceApi.closeAccountAccounts({}).then(() => {
      window.location.href = "/logout?closeAccount=true";
    });
  }

  @action
  public fetch(): Promise<any> {
    this.isLoadingOrganizations = true;
    return AccountsManagementServiceApi.listCloseAccountOrganizationsAccounts({}).then(
      action((organizations: ApiCloseAccountOrganizationResponse[]) => {
        this.closeAccountOrganizations = organizations;
        this.isLoadingOrganizations = false;
      })
    );
  }

  @computed
  public get isLoading(): boolean {
    return this.isLoadingOrganizations;
  }

  @computed
  public get organizations(): CloseAccountOrganization[] {
    // @ts-ignore. [Should fix it in the future] Strict error.
    return this.closeAccountOrganizations.map((organization) => {
      return {
        organization: organization,
        appsCount: appStore.appsForOwner(APP_OWNER_TYPES.ORG, organization.name).length,
        collaboratorsCount: organization.collaboratorsCount,
        origin: organization.origin,
      };
    });
  }

  @computed
  public get user(): CloseAccountUser {
    const currentUser = userStore.currentUser;
    return {
      email: currentUser.email,
      name: currentUser.display_name || currentUser.name,
      appsCount: appStore.appsForOwner(APP_OWNER_TYPES.USER, currentUser.name).length,
      id: currentUser.id!,
    };
  }
}
