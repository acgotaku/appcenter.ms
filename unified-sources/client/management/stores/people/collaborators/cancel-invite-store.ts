import { DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore, ExternalDataState } from "@root/shared";
import { RESPONSE_TYPES, NotificationType, IOrganization } from "@lib/common-interfaces";
import { action, runInAction, computed, observable } from "mobx";
import { locationStore } from "@root/stores";
import { apiGateway } from "@root/lib/http";
import { FetchError } from "../../../../lib/http/fetch-error";
import { API } from "../../../constants/api";
import { INotificationMessage, ICollaborator } from "../../../constants/constants";
import { getCollaboratorsStore } from "./collaborators-store";

export class CancelInviteStore extends DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore<void> {
  @observable public isCancelInviteWarningVisible: boolean = false;

  constructor() {
    super();
    this.resetState();
  }

  @action
  public resetState(): void {
    this.state = undefined as any;
  }

  @action
  public hideCancelInviteWarning(): void {
    this.isCancelInviteWarningVisible = false;
  }

  @action
  public showCancelInviteWarning(): void {
    this.isCancelInviteWarningVisible = true;
  }

  @computed
  get notification(): INotificationMessage {
    const error = this.error as FetchError;

    if (this.state === ExternalDataState.Failed) {
      return {
        type: NotificationType.Error,
        message: ((error) => {
          switch (error.status) {
            case 403:
              return "Oops. You can't revoke this invite.";
            case 404:
              return "Oops. We couldn't find any pending invitations for this user.";
            case 400:
              return "Something seems to be wrong with the email used to invite this user.";
            default:
              return "Something went wrong. Please try again.";
          }
        })(error),
      };
    } else {
      return null as any;
    }
  }

  @action
  public cancel(collaborator: ICollaborator, organization: IOrganization): void {
    const orgName = organization.name;
    const email = collaborator.email;
    const collaboratorsStore = getCollaboratorsStore(organization.name);

    this.state = ExternalDataState.Pending;
    this.error = undefined;

    apiGateway
      .post<void>(API.REVOKE_ORG_INVITATION, {
        params: {
          org_name: orgName,
          email,
        },
        responseType: RESPONSE_TYPES.TEXT,
      })
      .then(() => {
        runInAction(() => {
          collaboratorsStore.removeInvitedCollaborator(email!);
          this.state = ExternalDataState.Loaded;
          this.hideCancelInviteWarning();
          locationStore.goUp();
        });
        return null;
      })
      .catch((error) => {
        runInAction(() => {
          this.state = ExternalDataState.Failed;
          this.error = error;
          this.hideCancelInviteWarning();
        });
        throw error;
      });
  }
}
