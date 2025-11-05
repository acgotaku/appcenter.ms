import { action, runInAction, computed } from "mobx";
import { DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore, ExternalDataState } from "@root/shared";
import { IApp, CollaboratorRole, RESPONSE_TYPES, NotificationType } from "@lib/common-interfaces";
import { FetchError } from "../../../../lib/http/fetch-error";
import { apiGateway } from "@root/lib/http";
import { API } from "../../../constants/api";
import { INotificationMessage, IAppUser } from "../../../constants/constants";
import { notify } from "@root/stores";
import { t } from "@root/lib/i18n";

export class UpdateCollaboratorRoleStore extends DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore<void> {
  constructor() {
    super();
    this.resetState();
  }

  @action
  public resetState(): void {
    this.state = undefined as any;
  }

  @computed
  public get notification(): INotificationMessage {
    const error: FetchError = this.error as FetchError;

    if (this.state === ExternalDataState.Failed) {
      return {
        type: NotificationType.Error,
        message: ((error) => {
          switch (error.status) {
            case 403:
              return "Oops. You can't update user roles for this app.";
            case 400:
              return "Something isn't right about how this role was updated.";
            case 404:
              return "User cannot be found. Refresh to update Collaborator list.";
            default:
              return "Something went wrong. Please try again.";
          }
        })(error),
      };
    } else {
      return undefined as any;
    }
  }

  @action
  public update(app: IApp, user: IAppUser, newRole: CollaboratorRole): void {
    const url = user.invitePending ? API.APP_INVITED_USER : API.APP_USER;

    this.state = ExternalDataState.Pending;

    apiGateway
      .patch(url, {
        params: {
          owner_name: app.owner?.name,
          app_name: app.name,
          user_email: user.email,
        },
        body: {
          permissions: [newRole],
        },
        responseType: RESPONSE_TYPES.TEXT,
      })
      .then(() => {
        runInAction(() => {
          user.permissions = [newRole];
          this.state = ExternalDataState.Loaded;
        });
      })
      .catch((error: FetchError) => {
        runInAction(() => {
          this.error = error;
          this.state = ExternalDataState.Failed;
          notify({
            persistent: true,
            message: t("management:appCollaborators.error.errorStaleUser"),
            action: () => window.location.reload(),
            buttonText: "Reload",
          });
        });
      });
  }
}
