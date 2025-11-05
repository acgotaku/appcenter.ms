import { observable, action } from "mobx";
import { ICertUploadHandlerStore } from "@root/lib/file-upload-service";
import { UploadStatus, ProgressBarStatus } from "@root/shared";

export interface EncodedFileUploadStoreOptions {
  requiresPassword: boolean;
}

export abstract class EncodedFileUploadStore implements ICertUploadHandlerStore {
  public readonly hasPasswordValidation = false;
  @observable public file?: File;
  @observable public uploadPercent: number;
  @observable public errorMessage?: string;
  @observable public uploadStatus?: UploadStatus;
  @observable public progressBarStatus: ProgressBarStatus;

  @observable private _isValid: boolean = false;
  @observable private _password?: string;
  @observable private _passwordReadonly: boolean = false;

  private _fileEncoded?: string;
  private _passwordRequired: boolean;

  constructor(options?: EncodedFileUploadStoreOptions) {
    this._passwordRequired = !!options && options.requiresPassword;
    this.uploadPercent = 0;
    this.progressBarStatus = ProgressBarStatus.Default;
  }

  get isValid(): boolean {
    return this._isValid;
  }

  get hasFile(): boolean {
    return !!this.file;
  }

  get fileName(): string | undefined {
    return this.file && this.file.name;
  }

  get fileEncoded(): string | undefined {
    return this._fileEncoded;
  }

  get password(): string | undefined {
    if (this._passwordRequired) {
      // if password is required, it can't be undefined
      return this._password || "";
    }
    return this._password;
  }

  get passwordReadonly(): boolean {
    return this._passwordReadonly;
  }

  @action public setInfoOnlyFilename(filename: string) {
    this.reset();

    // "new File" isn't supported in MS Edge
    this.file = { name: filename } as File;
    this.uploadPercent = 100;
    this.uploadStatus = UploadStatus.UploadSuccessful;
    this.progressBarStatus = ProgressBarStatus.Default;
    this._isValid = true;
    this._passwordReadonly = true;
  }

  @action public passwordChanged(value: string | undefined) {
    this._password = value;
  }

  @action public upload(file: any) {
    this.reset();

    if (!this.validate(file)) {
      this.uploadStatus = UploadStatus.UploadFailed;
      this.progressBarStatus = ProgressBarStatus.Error;
      return;
    }

    this.file = file;
    this.uploadStatus = UploadStatus.UploadStarted;

    const fileReader = new FileReader();
    fileReader.onprogress = this.uploadProgress;
    fileReader.onload = this.uploadComplete;
    fileReader.readAsBinaryString(file);
  }

  @action public reset() {
    this._password = undefined;
    this._passwordReadonly = false;
    this.file = undefined;
    this.errorMessage = undefined;
    this.uploadPercent = 0;
    this.uploadStatus = undefined;
    this.progressBarStatus = ProgressBarStatus.Default;
    this._isValid = false;

    this._fileEncoded = undefined;
  }

  @action public uploadProgress = (event: any) => {
    if (event.lengthComputable) {
      const percentComplete = Math.round((event.loaded * 100) / event.total);
      this.uploadPercent = percentComplete;
    }
  };

  @action public uploadComplete = (event: any) => {
    this.uploadPercent = 100;
    this.uploadStatus = UploadStatus.UploadSuccessful;

    // TODO: Encrypt before base64
    this._fileEncoded = btoa(event.target.result);
    this._isValid = true;
  };

  public abstract validate(file: File): boolean;
}

export class MobileProvisionFileUploadStore extends EncodedFileUploadStore {
  public validate(file: File): boolean {
    const mobileProvisionExtension = ".mobileprovision";

    // allow "application/octet-stream" for UI tests
    if (window["%hammerhead%"] && file.type && file.type === "application/octet-stream") {
      return true;
    }

    // mime type is not set on non-Apple OS so fall back to filename.
    if (
      (file.type && file.type !== "application/x-apple-aspen-mobileprovision") ||
      (!file.type && !file.name.endsWith(mobileProvisionExtension))
    ) {
      this.errorMessage = `Not a valid ${mobileProvisionExtension} file`;
      return false;
    }

    return true;
  }
}

export class P12FileUploadStore extends EncodedFileUploadStore {
  constructor() {
    super({ requiresPassword: true });
  }

  public validate(file: File): boolean {
    const extension = ".p12";
    if ((file.type && file.type !== "application/x-pkcs12") || (!file.type && !file.name.endsWith(extension))) {
      this.errorMessage = `Not a valid ${extension} file`;
      return false;
    }

    return true;
  }
}

export class PfxFileUploadStore extends EncodedFileUploadStore {
  constructor() {
    super({ requiresPassword: true });
  }

  public validate(file: File): boolean {
    const extension = ".pfx";
    if ((file.type && file.type !== "application/x-pkcs12") || (!file.type && !file.name.endsWith(extension))) {
      this.errorMessage = `Not a valid ${extension} file`;
      return false;
    }

    return true;
  }
}

export class KeystoreUploadStore extends EncodedFileUploadStore {
  public validate(file: File): boolean {
    const filename: string = file.name as string;
    if (!filename.endsWith(".jks") && !filename.endsWith(".keystore")) {
      this.errorMessage = "Not a valid keystore file";
      return false;
    }

    return true;
  }
}
