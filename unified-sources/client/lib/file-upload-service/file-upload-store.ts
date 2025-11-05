import { observable, action } from "mobx";
import { IDragDropUploadHandlerStore, UploadStatus, ProgressBarStatus } from "@root/lib/drag-drop-upload";
import { IFileUploadServiceDetails, IUploadStats, FileUploadServiceState, MessageLevel } from "./file-upload-types";
import FileUploadService, { IFileUploadClientSettings, IProgress } from "appcenter-file-upload-client";
import { apiGateway } from "../http";

export interface EncodedFileUploadStoreOptions {
  requiresPassword: boolean;
}

export abstract class FileUploadStore implements IDragDropUploadHandlerStore {
  @observable public file?: File;
  @observable public uploadPercent!: number;
  @observable public errorMessage?: string;
  @observable public uploadStatus?: UploadStatus;
  @observable public progressBarStatus!: ProgressBarStatus | ProgressBarStatus.Default;

  @observable protected fileUploadIsValid: boolean = false;
  @observable public isInternalUploading: boolean = false;
  @observable public isCancelled: boolean = false;
  @observable public internalSecureFileId?: string;
  @observable public fileUploadServiceDetails?: IFileUploadServiceDetails;

  public validExtensions?: string[];
  protected mcFusUpload?: FileUploadService;

  constructor() {
    this.clear();
  }

  get isValid(): boolean {
    return this.fileUploadIsValid;
  }

  get hasFile(): boolean {
    return !!this.file;
  }

  get fileName(): string | undefined {
    return this.file && this.file.name;
  }

  get fileContent(): File | undefined {
    return this.file;
  }

  get fileEncoded(): string | undefined {
    return undefined;
  }

  set SecureFileId(secureFileId: string) {
    this.internalSecureFileId = secureFileId;
  }

  @action public setInfoOnlyFilename(filename: string) {
    this.clear();

    this.file = { name: filename } as File;
    this.uploadPercent = 100;
    this.uploadStatus = UploadStatus.UploadSuccessful;
    this.progressBarStatus = ProgressBarStatus.Default;
    this.fileUploadIsValid = true;
  }

  @action public upload(file: File) {
    this.clear();
    this.file = file;

    if (!this.validate(file)) {
      this.uploadStatus = UploadStatus.UploadFailed;
      this.progressBarStatus = ProgressBarStatus.Error;
      this.onUploadValidationFailed();
      return;
    }

    this.uploadStatus = UploadStatus.UploadStarted;
    this.progressBarStatus = ProgressBarStatus.Indeterminate;

    this.onUploadStarted();
    const path = this.createAssetPath;
    apiGateway
      .post<IFileUploadServiceDetails>(path)
      .then((result) => {
        return this.onCreateAssetComplete(result);
      })
      .catch((err: Error) => {
        this.onCreateAssetFailed(err);
        this.onMessage(err.message, MessageLevel.Error);
      });
  }

  @action public reset() {
    // only when an upload is in progress we need to cancel
    if (this.mcFusUpload && this.isInternalUploading === true) {
      this.mcFusUpload.cancel();
    } else {
      this.clear();
      this.isCancelled = true;
    }
  }

  public uploadProgress = action((progress: IProgress) => {
    if (this.uploadStatus != UploadStatus.UploadFailed) {
      this.uploadPercent = progress.percentCompleted;
    }
  });

  public onMessage = action((message: string, level: MessageLevel) => {
    if (level === MessageLevel.Error && !this.isCancelled) {
      this.mcFusUpload && this.mcFusUpload.cancel();
      this.isCancelled = true;
      this.uploadStatus = UploadStatus.UploadFailed;
      this.progressBarStatus = ProgressBarStatus.Error;
      this.errorMessage = message;
      this.isInternalUploading = false;
    }
  });

  @action public onStateChanged = (status: FileUploadServiceState): void => {
    if (status === FileUploadServiceState.Cancelled && this.uploadStatus !== UploadStatus.UploadFailed) {
      this.clear();
      this.isCancelled = true;
    }
  };

  @action public async onCreateAssetComplete(fileDetails: IFileUploadServiceDetails) {
    this.fileUploadServiceDetails = fileDetails;

    const uploadSettings: IFileUploadClientSettings = {
      // Required settings
      assetId: fileDetails.id,
      assetToken: fileDetails.token,
      file: this.file!,
      assetDomain: fileDetails.uploadDomain || fileDetails.upload_domain,
      useLogging: false,

      // custom event handlers
      onProgressChanged: this.uploadProgress,
      onMessage: this.onMessage,
      onStateChanged: this.onStateChanged,
    };

    this.mcFusUpload = new FileUploadService();

    // Cancel may be missed and the worker will still try to upload the file.
    if (!this.isCancelled) {
      this.isInternalUploading = true;

      const uploadResult = await this.mcFusUpload.upload(uploadSettings);
      const stats: IUploadStats = {
        assetId: uploadResult.assetId,
        totalTimeInSeconds: uploadResult.totalTimeInSeconds,
        averageSpeedInMbps: uploadResult.averageSpeedInMbps,
      };

      return this.uploadComplete(stats);
    }
  }

  public uploadComplete = action((uploadStats: IUploadStats) => {
    if (!this.isCancelled) {
      this.uploadPercent = 100;
      this.uploadStatus = UploadStatus.UploadSuccessful;
      this.SecureFileId = uploadStats.assetId;

      this.fileUploadIsValid = true;
      this.isInternalUploading = false;
      this.onUploadSuccess();
    }
  });

  protected onCreateAssetFailed(error: Error): void {
    // noop
  }

  protected onUploadValidationFailed(): void {
    // noop
  }

  protected onUploadStarted(): void {
    // noop
  }

  protected abstract onUploadSuccess(): void;

  @action public clear() {
    this.file = undefined;
    this.errorMessage = undefined;
    this.uploadPercent = 0;
    this.uploadStatus = undefined;
    this.progressBarStatus = ProgressBarStatus.Default;
    this.fileUploadIsValid = false;
    this.isInternalUploading = false;
    this.isCancelled = false;
    this.internalSecureFileId = undefined;
  }

  public abstract validate(file: File): boolean;

  abstract get createAssetPath(): string;
}
