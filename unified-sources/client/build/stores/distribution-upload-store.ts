import { action, observable, ObservableMap } from "mobx";
import { ReleaseDestinationWithType } from "@root/data/build";

export interface IUploadData {
  status: string;
  buildId: number;
  branch: string;
  destinations?: ReleaseDestinationWithType[];
}
/**
 * ProjectsStore fetches and stores the projects for a given app
 */
export class DistributionUploadStore {
  @observable
  private _uploadsMap: ObservableMap<string, IUploadData> = observable.map<string, IUploadData>({});

  @action
  public addUpload(
    uploadId: string,
    status: string,
    buildId: number,
    branch: string,
    destinations?: ReleaseDestinationWithType[]
  ): void {
    this._uploadsMap.set(uploadId, { status: status, buildId: buildId, branch: branch, destinations: destinations });
  }

  public getUploadData(uploadId: string): IUploadData | undefined {
    if (!this._uploadsMap.has(uploadId)) {
      return;
    }

    return this._uploadsMap.get(uploadId);
  }

  @action
  public updateUploadStatus(uploadId: string, status: string): boolean {
    if (!this._uploadsMap.has(uploadId)) {
      return false;
    }

    const uploadData: IUploadData | undefined = this._uploadsMap.get(uploadId);

    if (uploadData) {
      uploadData.status = status;
    }

    return true;
  }

  public isUploadInProgress(uploadId: string): boolean {
    const uploadData = this.getUploadData(uploadId);
    if (!uploadData) {
      return false;
    }

    return uploadData.status === "started";
  }
}
