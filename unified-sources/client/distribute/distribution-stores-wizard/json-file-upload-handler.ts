import { observable, action } from "mobx";
import { random } from "lodash";
import { ProgressBarStatus, IDragDropUploadHandlerStore } from "@root/shared";
import { UploadStatus } from "@root/shared";
import { DistributionStoreGooglePlayStrings } from "../utils/strings";

const defaultOptions = {
  uploadSpeed: 200,
  incrementPerTick: 5,
  uploadsBeforeExpectedFailure: 10,
  fileExtensions: [".json"],
  maxFileSize: 1 * 1024 * 1024,
};

export interface ICallbacks {
  onUploadFinished(response: any): void;
  onUploadReset(): void;
}

export class JsonFileUploadHandler implements IDragDropUploadHandlerStore {
  @observable public uploadPercent: number;
  @observable public file: File;
  @observable public errorMessage: string;
  @observable public progressBarStatus: ProgressBarStatus;
  @observable public uploadStatus!: UploadStatus;
  private _callbacks: ICallbacks;

  constructor(callbacks: ICallbacks) {
    this._callbacks = callbacks;
    this.uploadPercent = 0;
    this.file = null as any;
    this.errorMessage = null as any;
    this.progressBarStatus = ProgressBarStatus.Default;
  }

  @action
  private validate(file: any) {
    // Validate file exists
    if (!file || !file.name) {
      this.errorMessage = DistributionStoreGooglePlayStrings.JsonUploadFileNotProvidedString;
      return false;
    }

    // Validate file type
    if (!defaultOptions.fileExtensions.some((x) => file.name.endsWith(x))) {
      this.errorMessage = DistributionStoreGooglePlayStrings.JsonUploadFileTypeInvalidString;
      return false;
    }

    // Validate file size
    if (file.size > defaultOptions.maxFileSize) {
      this.errorMessage = DistributionStoreGooglePlayStrings.JsonUploadFileSizeExceedString;
      return false;
    }

    return true;
  }

  @action
  private wait = (options) => {
    if (this.uploadStatus === null) {
      return this.done(null as any);
    }

    const { uploadSpeed, incrementPerTick, uploadsBeforeExpectedFailure } = Object.assign({}, defaultOptions, options);
    this.uploadPercent = Math.min(this.uploadPercent + random(incrementPerTick), 100);

    // Upload fails
    const expectedTicksPerUpload = 100 / (incrementPerTick / 2);
    const expectedTicksBeforeExpectedFailure = uploadsBeforeExpectedFailure * expectedTicksPerUpload;
    if (random(expectedTicksBeforeExpectedFailure) === 0) {
      this.errorMessage = DistributionStoreGooglePlayStrings.JsonUploadFileUploadInterruptString;
      return this.done(UploadStatus.UploadFailed);

      // Upload continues
    } else if (this.uploadPercent < 100) {
      return setTimeout(this.wait, uploadSpeed);

      // Upload completes
    } else {
      const reader = new FileReader();
      reader.onloadend = this.readFileContent;
      reader.readAsText(this.file);
      this.errorMessage = null as any;
      return this.done(UploadStatus.UploadSuccessful);
    }
  };

  public readFileContent = (event: any) => {
    this._callbacks.onUploadFinished(event.target.result);
  };

  @action
  private done(status: UploadStatus) {
    const failed = [
      UploadStatus.UploadFailedPost,
      UploadStatus.UploadFailedBlocks,
      UploadStatus.UploadFailedPatch,
      UploadStatus.UploadFailed,
    ].includes(status);
    this.progressBarStatus = ProgressBarStatus[failed ? "Error" : "Default"];
    this.uploadStatus = status;
  }

  @action
  public reset() {
    this.uploadStatus = null as any;
    this.uploadPercent = 0;
    this.file = null as any;
    this.errorMessage = null as any;
    this.progressBarStatus = ProgressBarStatus.Default;
    this._callbacks.onUploadReset();
  }

  @action
  public upload(file: any) {
    this.reset();

    if (!this.validate(file)) {
      return this.done(UploadStatus.UploadFailed);
    }
    this.uploadStatus = UploadStatus.UploadStarted;
    this.file = file;
    return setTimeout(this.wait, defaultOptions.uploadSpeed);
  }
}
