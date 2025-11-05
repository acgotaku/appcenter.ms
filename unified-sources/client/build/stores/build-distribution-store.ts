import { action, observable, ObservableMap } from "mobx";
import { IApp } from "@lib/common-interfaces";

import { ciStore } from "./ci-store";
import { IAHBuild } from "@root/data/build";

interface BuildDistributionData {
  uploadId: string;
  startTimestamp: number;
}

/**
 * BuildLogsStore stores assocation from build to distribution
 */
export class BuildDistributionStore {
  private _app: IApp;

  @observable
  private _buildToUploadMap: ObservableMap<string, BuildDistributionData[]>;

  constructor(app: IApp) {
    this._app = app;

    this._buildToUploadMap = observable.map<string, BuildDistributionData[]>({});
  }

  @action
  public associateUpload(buildId: number, uploadId: string): void {
    if (!this._buildToUploadMap.has(String(buildId))) {
      this._buildToUploadMap.set(String(buildId), []);
    }

    const distributionArr: BuildDistributionData[] = this._buildToUploadMap.get(String(buildId)) || [];
    if (distributionArr.find((item) => item.uploadId === uploadId)) {
      return;
    }
    distributionArr.push({ uploadId: uploadId, startTimestamp: Date.now() });
  }

  public isBuildBeingDistributed(build: IAHBuild): boolean {
    if (!build) {
      return false;
    }
    const buildId = build.id;
    if (!this._buildToUploadMap.has(String(buildId))) {
      return false;
    }

    const repoStore = this._app.id && ciStore.getRepoStore(this._app.id);
    if (!repoStore) {
      return false;
    }
    const distributionArr: BuildDistributionData[] = this._buildToUploadMap.get(String(buildId)) || [];
    return distributionArr.some((item) => {
      const inProgress = repoStore.distributionUploadStore.isUploadInProgress(item.uploadId);
      return inProgress && item.startTimestamp >= Date.now() - 5 * 60 * 1000;
    });
  }
}
