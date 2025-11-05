import { action, computed, observable } from "mobx";
import { externalCredentialStore } from "@root/data/shell/stores/external-credentials-store";
import {
  ExternalCredential,
  SerializedExternalCredential,
  ExternalServiceType,
  ExternalCredentialType,
  DeserializedExternalCredential,
  AppleProfile,
} from "@root/data/shell/models/external-credential";
import { FetchError } from "@root/lib/http/fetch-error";
import { logger } from "@root/lib/telemetry";
import { noop } from "lodash";
import { t } from "@root/lib/i18n";
import { ResourceRequest } from "@root/data/lib";
import { API } from "@root/data/shell/constants";
import { apiGateway } from "@root/lib/http";

const NUM_SESSION_CODE_INPUTS = 6;
export const HelpLinkNoTrustedDevices = "https://support.apple.com/en-gb/HT204915#manage";

/**
 * UI Store for New Apple Connection Dialog .
 */
export class AppleConnectionDialogStore {
  public isFirstTimeUpdate: boolean = true;
  @observable private externalCredential?: ExternalCredential;
  @observable public userName: string = "";
  @observable public password: string = "";
  @observable public authCodeInputs: string[] = [];
  @observable private twoFactorRequest?: ResourceRequest<ExternalCredential | undefined, void | SerializedExternalCredential>;
  @observable private credentialRequest?: ResourceRequest<ExternalCredential | undefined, void | SerializedExternalCredential>;
  @observable private verifyAuthenticationRequest?: ResourceRequest<void>;

  constructor() {
    this.resetAppleDialog();
  }

  private errorCodes: { [key: string]: string } = {
    TwoFactorAuthentication: "two_factor_auth_unsupported",
    TwoFactorEnabled: "two_factor_enabled",
    LicenseUpdatePending: "license_agreement_updated",
    AuthenticationFailed: "authentication_failed",
    TeamNotFound: "team_not_found",
    ProfileNotFound: "profile_not_found",
    AppleDeveloperProgramExpired: "program_expired",
    AppleAccountNotRegisteredAppleDeveloper: "profile_not_registered_apple_developer",
    InternalServerError: "internal_server_error",
    InvalidSessionCode: "invalid_sessioncode",
  };

  @computed get isSubmitting() {
    return (
      !!this.externalCredential &&
      (!!externalCredentialStore.isCreating(this.externalCredential) || !!externalCredentialStore.isUpdating(this.externalCredential))
    );
  }

  @computed get createErrorDetails() {
    const error = this.externalCredential && externalCredentialStore.creationError<FetchError>(this.externalCredential);
    return error && error.body ? error.body.error : null;
  }

  @computed get updateErrorDetails() {
    const error = this.externalCredential && externalCredentialStore.updateError<FetchError>(this.externalCredential);
    return error && error.body ? error.body.error : null;
  }

  @computed get isAuthenticationFailed() {
    const error = this.createErrorDetails || this.updateErrorDetails;
    return error && error.code === this.errorCodes.AuthenticationFailed;
  }

  @computed get isWrongVerificationCode() {
    const error = this.createErrorDetails || this.updateErrorDetails;
    return error && error.code === this.errorCodes.InvalidSessionCode;
  }

  @computed
  public get allowedToComplete() {
    return !!this.userName && !!this.password;
  }

  @action
  public onUsernameChanged = (event: React.FormEvent<HTMLInputElement>): void => {
    this.setUsername(event.currentTarget.value);
  };

  @action
  public onPasswordChanged = (event: React.FormEvent<HTMLInputElement>): void => {
    this.setPassword(event.currentTarget.value);
  };

  @action
  public onSessionCodeChanged = (
    id: string,
    value: string,
    onSuccessCallback: (credential: ExternalCredential | undefined) => void
  ) => {
    this.setAuthCode(Number(id), value);
    if (this.isSessionCodeValid) {
      if (this.externalCredential && !this.externalCredential.id) {
        // This is part of the flow for adding a new set of credentals, so do a create
        this.twoFactorRequest = this.createExternalCredential(onSuccessCallback);
      } else {
        // This is an existing credential attempting to reconnect, so do an update
        this.twoFactorRequest = this.updateExternalCredential(this.createChangesForUpdate2FA(), onSuccessCallback);
      }
    }
  };

