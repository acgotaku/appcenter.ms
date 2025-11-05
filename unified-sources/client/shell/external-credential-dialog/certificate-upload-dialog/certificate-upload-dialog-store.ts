import { observable, action, computed } from "mobx";
import { externalCredentialStore } from "@root/data/shell/stores/external-credentials-store";
import { ExternalCredential } from "@root/data/shell/models/external-credential";
import { CertificateUploadHandler } from "../certificate-upload/certificate-upload-handler";
import { FetchError } from "@root/lib/http/fetch-error";
import { t } from "@root/lib/i18n";
import { userStore } from "@root/stores";

export class CertificateUploadDialogStore {
  @observable private externalCredential?: ExternalCredential;
  @observable private _userId?: string;
  public uploadHandler: CertificateUploadHandler = new CertificateUploadHandler();

  constructor() {
    this._userId = userStore.currentUser.id;
    this.resetDialog();
  }

  @computed
  public get isCreating() {
    return !!this.externalCredential && externalCredentialStore.isCreating(this.externalCredential);
  }

  @computed
  public get allowedToCreate() {
    return this.uploadHandler.isValidUpload;
  }

  @computed
  public get allowedToCreateAppleConnect() {
    return this.uploadHandler.isValidAppleKeyUpload;
  }

  @action
  public uploadCertificate = (onSuccessCallback) =>
    action((event: React.FormEvent<HTMLElement>): void => {
      if (event) {
        event.preventDefault();
      }

      if (!this.allowedToCreate) {
        return;
      }

      this.externalCredential = new ExternalCredential();
      this.externalCredential.serviceType = "apple";
      this.externalCredential.credentialType = "certificate";
      this.externalCredential.profile = {
        base64Certificate: this.uploadHandler.base64Certificate,
        password: this.uploadHandler.password,
      };
      externalCredentialStore.create(this.externalCredential, false).onSuccess((data: ExternalCredential | any) => {
        this.resetDialog();
        onSuccessCallback(data);
      });
    });

  @action
  public uploadAppleConnectKeys = (onSuccessCallback) =>
    action((event: React.FormEvent<HTMLElement>): void => {
      if (event) {
        event.preventDefault();
      }

      if (!this.allowedToCreateAppleConnect) {
        return;
      }

      this.externalCredential = new ExternalCredential();
      this.externalCredential.serviceType = "apple";
      this.externalCredential.credentialType = "key";
      this.externalCredential.profile = {
        keyName: this._userId + this.uploadHandler.keyAlias!,
        key_p8_base64: this.uploadHandler.base64Certificate,
        keyId: this.uploadHandler.apiKey,
        issuerId: this.uploadHandler.issuerId,
        keyAlias: this.uploadHandler.keyAlias,
      };
      externalCredentialStore.create(this.externalCredential, false).onSuccess((data: ExternalCredential | any) => {
        this.resetDialog();
        onSuccessCallback(data);
      });
    });

  @computed get errorMessage() {
    if (!this.externalCredential || !externalCredentialStore.creationFailed(this.externalCredential)) {
      return null;
    }
    const error = externalCredentialStore.creationError<FetchError>(this.externalCredential);
    switch (error.status) {
      case 400:
        const errorDetails = error.body ? error.body.error : null;
        if (errorDetails && errorDetails.code && errorDetails.message) {
          return errorDetails.message;
        }
      default:
        return t("common:certificateUploadDialog.somethingWentWrong");
    }
  }

  @action
  public resetDialog = () => {
    this.externalCredential = undefined;
    this.uploadHandler.reset();
  };
}
