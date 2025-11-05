import { DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore, ExternalDataState } from "@root/shared";
import { RESPONSE_TYPES, NotificationType, OrganizationUserRole } from "@lib/common-interfaces";
import { action, runInAction, computed } from "mobx";
import { apiGateway } from "@root/lib/http";
import { FetchError } from "../../../../lib/http/fetch-error";
import { API } from "../../../constants/api";
import { INotificationMessage } from "../../../constants/constants";
import { getCollaboratorsStore } from "./collaborators-store";

export class InviteCollaboratorStore extends DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore<void> {
  // Note: this is a duplicate value from "core-services/accounts-management-service/config/default.json"
  private readonly MAX_MEMBERS_PER_ORG = 5000;

  constructor(private organizationName: string) {
    super();
    this.resetState();
  }

  @action
  public resetState(): void {
    this.state = undefined as any;
  }

  @computed
  get notification(): INotificationMessage {
    const error = this.error as FetchError;

    if (this.state === ExternalDataState.Failed) {
      return {
        type: NotificationType.Error,
        message: ((error) => {
          switch (error.status) {
            case 404:
              return "Oops. We couldn't find this organization.";
            case 400:
              return error.message ?? "Something seems to be wrong with the email used to invite this user.";
            case 409:
              return "Oops. This user is already invited to the organization.";
            default:
              return "Something went wrong. Please try again.";
          }
        })(error),
      };
    } else if (this.state === ExternalDataState.Loaded) {
      const collaboratorsStore = getCollaboratorsStore(this.organizationName);
      if (
        collaboratorsStore.collaborators.length > this.MAX_MEMBERS_PER_ORG &&
        collaboratorsStore.collaborators.some((collaborator) => collaborator.invitePending)
      ) {
        return {
          type: NotificationType.Warning,
          message: `Maximum organization member amount is ${this.MAX_MEMBERS_PER_ORG}, please note that not all invitees can successfully accept the invitation.`,
        };
      }
    }
    return null as any;
  }

  @action
  public invite(email: string): void {
    const collaboratorsStore = getCollaboratorsStore(this.organizationName);
    this.state = ExternalDataState.Pending;
    this.error = undefined;

    const body = {
      user_email: email,
      role: OrganizationUserRole.Member as OrganizationUserRole,
    };

    apiGateway
      .post<void>(API.ORG_INVITATIONS, {
        params: {
          org_name: this.organizationName,
        },
        body,
        responseType: RESPONSE_TYPES.TEXT,
      })
      .then(() => {
        runInAction(() => {
          collaboratorsStore.addInvitedCollaborator(email, body.role);
          this.state = ExternalDataState.Loaded;
        });
        return null;
      })
      .catch((error) => {
        runInAction(() => {
          this.state = ExternalDataState.Failed;
          this.error = error;
        });
      });
  }
}
