import { DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore, ExternalDataState } from "@root/shared";
import { IApp, NotificationType } from "@lib/common-interfaces";
import { action, computed, runInAction } from "mobx";
import { locationStore, appStore } from "@root/stores";
import { apiGateway } from "@root/lib/http";
import { FetchError } from "../../../lib/http/fetch-error";
import { API } from "../../constants/api";
import { INotificationMessage } from "../../constants/constants";
import { pick } from "lodash";

export class MigrateAppStore extends DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore<IApp> {
  constructor() {
    super();
    this.resetState();
  }

  @action
  public resetState(): void {
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
            case 403:
              return "Oops. You're not allowed to update this app.";
            case 400:
              return "Something isn't right about the data used to migrate this app.";
            default:
              return "Something went wrong. Please try again.";
          }
        })(error),
      };
    } else {
      return null as any;
    }
  }

  public migrateApp(app: IApp, updatedAttributes: Partial<IApp>): Promise<void> {
    return this.loadVoid(
      apiGateway
        .patch<IApp>(API.USER_APP, {
          body: pick(updatedAttributes, "os", "platform"),
          params: {
            owner_name: app.owner?.name,
            app_name: app.name,
          },
        })
        .then((response: IApp) => {
          console.log("Updated App ", response);
          runInAction(() => {
            appStore.updateAppInAppsList(app, response);
            locationStore.pushWithApp("/", app);
          });
          return response;
        })
        .catch(function (error: any) {
          console.log("Parsing failed", error);
          throw error;
        })
    );
  }
}
