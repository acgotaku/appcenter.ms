import { appStore } from "@root/stores";
import { apiGateway } from "@root/lib/http";
import { DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore } from "@root/shared";
import { PartialRelease } from "@root/data/distribute/models/partial-release";
import { StoreUrls } from "../utils/constants";
import { convertSnakeToCamelCase, caseConvertedAny } from "./convert-snake-to-camel-case";

export class StoreRecentReleasesListStore extends DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore<PartialRelease[]> {
  private fetchDataPromise!: Promise<PartialRelease[]>;

  public fetchList(forceReload: boolean): Promise<void> {
    if (this.fetchDataPromise && !forceReload) {
      return this.fetchDataPromise.then<void>();
    }

    this.fetchDataPromise = apiGateway
      .get<caseConvertedAny>(StoreUrls.GetRecentReleasesPath, {
        params: {
          app_id: appStore.name,
          owner_id: appStore.ownerName,
        },
      })
      .then((result) => {
        return convertSnakeToCamelCase<PartialRelease[]>(result);
      });

    return this.loadVoid(this.fetchDataPromise);
  }
}
