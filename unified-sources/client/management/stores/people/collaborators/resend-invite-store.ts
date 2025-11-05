import { DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore, ExternalDataState } from "@root/shared";
import { RESPONSE_TYPES, NotificationType, IOrganization } from "@lib/common-interfaces";
import { action, runInAction, computed } from "mobx";
import { apiGateway } from "@root/lib/http";
import { FetchError } from "../../../../lib/http/fetch-error";
import { API } from "../../../constants/api";
import { INotificationMessage, ICollaborator } from "../../../constants/constants";

export class ResendInviteStore extends DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore<void> {
  constructor() {
    super();
    this.resetState();
  }

  @action
  public resetState(): void {
    this.state = ExternalDataState.Idle;
  }

  @computed
  get notification(): INotificationMessage | undefined {
    const error = this.error as FetchError;

    if (this.state === ExternalDataState.Failed) {
      return {
        type: NotificationType.Error,
        message: ((error) => {
          switch (error.status) {
            case 403:
              return "Oops. You can't resend this invite.";
            case 404:
              return "Oops. We couldn't find any pending invitations for this user.";
            case 409:
              return "Oops. This user has already accepted this invitation.";
            case 400:
              return "Something seems to be wrong with the email used to invite this user.";
            default:
              return "Something went wrong. Please try again.";
          }
        })(error),
      };
    } else if (this.state === ExternalDataState.Loaded) {
      return {
        type: NotificationType.Success,
        message: "Invitation was resent successfully.",
      };
    } else {
      return undefined;
    }
  }

  @action
  public resend(collaborator: ICollaborator, organization: IOrganization): void {
    const orgName = organization.name;
    const email = collaborator.email || "";
    const role = collaborator.role;

    this.state = ExternalDataState.Pending;
    this.error = undefined;

    apiGateway
      .post<void>(API.RESEND_ORG_INVITATION, {
        params: {
          org_name: orgName,
          email,
        },
        body: {
          role,
        },
        responseType: RESPONSE_TYPES.TEXT,
      })
      .then(() => {
        runInAction(() => {
          // Do nothing since we're resending an invite.
          this.state = ExternalDataState.Loaded;
        });
        return null;
      })
      .catch((error) => {
        runInAction(() => {
          this.state = ExternalDataState.Failed;
          this.error = error;
        });
        throw error;
      });
  }
}
