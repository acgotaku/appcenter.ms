import { IHttpOptions } from "@lib/common-interfaces";

export enum ProgressBarStatus {
  Default,
  Indeterminate,
  Error,
}

export enum UploadStatus {
  UploadStarted,
  UploadFailedPost,
  UploadFailedBlocks,
  UploadFailedPatch,
  UploadFailed,
  UploadProcessing,
  UploadSuccessful,
}

export interface IDragDropUploadHandlerStore {
  uploadPercent: number;
  file?: File;
  errorMessage?: string;
  uploadStatus?: UploadStatus;
  progressBarStatus?: ProgressBarStatus;
  validExtensions?: string[];

  upload(file: any, requiredValidation?: boolean): void;
  reset?(): void;
  dispose?(): void;
  setProgressBarStatus?(progressBarStatus: ProgressBarStatus): void;

  initUpload?(file: any): void;
  beginUpload?(options?: IHttpOptions): Promise<void>;
}
