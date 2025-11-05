import { ReleaseModel, ReleaseResponseType, Release } from "../models/release";
import { FetchStore } from "@root/data/lib";
import { ReleasesApi } from "@root/api/clients/releases/api";
import { appStore } from "@root/stores";

export interface UploadedReleaseParams {
  releaseId: string;
}

/**
 * This is intended to be used specifically by the Upload handlers
 * to retrieve the release that was just uploaded.
 */
export class UploadedReleaseFetchStore extends FetchStore<ReleaseModel, Release, UploadedReleaseParams> {
  protected async fetchData(params?: UploadedReleaseParams): Promise<Release> {
    const { app } = appStore;
    const releaseParams: ReleasesApi.GetLatestByUserReleasesParams = {
      ownerName: app.owner.name,
      appName: app.name || "",
      releaseId: params?.releaseId || "",
    };
    const retrievedRelease = await ReleasesApi.getLatestByUserReleases(releaseParams);
    return { kind: ReleaseResponseType.Full, ...retrievedRelease };
  }

  protected deserialize(data: Release): ReleaseModel {
    return new ReleaseModel({ downloadStats: { totalCount: 0, uniqueCount: 0 }, ...data });
  }

  public getGlobalCacheKey() {
    return appStore.app && appStore.app.id;
  }
}
