import { action, runInAction, computed } from "mobx";
import { apiGateway } from "@root/lib/http";
import { FetchError } from "../../../../lib/http/fetch-error";
import { API } from "../../../constants/api";
import { IAppUser } from "../../../constants/constants";
import { INotificationMessage } from "../../../constants/constants";
import { DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore, ExternalDataState } from "@root/shared";
import { NotificationType, RESPONSE_TYPES, IApp } from "@lib/common-interfaces";

export class RemoveUserStore extends DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore<void> {
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
              return "Oops. This user is already removed from this app.";
            case 400:
              return "Something seems to be wrong with the email used to remove this user.";
            case 403:
              return "Oops. You can't remove users from this app.";
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
  public remove(user: IAppUser, app: IApp): Promise<void> {
    this.state = ExternalDataState.Pending;

    const removeUrl = user.invitePending ? API.APP_INVITED_USER : API.APP_USER;

    return apiGateway
      .delete<void>(removeUrl, {
        params: {
          owner_name: app.owner?.name,
          app_name: app.name,
          user_email: user.email,
        },
        responseType: RESPONSE_TYPES.TEXT,
      })
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
      });
  }

  @action
  public deleteTesterDestinations(user: IAppUser, app: IApp): Promise<void> {
    this.state = ExternalDataState.Pending;
    const deleteTesterDestinationsUrl = API.REMOVE_APP_TESTER_FROM_DESTINATIONS;
    return apiGateway
      .delete<void>(deleteTesterDestinationsUrl, {
        params: {
          owner_name: app.owner?.name,
          app_name: app.name,
          userId: user.id,
        },
        responseType: RESPONSE_TYPES.TEXT,
      })
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
      });
  }
}
