import { IDragDropUploadHandlerStore, UploadStatus } from "@root/shared";
import { ResourceRequest } from "@root/data/lib";
import { noop, debounce } from "lodash";
import { observable, action, computed } from "mobx";
import { apiGateway } from "@root/lib/http";
import { API } from "@root/data/shell/constants";
import { RESPONSE_TYPES } from "@lib/common-interfaces";
import { t } from "@root/lib/i18n";

export enum PasswordState {
  Valid,
  Invalid,
  Validating,
}

export class CertificateUploadHandler implements IDragDropUploadHandlerStore {
  @observable private validationRequest?: ResourceRequest<any, any>;
  @observable public uploadPercent: number = 0;
  @observable public file?: File;
  @observable public uploadStatus?: UploadStatus;
  @observable public passwordState?: PasswordState;
  @observable public password?: string;
  @observable public base64Certificate?: string;
  private debouncedValidation;
  @observable public errorMessage?: string;
  @observable public apiKey?: string;
  @observable public issuerId?: string;
  @observable public keyAlias?: string;

  @action
  public setApiKey = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.apiKey = event.target.value;
  };

  @action
  public setIssuerId = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.issuerId = event.target.value;
  };

  @action
  public setKeyAlias = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.keyAlias = event.target.value;
  };

  @action public upload = (file: any, requiredValidation?: boolean) => {
    if (requiredValidation) this.reset(); // only reset if it is not apple connect key
    if (this.isValidFileType(file.name, requiredValidation)) {
      this.uploadStatus = UploadStatus.UploadProcessing;
      const reader = new FileReader();
      reader.readAsBinaryString(file);
      reader.onload = action(() => {
        this.file = file;
        // Try to validate with an empty string first.
        // validation is not required for p8 file
        if (requiredValidation) {
          this.validate((this.base64Certificate = btoa(reader.result as string)), "", true); // The result of readAsBinaryString is always a string
        } else {
          this.base64Certificate = btoa(reader.result as string);
          this.uploadStatus = UploadStatus.UploadSuccessful;
        }
      });
    } else {
      this.uploadStatus = UploadStatus.UploadFailed;
    }
  };

  @action
  public onPasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.passwordState = PasswordState.Validating;
    this.cancelValidation();
    this.password = event.target.value;
    this.debouncedValidation = debounce(() => this.validate(this.base64Certificate, this.password), 1000, { trailing: true });
    this.debouncedValidation();
  };

  @action
  public reset(): void {
    this.file = undefined;
    this.password = "";
    this.uploadStatus = undefined;
    this.uploadPercent = 0;
    this.base64Certificate = undefined;
    this.passwordState = undefined;
    this.apiKey = "";
    this.issuerId = "";
    this.keyAlias = "";
    this.cancelValidation();
  }

  @computed
  public get isValidUpload() {
    return this.base64Certificate && this.validationRequest?.isLoaded;
  }

  @computed
  public get isValidAppleKeyUpload() {
    return this.base64Certificate && this.apiKey && this.issuerId && this.keyAlias;
  }

  private cancelValidation() {
    if (this.debouncedValidation) {
      this.debouncedValidation.cancel();
      this.debouncedValidation = null;
    }
  }

  @action
  private validate(base64Certificate: string | undefined, password: string | undefined, firsTimeValidation = false) {
    return (this.validationRequest = new ResourceRequest<any, any>(this.httpValidate(base64Certificate, password), noop, noop)
      .onFailure(() => {
        // We need to set these two states so that the password textbox is shown to the user
        // The user can then use the textbox to update/add their certificate password
        this.uploadPercent = 100;
        this.uploadStatus = UploadStatus.UploadSuccessful;
        if (!firsTimeValidation) {
          this.passwordState = PasswordState.Invalid;
        }
      })
      .onSuccess(() => {
        this.passwordState = PasswordState.Valid;
        this.uploadStatus = UploadStatus.UploadSuccessful;
      }));
  }

  private isValidFileType(filename: String, isP12?: boolean): boolean {
    const extension = ".p12";
    if (!filename.toLocaleLowerCase().endsWith(isP12 ? extension : ".p8")) {
      this.errorMessage = t("certificateUpload.invalidCertificateErrorMessage");
      return false;
    }
    return true;
  }

  private httpValidate(base64Certificate: string | undefined, password: string | undefined) {
    return apiGateway.post(API.VALIDATE_SERVICE_CONNECTIONS, {
      body: {
        credentialType: "certificate",
        serviceType: "apple",
        data: {
          base64Certificate,
          password,
        },
      },
      responseType: RESPONSE_TYPES.TEXT,
    });
  }
}
