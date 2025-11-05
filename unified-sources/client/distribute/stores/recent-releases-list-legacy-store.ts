import { appStore } from "@root/stores";
import { apiGateway } from "@root/lib/http";
import { DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore } from "@root/shared";
import { PartialRelease } from "@root/data/distribute/models/partial-release";
import { Urls } from "../utils/constants";
import { convertSnakeToCamelCase, caseConvertedAny } from "./convert-snake-to-camel-case";

export class RecentReleasesListLegacyStore extends DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore<PartialRelease[]> {
  public fetchList(): Promise<void> {
    return this.loadVoid(
      apiGateway
        .get<caseConvertedAny>(Urls.GetRecentReleasesPath, {
          params: {
            app_id: appStore.name,
            owner_id: appStore.ownerName,
          },
        })
        .then((result) => {
          return convertSnakeToCamelCase<PartialRelease[]>(result);
        })
    );
  }
}
