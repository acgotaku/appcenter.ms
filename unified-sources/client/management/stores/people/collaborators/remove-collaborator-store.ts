import { ExternalDataState, DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore } from "@root/shared";
import { IOrganization, NotificationType, RESPONSE_TYPES } from "@lib/common-interfaces";
import { action, observable, runInAction, computed } from "mobx";
import { FetchError } from "../../../../lib/http/fetch-error";
import { appStore, locationStore, organizationStore } from "@root/stores";
import { apiGateway } from "@root/lib/http";
import { API } from "../../../constants/api";
import { INotificationMessage, OWNER_TYPE, ERROR_CODES, ICollaborator } from "../../../constants/constants";
import { getCollaboratorsStore } from "./collaborators-store";

export class RemoveCollaboratorStore extends DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore<void> {
  @observable public isRemoveConfirmationVisible: boolean = false;
  @observable public isRemoveAdminMessageVisible: boolean = false;

  constructor() {
    super();
    this.resetState();
  }

  @action
  public showConfirmationDialog(): void {
    this.isRemoveConfirmationVisible = true;
  }

  @action
  public hideConfirmationDialog(): void {
    this.isRemoveConfirmationVisible = false;
  }

  @action
  public showAdminMessageDialog(): void {
    this.isRemoveAdminMessageVisible = true;
  }

  @action
  public hideAdminMessageDialog(): void {
    this.isRemoveAdminMessageVisible = false;
  }

  @action
  public resetState(): void {
    this.state = undefined as any;
  }

  /**
   * Get the notification for the state of the store.
   */
  @computed
  get notification(): INotificationMessage {
    const error: FetchError = this.error as FetchError;

    if (this.state === ExternalDataState.Failed) {
      return {
        type: NotificationType.Error,
        message: ((error) => {
          switch (error.status) {
            case 403:
              return error.code === ERROR_CODES.LAST_ADMIN
                ? "Oops. You can't leave this organization. Please assign another collaborator as an Admin first. Alternatively, you may delete this organization."
                : "Oops. You can't remove collaborators for this organization.";
            case 400:
              return "Something isn't right about how this collaborator was removed.";
            case 404:
              return "Oops. We couldn't find this collaborator in the organization.";
            default:
              return "Something went wrong. Please try again.";
          }
        })(error),
      };
    } else {
      return undefined as any;
    }
  }

  /**
   * Show dialog for the given collaborator.
   */
  @action
  public showRemoveDialog(collaborator: ICollaborator, organization: IOrganization): void {
    const collaboratorsStore = getCollaboratorsStore(organization.name);
    if (collaboratorsStore.isAdmin(collaborator) && collaboratorsStore.onlyOneAdmin) {
      this.showAdminMessageDialog();
    } else {
      this.showConfirmationDialog();
    }
  }

  /**
   * Removes the collaborator from the given organization.
   */
  @action
  public remove(collaborator: ICollaborator, organization: IOrganization): void {
    this.deleteCollaborator(collaborator, organization).then(() => {
      if (this.state !== ExternalDataState.Failed) {
        locationStore.goUp();
      }
    });
  }

  /**
   * Handles the action of the user leaving the organization from their Settings page.
   *
   * Note that since the user is "leaving" the organization themself, we need to clean
   * all the client side stores that have any data associated with the given organization.
   */
  @action
  public leaveFromSettings(collaborator: ICollaborator, organization: IOrganization): void {
    this.deleteCollaborator(collaborator, organization).then(() => {
      if (this.state !== ExternalDataState.Failed) {
        runInAction(() => {
          this._purgeOrganizationData(organization);

          // Since we're leaving the organization from the Settings page,
          // just route to the same page.
          locationStore.router.push("/settings/organizations");
        });
      }
    });
  }

  /**
   * Handles the action of the user leaving the organization from their collaborator details page.
   *
   * Note that since the user is "leaving" the organization themself, we need to clean
   * all the client side stores that have any data associated with the given organization.
   */
  @action
  public leaveFromDetails(collaborator: ICollaborator, organization: IOrganization): void {
    this.deleteCollaborator(collaborator, organization).then(() => {
      if (this.state !== ExternalDataState.Failed) {
        runInAction(() => {
          this._purgeOrganizationData(organization);

          // Since we're leaving the organization from the details page, we shouldn't have access to that page anymore.
          // Hence, navigate to the apps list.
          locationStore.pushAppList();
        });
      }
    });
  }

  /**
   * Deletes the given collaborator from the given organization.
   */
  @action
  private deleteCollaborator(collaborator: ICollaborator, organization: IOrganization): Promise<void> {
    const collaboratorsStore = getCollaboratorsStore(organization.name);
    this.state = ExternalDataState.Pending;
    const updatePromise = this.orgUserRemove(organization, collaborator);

    return updatePromise
      .then(() => {
        runInAction(() => {
          this.state = ExternalDataState.Loaded;
          this.hideConfirmationDialog();
          collaboratorsStore.removeCollaborator(collaborator);
        });
        return updatePromise;
      })
      .catch((error: FetchError) => {
        runInAction(() => {
          this.hideConfirmationDialog();
          this.error = error;
          this.state = ExternalDataState.Failed;
        });
      });
  }

  /**
   * Call API for removing explicit user froom organization.
   * @private
   * @param {IOrganization} organization
   * @param {ICollaborator} collaborator
   */
  private orgUserRemove(organization: IOrganization, collaborator: ICollaborator) {
    return apiGateway.delete<void>(API.ORG_USER, {
      params: {
        org_name: organization.name,
        user_name: collaborator.name,
      },
      responseType: RESPONSE_TYPES.TEXT,
    });
  }

  /**
   * Purge all data related to the given organization from the client side stores.
   */
  @action
  private _purgeOrganizationData(organization: IOrganization): void {
    // Remove the organization from store.
    organizationStore.removeOrganization(organization);

    // Remove all apps that belong to this organization from the appStore.
    appStore.appsForOwner(OWNER_TYPE.ORGANIZATION, organization.name).forEach((app) => {
      appStore.removeApp(app);
    });
  }
}
