import { FetchStore } from "@root/data/lib/fetch-store";
import { ReleasesApi, ApiBasicReleaseDetailsResponse } from "@root/api/clients/releases/api";
import { appStore } from "@root/stores/app-store";

class RecentReleasesFetchStore extends FetchStore<ApiBasicReleaseDetailsResponse[]> {
  protected fetchData(): Promise<ApiBasicReleaseDetailsResponse[]> {
    const { app } = appStore;
    const params: ReleasesApi.ListLatestReleasesParams = {
      ownerName: app.owner.name,
      appName: app.name || "",
    };

    return ReleasesApi.listLatestReleases(params);
  }

  protected deserialize(data: ApiBasicReleaseDetailsResponse[]): ApiBasicReleaseDetailsResponse[] {
    return data;
  }

  public getGlobalCacheKey() {
    return appStore.app && appStore.app.id;
  }
}

export const recentReleasesFetchStore = new RecentReleasesFetchStore();
