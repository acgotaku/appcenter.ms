import { action, IReactionDisposer, reaction } from "mobx";
import { MessageLevel, IProgress } from "appcenter-file-upload-client";
import { App } from "@root/data/shell/models";
import { OS } from "../models/os";
import { Urls } from "@root/data/distribute/constants";
import { apiGateway } from "@root/lib/http";
import { UploadStatus, ProgressBarStatus } from "@root/lib/drag-drop-upload";
import { t } from "@root/lib/i18n";
import { Release } from "../models/release";
import { ApiDestination, ReleasesApi } from "@root/api/clients/releases/api";
import { UploadedReleaseFetchStore } from "@root/data/distribute/stores/uploaded-release-fetch-store";
import { FileUploadStore, IFileUploadServiceDetails, IUploadStats } from "@root/lib/file-upload-service";
import { metrics, logger, LogProperties } from "@root/lib/telemetry";
import { IHttpOptions } from "@lib/common-interfaces";
import { McFusUploader } from "@appcenter/mc-fus-uploader";

export enum ReleaseUploadStatus {
  UploadFinished = "uploadFinished",
}

export interface GetUploadResponse {
  id: string;
  upload_url: string;
  upload_status: string;
  release_distinct_id?: string;
  error_details?: string;
}

export enum GetReleaseResponse {
  UploadStarted = "uploadStarted",
  UploadFinished = "uploadFinished",
  ReadyToBePublished = "readyToBePublished",
  MalwareDetected = "malwareDetected",
  Error = "error",
}

export interface NewReleaseUploadCallbacks {
  onUploadStarted(): void;
  onUploadFinished(response: Release): void;
  onUploadFailed(message: any): void;
  onGetUploadUrlFinished(response: any): void;
  onGetUploadUrlFailed(response: any): void;
}

export class NewReleaseUpload extends FileUploadStore {
  private mcFusUploader?: any;
  private releaseUploadId: string = "";
  private uploadedReleaseFetchStore: UploadedReleaseFetchStore;
  private releaseFetchedReaction: IReactionDisposer;
  private releaseFetchErrorReaction: IReactionDisposer;

  constructor(
    private app: App,
    private callbacks: NewReleaseUploadCallbacks,
    private destinationType?: ApiDestination.ApiDestinationTypeEnum
  ) {
    super();
    this.validExtensions = OS.packageExtensions(this.app.os, this.destinationType);
    this.uploadedReleaseFetchStore = new UploadedReleaseFetchStore();

    this.releaseFetchedReaction = reaction(
      () => this.uploadedReleaseFetchStore.data,
      (release) => {
        if (release) {
          this.releaseCreated(release);
        }
      }
    );

    this.releaseFetchErrorReaction = reaction(
      () => this.uploadedReleaseFetchStore.fetchError,
      (error) => {
        if (error) {
          this.raiseUploadError(error.message);
        }
      }
    );
  }

  public dispose() {
    this.releaseFetchedReaction();
    this.releaseFetchErrorReaction();
  }

  public validate(file: File): boolean {
    const filename: string = file.name;
    for (const validExtension of this.validExtensions!) {
      if (filename.toLowerCase().endsWith(validExtension)) {
        return true;
      }
    }
    this.errorMessage = this.validationErrorMessage;
    return false;
  }
  // the path for uploading the release
  public get createAssetPath(): string {
    return `/v0.1/apps/${this.app.owner.name}/${this.app.name}/uploads/releases`;
  }

  @action protected onUploadSuccess(): Promise<void> {
    if (!this.fileUploadServiceDetails) {
      this.raiseUploadError();
      return Promise.resolve();
    }

    return this.patchUpload(this.releaseUploadId, ReleaseUploadStatus.UploadFinished)
      .then(() => {
        return this.processUpload(this.releaseUploadId);
      })
      .catch((err) => {
        this.raiseUploadError();
        return Promise.resolve();
      });
  }

  @action
  public initUpload(file: File): void {
    this.clear();
    this.file = file;

    if (!this.validate(file)) {
      this.uploadStatus = UploadStatus.UploadFailed;
      this.progressBarStatus = ProgressBarStatus.Error;
      this.onUploadValidationFailed();
    }
  }

  @action public upload(file: File) {
    if (file) {
      this.initUpload(file);
      if (this.uploadStatus === UploadStatus.UploadFailed) {
        return;
      }
    }

    this.beginUpload();
  }

  @action public beginUpload(options?: IHttpOptions): Promise<void> {
    this.uploadStatus = UploadStatus.UploadStarted;
    this.progressBarStatus = ProgressBarStatus.Indeterminate;

    this.onUploadStarted();

    const createReleaseUploadParams: ReleasesApi.CreateReleaseUploadReleasesParams = {
      ownerName: this.app.owner.name,
      appName: this.app.name || "",
    };

    return ReleasesApi.createReleaseUploadReleases(createReleaseUploadParams, options ? options.body : undefined, options)
      .then((result) => {
        this.releaseUploadId = result.id;
        const fileDetails: IFileUploadServiceDetails = {
          id: result.packageAssetId,
          location: "",
          token: result.token,
          uploadDomain: result.uploadDomain,
          upload_domain: result.uploadDomain,
          uploadWindowLocation: "",
          urlEncodedToken: result.urlEncodedToken,
        };
        return this.onCreateAssetComplete(fileDetails);
      })
      .catch((err: Error) => {
        this.onCreateAssetFailed(err);
        this.raiseUploadError(err.message);
      });
  }

