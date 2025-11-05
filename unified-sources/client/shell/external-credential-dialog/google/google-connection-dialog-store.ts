import { observable, action, computed } from "mobx";
import { StoresTelemetry } from "./../../../../client/distribute/utils/telemetry";
import {
  JsonFileUploadHandler,
  ICallbacks,
} from "./../../../../client/distribute/distribution-stores-wizard/json-file-upload-handler";
import { IDragDropUploadHandlerStore } from "@root/shared";
import { externalCredentialStore } from "@root/data/shell/stores/external-credentials-store";
import { ExternalCredential } from "@root/data/shell/models/external-credential";
import { t } from "@root/lib/i18n";

/**
 * UI Store for Google Connection Dialog.
 */
export class GoogleConnectionDialogStore {
  public LearnMoreAboutGooglePlayURL = "https://docs.microsoft.com/en-us/mobile-center/distribution/stores/googleplay";
  @observable private errorMessage: string = "";
  @observable private addButtonEnabled: boolean = false;
  @observable private externalCredential: ExternalCredential;
  private callbacks: ICallbacks;
  public jsonHandler: IDragDropUploadHandlerStore;

  constructor() {
    this.resetDialog();
    this.callbacks = {
      onUploadFinished: (response: any) => this.onUploadFinished(response),
      onUploadReset: () => this.resetExternalCredentialProfile(),
    };
    this.setAddButtonEnabled(false);
    this.jsonHandler = new JsonFileUploadHandler(this.callbacks);
    this.externalCredential = new ExternalCredential();
    this.externalCredential.serviceType = "googleplay";
  }

  @computed
  public get isCreating() {
    return externalCredentialStore.isCreating(this.externalCredential);
  }

  @computed
  public get allowedToCreate() {
    return !this.errorMessage && this.addButtonEnabled && this.externalCredential.profile;
  }

  @action
  public onDocsLinkClick() {
    StoresTelemetry.track(`store/connection/google-play/docs`, "googleplay");
  }

  @action
  public createGoogleConnection = (onSuccessCallback) =>
    action((): void => {
      externalCredentialStore
        .create(this.externalCredential)
        .onSuccess((credentials: ExternalCredential | any) => {
          if (typeof onSuccessCallback === "function") {
            this.resetDialog();
            onSuccessCallback(credentials);
          }
        })
        .onFailure((error) => {
          // TODO Add error handling logic
          alert(JSON.stringify(error));
        });
    });

  @action
  private setErrorMessage(message: string) {
    this.errorMessage = message;
  }

  @action
  private setAddButtonEnabled(status: boolean) {
    this.addButtonEnabled = status;
  }

  @action
  private setExternalCredentialProfile(secretJsonValue: string) {
    try {
      this.externalCredential.profile = JSON.parse(secretJsonValue);
      this.setErrorMessage("");
      this.setAddButtonEnabled(true);
    } catch (ex) {
      this.setErrorMessage(t("externalCredentialDialog.errors.jsonFormatInvalid"));
      this.setAddButtonEnabled(false);
    }
  }

  public resetDialog = () => {
    this.setAddButtonEnabled(false);
    this.resetExternalCredentialProfile();
    this.setErrorMessage("");
  };

  @action
  private resetExternalCredentialProfile() {
    this.externalCredential.profile = undefined;
  }

  private onUploadFinished(response: any) {
    this.setExternalCredentialProfile(response);
    StoresTelemetry.track(`store/publish/google-play/upload-finished`, "googleplay");
  }
}
