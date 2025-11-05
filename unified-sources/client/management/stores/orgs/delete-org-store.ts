import { DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore, ExternalDataState } from "@root/shared";
import { IOrganization, NotificationType, RESPONSE_TYPES } from "@lib/common-interfaces";
import { action, runInAction, computed, observable } from "mobx";
import { FetchError } from "../../../lib/http/fetch-error";
import { appStore, locationStore, organizationStore } from "@root/stores";
import { apiGateway } from "@root/lib/http";
import { API } from "../../constants/api";
import { OWNER_TYPE } from "../../constants/constants";

export class DeleteOrgStore extends DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore<void> {
  @observable public isDeleteWarningVisible: boolean = false;

  constructor() {
    super();
    this.resetState();
  }

  @action
  public hideDeleteWarning(): void {
    this.isDeleteWarningVisible = false;
  }

  @action
  public showDeleteWarning(): void {
    this.isDeleteWarningVisible = true;
  }

  /**
   * Get the notification from the store's state and error (if it exists).
   */
  @computed
  get notification(): { message: string; type: NotificationType } {
    const error = this.error as FetchError;

    switch (this.state) {
      case ExternalDataState.Failed:
        return {
          type: NotificationType.Error,
          // @ts-ignore. [Should fix it in the future] Strict error.
          message: ((error) => {
            if (this.state === ExternalDataState.Failed) {
              switch (error.status) {
                case 404:
                  return "Oops. We couldn't find this organization.";
                case 400:
                  return "Something seems to be wrong with the data used to remove this organization.";
                case 403:
                  return "Oops. You can't remove this organization.";
                default:
                  return "Something went wrong. Please try again.";
              }
            } else {
              return null;
            }
          })(error),
        };
      default:
        return null as any;
    }
  }

  /**
   * Deletes the given organization.
   */
  @action
  public delete(organization: IOrganization): void {
    this.state = ExternalDataState.Pending;

    apiGateway
      .delete<void>(API.USER_ORGANIZATION, {
        params: {
          org_name: organization.name,
        },
        responseType: RESPONSE_TYPES.TEXT,
      })
      .then(() => {
        console.log(`Removed Org:`, organization);
        runInAction(() => {
          this.state = ExternalDataState.Loaded;
          this.hideDeleteWarning();

          // Remove the organization from the store.
          organizationStore.removeOrganization(organization);

          // Remove all the apps that are owned by the given organization.
          appStore.appsForOwner(OWNER_TYPE.ORGANIZATION, organization.name).forEach((app) => {
            appStore.removeApp(app);
          });

          // Update the url by navigating to the apps list.
          locationStore.pushAppList();
        });
        return null;
      })
      .catch((error: FetchError) => {
        console.warn(`Removing organization ${organization.name} failed.`);
        runInAction(() => {
          this.hideDeleteWarning();
          this.error = error;
          this.state = ExternalDataState.Failed;
        });
        throw error;
      });
  }

  /**
   *
   * Resets the state back to loaded.
   */
  @action
  public resetState(): void {
    this.state = undefined as any;
  }
}