  @action public async onCreateAssetComplete(fileDetails: IFileUploadServiceDetails): Promise<void> {
    return new Promise<void>((resolve) => {
      this.callbacks.onGetUploadUrlFinished(fileDetails);

      this.fileUploadServiceDetails = fileDetails;

      // Cancel may be missed and the worker will still try to upload the file.
      if (!this.isCancelled) {
        this.isInternalUploading = true;
        const uploadSettings: any = {
          AssetId: fileDetails.id,
          UrlEncodedToken: fileDetails.urlEncodedToken,
          UploadDomain: fileDetails.uploadDomain || fileDetails.upload_domain,
          Tenant: "distribution",
          onProgressChanged: this.uploadProgress,
          onMessage: (message: string, properties: LogProperties, messageLevel: MessageLevel) => {
            this.onMessage(message, messageLevel);
            // The logging message can include custom error codes and other useful debugging information.
            message = properties.VerboseMessage ? (properties.VerboseMessage as string) : message;
            if (messageLevel === MessageLevel.Error) {
              logger.error(message, undefined, properties);
            } else if (messageLevel === MessageLevel.Information) {
              logger.info(message, properties);
            }
          },
          onStateChanged: this.onStateChanged,
          onCompleted: (stats) => {
            resolve(this.uploadComplete(stats));
          },
        };

        this.mcFusUploader = new McFusUploader(uploadSettings);
        this.mcFusUploader.Start(this.file);
      }
    });
  }

  @action public reset() {
    // only when an upload is in progress we need to cancel
    if (this.mcFusUploader && this.isInternalUploading === true) {
      this.mcFusUploader.Cancel();
    } else {
      this.clear();
      this.isCancelled = true;
    }
  }

  @action private async patchUpload(assetId: string, uploadStatus: ReleaseUploadStatus) {
    const options = {
      params: {
        app_id: this.app.name,
        owner_id: this.app.owner.name,
        upload_id: assetId,
      },
      body: { upload_status: uploadStatus },
    };

    await apiGateway.patch(Urls.UploadReleaseWithIdPath, options);
  }

  @action private async processUpload(uploadId: string): Promise<void> {
    const releaseId = await this.loadReleaseId(uploadId);
    if (!releaseId) {
      return;
    }
    await this.uploadedReleaseFetchStore.fetch({ releaseId: releaseId.toString() });
    return;
  }

  @action private async loadReleaseId(uploadId: string): Promise<number | undefined> {
    const options = {
      params: {
        owner_id: this.app.owner.name,
        app_id: this.app.name,
        upload_id: uploadId,
      },
    };

    while (!this.isCancelled) {
      let result: GetUploadResponse;

      try {
        result = await apiGateway.get<GetUploadResponse>(Urls.UploadReleaseWithIdPath, options);
      } catch (error: any) {
        this.raiseUploadError(error.message);
        return undefined;
      }

      if (result.upload_status === GetReleaseResponse.ReadyToBePublished && result.release_distinct_id) {
        return Number(result.release_distinct_id);
      } else if (result.upload_status === GetReleaseResponse.Error) {
        this.raiseUploadError(result.error_details);
        return undefined;
      }

      await Promise.delay(1000);
    }
  }

  @action private async releaseCreated(release: Release): Promise<void> {
    this.uploadStatus = UploadStatus.UploadSuccessful;
    this.progressBarStatus = ProgressBarStatus.Default;

    if (this.callbacks.onUploadFinished) {
      this.callbacks.onUploadFinished(release);
    }
  }

  public uploadComplete = action(
    (uploadStats: IUploadStats): Promise<void> => {
      if (!this.isCancelled) {
        this.SecureFileId = uploadStats.assetId;
        this.fileUploadIsValid = true;
        this.isInternalUploading = false;

        metrics.emitMetric("release-upload-total-time", uploadStats.totalTimeInSeconds);
        metrics.emitMetric("release-upload-average-speed", uploadStats.averageSpeedInMbps);

        return this.onUploadSuccess();
      }

      return Promise.resolve();
    }
  );

  protected onCreateAssetFailed(error: Error) {
    this.callbacks.onGetUploadUrlFailed(error);
  }

  public uploadProgress = action((progress: IProgress) => {
    this.uploadPercent = progress.percentCompleted;

    if (progress.percentCompleted > 0) {
      this.progressBarStatus = ProgressBarStatus.Default;
    }

    if (progress.percentCompleted >= 100) {
      this.progressBarStatus = ProgressBarStatus.Indeterminate;
    }
  });

  @action protected onUploadStarted() {
    this.callbacks.onUploadStarted();
    this.progressBarStatus = ProgressBarStatus.Default;
  }

  protected onUploadValidationFailed() {
    const uploadFailedResponse = {
      message: "File failed validation",
      isFileTypeValidation: true,
      fileExtension: this.getFileExtension(this.fileName),
    };
    this.callbacks.onUploadFailed(uploadFailedResponse);
  }

  @action private raiseUploadError(errorMessage?: string) {
    const error = errorMessage ? errorMessage : t("distribute:releaseUpload.uploadFailed");
    this.onMessage(error, MessageLevel.Error);
    this.callbacks.onUploadFailed(error);
  }

  private get validationErrorMessage(): string {
    return t("distribute:releaseUpload.badFileType", { fileType: this.getFileExtension(this.fileName) });
  }

  private getFileExtension(fileName: string | undefined) {
    if (!fileName) {
      return "";
    }
    const namePieces = fileName.split(".");
    let extension = namePieces[namePieces.length - 1];
    if (extension === "zip" && namePieces.length > 2) {
      if (namePieces[namePieces.length - 2] === "app") {
        extension = "app.zip";
      }
    }
    return `.${extension}`;
  }
}