  private createExternalCredential(
    onSuccessCallback: (credential: ExternalCredential) => void
  ): ResourceRequest<ExternalCredential | undefined, void | SerializedExternalCredential> {
    return externalCredentialStore
      .create(this.externalCredential!, false, {
        authCode: this.authCodeInputs.join(""),
      })
      .onSuccess((credential: ExternalCredential | any) => {
        this.trackEvent("serviceConnection/create", { result: true });
        this.resetAppleDialog();
        if (typeof onSuccessCallback === "function") {
          onSuccessCallback(credential);
        }
      })
      .onFailure((error) => {
        this.trackEvent("serviceConnection/create", { result: false });
        this.resetSessionCode();
      });
  }

  private updateExternalCredential(
    changes: Partial<DeserializedExternalCredential<ExternalServiceType, ExternalCredentialType>>,
    onSuccessCallback: (credential: ExternalCredential | undefined) => void
  ): ResourceRequest<ExternalCredential | undefined, void | SerializedExternalCredential> {
    return externalCredentialStore
      .update(this.externalCredential!, changes, false, {
        authCode: this.authCodeInputs.join(""),
      })
      .onSuccess((credential: ExternalCredential | undefined) => {
        this.trackEvent("serviceConnection/update", { result: true, serviceConnectionId: this.externalCredential?.id });
        this.resetAppleDialog();
        if (typeof onSuccessCallback === "function") {
          onSuccessCallback(credential);
        }
      })
      .onFailure((error) => {
        this.trackEvent("serviceConnection/update", { result: false, serviceConnectionId: this.externalCredential?.id });
        this.resetSessionCode();
      });
  }

  @computed
  private get isSessionCodeValid() {
    const sessionCodeValue = this.authCodeInputs.join("");
    return sessionCodeValue.length === NUM_SESSION_CODE_INPUTS;
  }

  @action
  public setAuthCode(index: number, value: string) {
    this.authCodeInputs[index] = value;
  }

  @action
  public setUsername(userName: string): void {
    this.userName = userName;
  }

  @action
  public setPassword(password: string): void {
    this.password = password;
  }

  @action
  public setExistingCredential(credential: ExternalCredential) {
    this.externalCredential = credential;
    this.setUsername((credential.profile as AppleProfile).username);
  }

  @action
  public finishAppleConnection = (onSuccessCallback) =>
    action((event: React.FormEvent<HTMLElement>): void => {
      if (event) {
        event.preventDefault();
      }

      if (!this.allowedToComplete || this.isSubmitting) {
        return;
      }

      // Check to see whether this is a new credential or a reconnect/reauthenticate case
      if (!this.externalCredential || !externalCredentialStore.get(this.externalCredential.id)) {
        // This is a new credential
        this.externalCredential = new ExternalCredential();
        this.externalCredential.serviceType = "apple";
        this.externalCredential.profile = {
          username: this.userName,
          password: this.password,
        };

        this.credentialRequest = this.createExternalCredential(onSuccessCallback);
        return;
      }

      this.credentialRequest = this.updateExternalCredential(this.createChangesForUpdatePassword(), onSuccessCallback);
    });

  private createChangesForUpdatePassword(): Partial<DeserializedExternalCredential<ExternalServiceType, ExternalCredentialType>> {
    // This was an existing credential, only update the password
    return {
      displayName: this.externalCredential?.displayName || "",
      profile: {
        username: this.userName,
        password: this.password,
      },
      isValid: true,
    };
  }

  private createChangesForUpdate2FA(): Partial<DeserializedExternalCredential<ExternalServiceType, ExternalCredentialType>> {
    // This was an existing credential with correct password. Just need to update the auth code.
    return {
      displayName: this.externalCredential?.displayName || "",
      profile: {
        username: this.userName,
        password: this.password,
      },
      isValid: true,
    };
  }

