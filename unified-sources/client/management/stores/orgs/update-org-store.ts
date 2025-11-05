import { DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore, ExternalDataState } from "@root/shared";
import { IOrganization, NotificationType } from "@lib/common-interfaces";
import { action, runInAction, computed, observable } from "mobx";
import { merge } from "lodash";
import { FetchError } from "../../../lib/http/fetch-error";
import { appStore, locationStore, organizationStore } from "@root/stores";
import { apiGateway } from "@root/lib/http";
import { API } from "../../constants/api";
import { OWNER_TYPE } from "../../constants/constants";
import { updateOrgIcon } from "@root/management/stores/orgs/update-org-icon";
import { ImageUploaderProps } from "@root/shared/image-uploader/image-uploader";
import { deleteOrgIcon } from "@root/management/stores/orgs/delete-org-icon";
import { validateImage } from "@root/shared/utils/image-validator";
import { ResourceRequest } from "@root/data/lib";
import { Organization } from "@root/data/shell/models/organization";

interface UpdateOrgForm {
  name: string;
  url: string;
}

export class UpdateOrgStore extends DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore<IOrganization> implements UpdateOrgForm {
  @observable public isWarningVisible: boolean = false;
  @observable public updateOrgIconRequest?: ReturnType<typeof updateOrgIcon>;
  @observable public name = this.organization.display_name!;
  @observable public url = this.organization.name;
  @observable public iconValidationMessageKey = "";
  @observable public deleteOrgIconRequest?: ReturnType<typeof deleteOrgIcon>;
  @observable public lastRequest?: Pick<ResourceRequest<any, any>, "error" | "isFailed">;

  constructor(private organization: IOrganization) {
    super();
    this.resetState();
  }

  @action
  public showUpdateWarning(): void {
    this.isWarningVisible = true;
  }

  @action
  public setFields(values: Partial<UpdateOrgForm>) {
    Object.assign(this, values);
    this.resetState();
  }

  @action
  public hideUpdateWarning(): void {
    this.isWarningVisible = false;
  }

  public updateOrgIcon(organization: IOrganization, file: File) {
    validateImage(file, { fileSize: { min: 0, max: 1023e3 } }, { width: { min: 0, max: 512 }, height: { min: 0, max: 512 } })
      .then((validations) => {
        runInAction(() => {
          if (validations.valid) {
            this.updateOrgIconRequest = this.lastRequest = updateOrgIcon(organization, file);
            this.iconValidationMessageKey = "";
          } else {
            if (validations.failures.some((failure) => failure.attribute === "fileSize")) {
              this.iconValidationMessageKey = "management:common.icon.fileSizeTooBigMessage";
            } else if (validations.failures.some((failure) => ["width", "height"].includes(failure.attribute))) {
              this.iconValidationMessageKey = "management:common.icon.dimensionsTooBigMessage";
            }
          }
        });
      })
      .catch(
        action(() => {
          this.updateOrgIconRequest = this.lastRequest = updateOrgIcon(organization, file);
          this.iconValidationMessageKey = "";
        })
      );
  }

  @action
  public deleteIcon(organization: IOrganization) {
    this.iconValidationMessageKey = "";
    this.deleteOrgIconRequest = this.lastRequest = deleteOrgIcon(organization);
  }

  @computed
  public get hasChanges() {
    return this.name !== this.organization.display_name || this.url !== this.organization.name;
  }

  @computed
  public get isUploadingIcon() {
    return (this.updateOrgIconRequest && this.updateOrgIconRequest.isPending) || false;
  }

  @computed
  public get hasIconError() {
    return (this.lastRequest && this.lastRequest.isFailed) || false;
  }

  @computed
  public get iconErrorMessageKey(): string | undefined {
    if (this.lastRequest === this.updateOrgIconRequest) {
      return "management:common.icon.uploadError";
    } else if (this.lastRequest === this.deleteOrgIconRequest) {
      return "management:common.icon.deleteError";
    }
  }

  @computed
  public get uploadProgress(): ImageUploaderProps["uploadProgress"] {
    return this.isUploadingIcon ? this.updateOrgIconRequest!.progress || "indeterminate" : null;
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
          message: ((error) => {
            if (this.state === ExternalDataState.Failed) {
              switch (error.status) {
                case 409:
                  return null; // Handled in `conflictError()`
                case 404:
                  return "Oops. We couldn't find this organization.";
                case 400:
                  return "Something seems to be wrong with the data used to update this organization.";
                case 403:
                  return "Oops. You can't update this organization.";
                default:
                  return "Something went wrong. Please try again.";
              }
            } else {
              return null;
            }
          })(error)!,
        };
      case ExternalDataState.Loaded:
        return {
          type: NotificationType.Success,
          message: "Sweet! Your organization was updated successfully.",
        };
      default:
        return null as any;
    }
  }

  @computed
  get conflictError(): string | undefined {
    const error = this.error as FetchError;

    if (this.state !== ExternalDataState.Failed) {
      return undefined;
    }

    if (error.status === 409) {
      return "URL is taken.";
    } else {
      return undefined;
    }
  }

  /**
   * Updates the given organization.
   */
  @action
  public update(oldValue: Organization, newValue: IOrganization): void {
    const oldOrgName = oldValue.name;

    this.setState(ExternalDataState.Pending);
    apiGateway
      .patch<IOrganization>(API.USER_ORGANIZATION, {
        body: newValue,
        params: {
          org_name: oldOrgName,
          include: ["collaborators_count", "collaborator_role"],
        },
      })
      .then((newOrganization) => {
        console.log(`Updated Org:`, newOrganization);
        runInAction(() => {
          this.setState(ExternalDataState.Loaded);
          // Update the organization in the store.
          organizationStore.updateOrganization(oldValue, newOrganization);

          // Update all the apps that are owned by the old organization to the new organization.
          appStore.appsForOwner(OWNER_TYPE.ORGANIZATION, oldOrgName).forEach((app) => {
            const newApp = merge({}, app, {
              owner: {
                display_name: newOrganization.display_name,
                name: newOrganization.name,
              },
            });
            appStore.updateAppInAppsList(app, newApp);
          });

          // Update the url by navigating using the new organization name.
          locationStore.router.push(`/orgs/${newOrganization.name}/manage/settings`);
        });
        return newOrganization;
      })
      .catch((error: FetchError) => {
        runInAction(() => {
          console.warn(`Updating organization ${oldValue.name} failed.`);
          this.setState(ExternalDataState.Failed);
          this.error = error;
        });
      });
  }

  /**
   * Resets the state back to loaded.
   */
  @action
  public resetState(): void {
    this.state = undefined as any;
  }
}
