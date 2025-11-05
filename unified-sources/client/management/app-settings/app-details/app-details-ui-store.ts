import { NotificationType } from "@root/shared";
import { IApp } from "@lib/common-interfaces";
import { App } from "@root/data/shell/models/app";
import { appStore } from "@root/stores/app-store";
import { locationStore } from "@root/stores/location-store";
import { IMessageBarMessage } from "../../constants/constants";
import { FetchError } from "@root/lib/http/fetch-error";
import { t } from "@root/lib/i18n";
import { observable, computed, action, runInAction } from "mobx";
import { notifyScreenReader } from "@root/stores";
import { validateImage } from "@root/shared/utils/image-validator";
import { ResourceRequest } from "@root/data/lib";
import { updateAppIcon } from "@root/management/stores/apps/update-app-icon";
import { deleteAppIcon } from "@root/management/stores/apps/delete-app-icon";
import { ImageUploaderProps } from "@root/shared/image-uploader/image-uploader";

export class AppDetailsUIStore {
  @observable public appToUpdate!: App;
  @observable public lastRequest?: Pick<ResourceRequest<any, any>, "error" | "isFailed">;
  @observable public iconValidationMessageKey = "";
  @observable public updateAppIconRequest?: ReturnType<typeof updateAppIcon>;
  @observable public deleteAppIconRequest?: ReturnType<typeof deleteAppIcon>;

  @computed
  get updateNotification(): IMessageBarMessage {
    if (!appStore.updateFailed(this.appToUpdate)) {
      return undefined as any;
    }
    return {
      type: NotificationType.Error,
      message: ((error) => {
        switch (error.status) {
          case 404:
            return t("management:appDetails.errors.notFoundError");
          case 403:
            return t("management:appDetails.errors.unauthorizedError");
          default:
            return t("management:appDetails.errors.updateFailedError");
        }
      })(appStore.updateError(this.appToUpdate) as FetchError),
    };
  }

  @computed
  get isUpdating() {
    if (!this.appToUpdate) {
      return false;
    }
    return appStore.isUpdating(this.appToUpdate);
  }

  @computed
  public get isUploadingIcon() {
    return (this.updateAppIconRequest && this.updateAppIconRequest.isPending) || false;
  }

  @computed
  public get uploadProgress(): ImageUploaderProps["uploadProgress"] {
    return this.isUploadingIcon ? this.updateAppIconRequest!.progress || "indeterminate" : null;
  }

  @computed
  public get hasIconError() {
    return (this.lastRequest && this.lastRequest.isFailed) || false;
  }

  @computed
  public get iconErrorMessageKey() {
    if (this.lastRequest === this.updateAppIconRequest) {
      return "management:common.icon.uploadError";
    } else if (this.lastRequest === this.deleteAppIconRequest) {
      return "management:common.icon.deleteError";
    }
  }

  @action
  public updateApp(app: App, changes: Partial<IApp>) {
    this.appToUpdate = app;
    appStore.update(app, changes, false).onSuccess(() => {
      locationStore.goUp();
      notifyScreenReader({
        message: t("management:appDetails.detailsUpdatedAnnouncement", { appName: app.display_name }),
        delay: 500,
      });
    });
  }

  @action
  public updateIcon = (app: App, file: File) => {
    validateImage(file, { fileSize: { min: 0, max: 1023e3 } }, { width: { min: 0, max: 512 }, height: { min: 0, max: 512 } })
      .then((validations) => {
        runInAction(() => {
          if (validations.valid) {
            this.updateAppIconRequest = this.lastRequest = updateAppIcon(app, file);
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
          this.updateAppIconRequest = this.lastRequest = updateAppIcon(app, file);
          this.iconValidationMessageKey = "";
        })
      );
  };

  @action
  public deleteIcon = (app: App) => {
    this.iconValidationMessageKey = "";
    this.deleteAppIconRequest = this.lastRequest = deleteAppIcon(app);
  };
}
