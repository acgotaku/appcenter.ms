import { FileUploadStore, ICertUploadHandlerStore, ValidationState } from "@root/lib/file-upload-service";
import { IApp } from "@lib/common-interfaces";

import { ciStore } from "./ci-store";
import { observable, action, computed } from "mobx";
import { UploadStatus, ProgressBarStatus } from "@root/shared";
import { PLACEHOLDER_PROTECTED } from "@root/data/build";

import { t } from "@root/lib/i18n";
import { debounce } from "lodash";
import { apiGateway } from "@root/lib/http";

export class CertificateSecureFileUploadStore extends FileUploadStore implements ICertUploadHandlerStore {
  public readonly hasPasswordValidation = this.validationEnabled;
  private app?: IApp;
  private certPasswordRequired: boolean;
  @observable private certPassword?: string;
  @observable private certPasswordReadonly: boolean = false;
  @observable public passwordValidationState: ValidationState = ValidationState.Idle;
  @observable public showPasswordInput: boolean = !this.validationEnabled;

  constructor() {
    super();
    this.certPasswordRequired = true;
    this.app = ciStore.currentRepoStore && ciStore.currentRepoStore.app;
  }

  get validationEnabled(): boolean {
    return false;
  }

  get isValid(): boolean {
    return this.fileUploadIsValid && (!this.validationEnabled || this.passwordValidationState === ValidationState.Valid);
  }

  @computed
  get password(): string | undefined {
    if (this.certPasswordRequired) {
      // if password is required, it can't be undefined
      return this.certPassword || "";
    }
    return this.certPassword;
  }

  @computed
  get passwordReadonly(): boolean {
    return this.certPasswordReadonly;
  }

  @action
  public passwordChanged(value: string) {
    this.certPassword = value;
    // prevent checking if value received from backend
    if (this.validationEnabled) {
      if (value !== PLACEHOLDER_PROTECTED) {
        this.passwordValidationState = ValidationState.Validating;
        this.validatePassword();
      } else {
        this.showPasswordInput = true;
        this.passwordValidationState = ValidationState.Valid;
      }
    }
  }

  public validatePassword = debounce(
    action(() => {
      if (this.certPassword) {
        this.validateFilePassword(this.certPassword).then(
          action((validationState: ValidationState) => {
            this.passwordValidationState = validationState;
          })
        );
      }
    }),
    200
  );

  private validateFilePassword(password: string): Promise<ValidationState> {
    if (!this.app || !this.app.id || !this.app.owner) {
      return new Promise((resolve) => resolve(ValidationState.Invalid));
    }

    const path = `/v0.1/apps/${this.app.owner.name}/${this.app.name}/files/:fileId/validate`;
    return new Promise((resolve) =>
      apiGateway
        .post(path, {
          params: {
            appId: this.app!.id!,
            fileId: this.internalSecureFileId || "",
          },
          body: {
            p12password: password,
          },
          responseType: "text",
        })
        .then(() => resolve(ValidationState.Valid))
        .catch(() => resolve(ValidationState.Invalid))
    );
  }

  @action
  public onUploadSuccess() {
    if (this.validationEnabled && this.uploadStatus === UploadStatus.UploadSuccessful) {
      // set it back to progress
      this.progressBarStatus = ProgressBarStatus.Indeterminate;
      this.uploadStatus = UploadStatus.UploadStarted;
      // check empty password
      this.validateFilePassword("").then(
        action((validationState: ValidationState) => {
          if (validationState === ValidationState.Invalid) {
            this.showPasswordInput = true;
          } else {
            this.passwordValidationState = ValidationState.Valid;
          }
          this.progressBarStatus = ProgressBarStatus.Default;
          this.uploadStatus = UploadStatus.UploadSuccessful;
        })
      );
    }
  }

  @action
  public clear() {
    super.clear();
    this.certPassword = undefined;
    this.certPasswordReadonly = false;
    this.passwordValidationState = ValidationState.Idle;
  }

  @action
  public setInfoOnlyFilename(filename: string) {
    super.setInfoOnlyFilename(filename);

    this.certPasswordReadonly = true;
  }

  public validate(file: File): boolean {
    const extension = ".p12";
    if (!file.name.toLocaleLowerCase().endsWith(extension)) {
      this.errorMessage = t("build:file-upload-store.CertificateNotValid");
      return false;
    }
    return true;
  }

  get createAssetPath(): string {
    return this.app && this.app.owner ? `/v0.1/apps/${this.app.owner.name}/${this.app.name}/file_asset` : "";
  }
}