  @computed
  public get credentialError(): FetchError | null {
    if (
      (!this.credentialRequest || !this.credentialRequest.error) &&
      (!this.verifyAuthenticationRequest || !this.verifyAuthenticationRequest.error)
    ) {
      return null;
    }
    return this.credentialRequest
      ? (this.credentialRequest.error as FetchError)
      : this.verifyAuthenticationRequest
      ? (this.verifyAuthenticationRequest.error as FetchError)
      : null;
  }

  @computed
  public get hasNoAccessToConnection(): boolean {
    const error = this.credentialError;

    return !!error && error.status === 404;
  }

  @computed
  public get credentialErrorMessage() {
    const error = this.credentialError;

    if (error) {
      switch (error.status) {
        case 400:
          const errorDetails = error.body ? error.body.error : null;
          if (errorDetails) {
            if (errorDetails.code === this.errorCodes.AuthenticationFailed) {
              return t("common:externalCredentialDialog.apple.authenticationFailed");
            } else if (errorDetails.code === this.errorCodes.InvalidSessionCode) {
              return t("common:externalCredentialDialog.apple.invalidSessionCode");
            } else if (errorDetails.message) {
              return errorDetails.message;
            }
          }
          break;
        case 404:
          return t("common:externalCredentialDialog.apple.noAccessToConnection");
        case 409:
          return t("common:externalCredentialDialog.apple.conflict");
        default:
          return t("common:externalCredentialDialog.apple.somethingWentWrong");
      }
    }
  }

  @computed
  public get twoFactorErrorMessage() {
    if (!this.twoFactorRequest || !this.twoFactorRequest.error) {
      return null;
    }
    const error = this.twoFactorRequest.error as FetchError;
    if (error) {
      switch (error.status) {
        case 400:
          const errorDetails = error.body ? error.body.error : null;
          if (errorDetails) {
            if (errorDetails.code === this.errorCodes.InvalidSessionCode) {
              return t("common:externalCredentialDialog.apple.invalidSessionCode");
            } else if (errorDetails.message) {
              return errorDetails.message;
            }
          }
          break;
        default:
          return t("common:externalCredentialDialog.apple.somethingWentWrong");
      }
    }
  }

  @computed
  public get is2FA() {
    return this.is2FARequestError(this.credentialRequest) || this.is2FARequestError(this.verifyAuthenticationRequest);
  }

  @computed
  public get isVerifying(): boolean {
    return !!(this.verifyAuthenticationRequest && this.verifyAuthenticationRequest.isPending);
  }

  @action
  public resetAppleDialog = () => {
    this.setUsername("");
    this.setPassword("");
    this.resetSessionCode();
    this.externalCredential = undefined;
    this.twoFactorRequest = undefined;
    this.credentialRequest = undefined;
    this.verifyAuthenticationRequest = undefined;
  };

  @action
  public verifyAppleAuthentication(accountServiceConnnectionId: string) {
    this.setPassword("");
    return (this.verifyAuthenticationRequest = new ResourceRequest<void>(
      this.validateServiceConnection(accountServiceConnnectionId),
      noop,
      noop
    ));
  }

  public resetSessionCode() {
    this.authCodeInputs = ["", "", "", "", "", ""];
  }

  private trackEvent(eventName: string, props: any): void {
    logger.info(eventName, {
      serviceType: this.externalCredential?.serviceType,
      credentialType: this.externalCredential?.credentialType,
      is2FA: !!this.is2FA,
      errorMessage: this.twoFactorErrorMessage || this.credentialErrorMessage,
      ...props,
    });
  }

  private is2FARequestError(request: ResourceRequest<any> | undefined): boolean {
    return !!request?.error && (request.error as FetchError).code === this.errorCodes.TwoFactorEnabled;
  }

  private validateServiceConnection(accountServiceConnnectionId: string): Promise<void> {
    return apiGateway.get(API.VERIFY_AUTHENTICATION, {
      params: {
        serviceConnectionId: accountServiceConnnectionId,
      },
    });
  }
}
