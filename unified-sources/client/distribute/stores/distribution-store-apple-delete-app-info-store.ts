import { DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore } from "@root/shared";
import { appStore } from "@root/stores";
import { apiGateway } from "@root/lib/http";
import { StoreUrls } from "../utils/constants";
import { FetchError } from "@root/lib/http/fetch-error";

export class DistributionStoreAppleDeleteAppInfoStore extends DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore<any> {
  public deleteAppleAppInfo(): Promise<any> {
    const deleteDataPromise = apiGateway
      .delete<any>(StoreUrls.AppleAppLevelInfo, {
        params: {
          app_name: appStore.name,
          owner_name: appStore.ownerName,
        },
      })
      .catch((error: FetchError) => {
        if (error && error.status === 404) {
          return null;
        }
        throw error;
      });

    return this.load(deleteDataPromise);
  }
}
