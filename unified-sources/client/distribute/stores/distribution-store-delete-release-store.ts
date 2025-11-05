import { appStore } from "@root/stores";
import { apiGateway } from "@root/lib/http";
import { DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore, ExternalDataState } from "@root/shared";
import { StoreUrls } from "../utils/constants";

export class DistributionStoreDeleteReleaseStore extends DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore<any> {
  private deleteDataPromise!: Promise<any>;

  constructor() {
    super(ExternalDataState.Loaded);
  }

  public deleteRelease(distributionStoreName: string, releaseId: number): Promise<any> {
    this.deleteDataPromise = apiGateway.delete(StoreUrls.DistributionStoreRelease, {
      params: {
        app_name: appStore.name,
        owner_name: appStore.ownerName,
        distribution_store_name: distributionStoreName,
        package_id: releaseId.toString(),
      },
    });

    return this.load(this.deleteDataPromise);
  }
}
