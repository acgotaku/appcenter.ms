import { action, runInAction, computed } from "mobx";
import { apiGateway } from "@root/lib/http";
import { FetchError } from "../../../../lib/http/fetch-error";
import { API } from "../../../constants/api";
import { INotificationMessage } from "../../../constants/constants";
import { DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore, ExternalDataState } from "@root/shared";
import { NotificationType, RESPONSE_TYPES, IApp, OrganizationUserRole } from "@lib/common-interfaces";

export class InviteUserStore extends DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore<void> {
  constructor() {
    super();
    this.setState(undefined as any);
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
              return "Oops. We couldn't invite this user.";
            case 400:
              return "Something seems to be wrong with the email used to invite this user.";
            case 409:
              return "Oops. This user is already invited to this app.";
            case 403:
              return "Oops. You can't invite users to this app.";
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
  public invite(app: IApp, userEmail: string): Promise<void> {
    this.state = ExternalDataState.Pending;

    const options = {
      params: {
        owner_name: app.owner?.name,
        app_name: app.name,
        user_email: userEmail,
      },
      body: {
        role: OrganizationUserRole.Member,
      },
      responseType: RESPONSE_TYPES.TEXT,
    };

    return apiGateway
      .post<void>(API.APP_INVITED_USER, options)
      .then(() => {
        runInAction(() => {
          this.state = ExternalDataState.Loaded;
        });
      })
      .catch((error: any) => {
        runInAction(() => {
          this.state = ExternalDataState.Failed;
          this.error = error;
        });

        throw error;
      });
  }
}
