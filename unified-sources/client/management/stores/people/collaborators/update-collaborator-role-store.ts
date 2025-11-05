import { action, observable, runInAction, computed } from "mobx";
import { ExternalDataState, DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore } from "@root/shared";
import { NotificationType, IOrganization, RESPONSE_TYPES, OrganizationUserRole } from "@lib/common-interfaces";
import { FetchError } from "../../../../lib/http/fetch-error";
import { userStore } from "@root/stores";
import { apiGateway } from "@root/lib/http";
import { API } from "../../../constants/api";
import { INotificationMessage, ERROR_CODES, ICollaborator } from "../../../constants/constants";
import { getCollaboratorsStore } from "./collaborators-store";

export class UpdateCollaboratorRoleStore extends DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore<void> {
  // TODO: Implement loadDataXXX() functions for correct use of ExternalDataStore.
  @observable public isAdminResignWarningVisible: boolean = false;

  constructor() {
    super();
    this.resetState();
  }

  @action
  public showAdminResignWarning(): void {
    this.isAdminResignWarningVisible = true;
  }

  @action
  public hideAdminResignWarning(): void {
    this.isAdminResignWarningVisible = false;
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
                ? "Oops. You can't resign the administration of this organization. Please assign another collaborator as an Admin first. Alternatively, you may delete this organization."
                : "Oops. You can't update roles for this organization.";
            case 400:
              return "Something isn't right about how this role was updated.";
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
   * Update the role that is in the organization invite since the user has not accepted yet
   */
  @action
  public updatePendingInvite(collaborator: ICollaborator, role: ICollaborator["role"], organization: IOrganization): void {
    if (collaborator.role === role) {
      return;
    }

    this.state = ExternalDataState.Pending;

    apiGateway
      .patch<ICollaborator>(API.ORG_INVITATIONS_ROLE_UPDATE, {
        params: {
          org_name: organization.name,
          email: collaborator.email,
        },
        body: {
          role: role,
        },
        responseType: RESPONSE_TYPES.TEXT,
      })
      .then((data) => {
        runInAction(() => {
          this.state = ExternalDataState.Loaded;
          collaborator.role = role;
        });

        return null;
      })
      .catch((error) => {
        runInAction(() => {
          this.error = error;
          this.state = ExternalDataState.Failed;
        });
      });
  }

  /**
   * Update the role of the given collaborator in the given organization.
   */
  @action
  public update(collaborator: ICollaborator, role: OrganizationUserRole, organization: IOrganization): void {
    const collaboratorsStore = getCollaboratorsStore(organization.name);
    if (collaboratorsStore.isAdmin(collaborator) && collaboratorsStore.onlyOneAdmin) {
      this.showAdminResignWarning();
      return;
    }

    const updatingCurrentUser = collaborator.name === userStore.currentUser.name;
    this.state = ExternalDataState.Pending;
    const updatePromise = this.orgUserUpdate(organization, collaborator, role);

    updatePromise
      .then(() => {
        runInAction(() => {
          this.state = ExternalDataState.Loaded;
          collaborator.role = role;

          // If the aad group is updating role, update their role on the organization object &
          // remove the "Manage" link if necessary.
          if (updatingCurrentUser) {
            organization.collaborator_role = role;
          }
        });
        return null;
      })
      .catch((error) => {
        runInAction(() => {
          this.error = error;
          this.state = ExternalDataState.Failed;
        });
      });
  }

  private orgUserUpdate(organization: IOrganization, collaborator: ICollaborator, role: OrganizationUserRole) {
    return apiGateway.patch<ICollaborator>(API.ORG_USER, {
      params: {
        org_name: organization.name,
        user_name: collaborator.name,
      },
      body: {
        role: role,
      },
    });
  }
}
