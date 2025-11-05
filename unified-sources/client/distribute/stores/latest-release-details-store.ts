import { appStore } from "@root/stores";
import { apiGateway } from "@root/lib/http";
import { Release } from "../models/release";
import { ReleaseCountsLegacyStore } from "./release-counts-legacy-store";
import { DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore } from "@root/shared";

import { Urls, StoreUrls } from "../utils/constants";
import { convertSnakeToCamelCase, caseConvertedAny } from "./convert-snake-to-camel-case";

export class LatestReleaseDetailsStore extends DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore<Release> {
  // Latest Release Store is currently being used in the Releases client code because it
  // can't be replaced until we replace the distribution group stores with non-external data stores.

  private destinationName: string;
  private releaseCountsLegacyStore = new ReleaseCountsLegacyStore();

  constructor(destinationName: string) {
    super();
    this.destinationName = destinationName;
  }

  /**
   * @deprecated
   * This functionality and store will need to be replaced once the distribution groups stores are no longer external data stores.
   */
  public fetchLatestRelease() {
    const fetchDataPromise = apiGateway
      .get<caseConvertedAny>(Urls.GetLatestReleaseForDistributionGroupPath, {
        params: {
          app_id: appStore.name,
          owner_id: appStore.ownerName,
          distribution_group_name: this.destinationName,
        },
      })
      .then((result) => {
        return convertSnakeToCamelCase<Release>(result);
      })
      .catch((error: any) => {
        if (error && error.status === 404) {
          return null;
        }
        throw error;
      });

    const promise = this.releaseCountsLegacyStore.oldJoinReleaseDepricated(fetchDataPromise);

    if (this.data || this.data === null) {
      // `null` is empty, `undefined` is not yet fetched
      this.loadInBackgroundVoid(promise);
    } else {
      this.loadVoid(promise);
    }
  }

  /**
   * @deprecated
   * This functionality and store will need to be replaced once the distribution groups stores are no longer external data stores.
   */
  public fetchLatestStoreRelease() {
    if (this.destinationName) {
      const fetchDataPromise = apiGateway
        .get<caseConvertedAny>(StoreUrls.GetDistributionStoreLatestRelease, {
          params: {
            app_id: appStore.name,
            owner_id: appStore.ownerName,
            distribution_store_name: this.destinationName,
          },
        })
        .then((result) => {
          return convertSnakeToCamelCase<Release>(result);
        })
        .catch((error: any) => {
          if (error && error.status === 404) {
            return null;
          }
          throw error;
        });

      if (this.data || this.data === null) {
        this.loadInBackgroundVoid(fetchDataPromise);
      } else {
        this.loadVoid(fetchDataPromise);
      }
    }
  }
}
