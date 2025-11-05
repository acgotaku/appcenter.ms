import { observable, computed, action } from "mobx";
import { ResourceRequest } from "@root/data/lib";
import {
  ExternalCredential,
  SerializedExternalCredential,
  DeserializedExternalCredential,
  ExternalServiceType,
  ExternalCredentialType,
} from "@root/data/shell/models";
import { FetchError } from "@root/lib/http/fetch-error";
import { t } from "@root/lib/i18n";
import { externalCredentialStore } from "@root/data/shell/stores/external-credentials-store";
import { logger } from "@root/lib/telemetry";

export const HelpLinkAppSpecificPassword = "https://support.apple.com/en-us/HT204397";

export class AppSpecificPasswordDialogStore {
  @observable public externalCredential?: ExternalCredential;
  @observable private credentialRequest?: ResourceRequest<ExternalCredential | undefined, void | SerializedExternalCredential>;
  @observable public appSpecificPassword: string = "";

  @action
  public updateAppSpecificPassword = (onSuccessCallback) =>
    action((): void => {
      if (event) {
        event.preventDefault();
      }

      if (!this.allowedToComplete) {
        return;
      }

      this.credentialRequest = this.updateExternalCredential(
        {
          displayName: this.externalCredential?.displayName || "",
          profile: this.externalCredential?.profile,
          isValid: true,
        },
        onSuccessCallback
      );
    });

  @action
  public setExistingCredential(credential: ExternalCredential) {
    this.externalCredential = credential;
  }

  private updateExternalCredential(
    changes: Partial<DeserializedExternalCredential<ExternalServiceType, ExternalCredentialType>>,
    onSuccessCallback: (credential: ExternalCredential | undefined) => void
  ): ResourceRequest<ExternalCredential | undefined, void | SerializedExternalCredential> {
    return externalCredentialStore
      .update(this.externalCredential!, changes, true, {
        appSpecificPassword: this.appSpecificPassword,
      })
      .onSuccess((credential: ExternalCredential | undefined) => {
        this.trackEvent("serviceConnection/update", { result: true, serviceConnectionId: this.externalCredential!.id });
        this.resetDialog();
        if (typeof onSuccessCallback === "function") {
          onSuccessCallback(credential);
        }
      })
      .onFailure((error) => {
        this.trackEvent("serviceConnection/update", { result: false, serviceConnectionId: this.externalCredential!.id });
      });
  }

  @action
  public resetDialog = () => {
    this.credentialRequest = undefined;
    this.setAppSpecificPassword("");
  };

  private trackEvent(eventName: string, props: any): void {
    logger.info(eventName, {
      serviceType: this.externalCredential?.serviceType,
      credentialType: this.externalCredential?.credentialType,
      is2FA: true,
      errorMessage: this.submitErrorMessage,
      ...props,
    });
  }

  @action
  public onAppSpecificPasswordChanged = (event: React.FormEvent<HTMLInputElement>) => {
    this.setAppSpecificPassword(event.currentTarget.value);
  };

  @action
  private setAppSpecificPassword(value: string) {
    this.appSpecificPassword = value;
  }

  @computed
  public get isSubmitting(): boolean {
    return !!this.externalCredential && !!this.externalCredential.id && externalCredentialStore.isUpdating(this.externalCredential.id);
  }

  @computed
  public get allowedToComplete() {
    return !!this.appSpecificPassword;
  }

  @computed
  public get submitErrorMessage() {
    if (!this.credentialRequest || !this.credentialRequest.error) {
      return null;
    }
    const error = this.credentialRequest.error as FetchError;
    if (error) {
      switch (error.status) {
        case 500:
        default:
          return t("common:externalCredentialDialog.apple.somethingWentWrong");
      }
    }
  }
}
