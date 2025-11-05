import { appStore } from "@root/stores";
import { apiGateway } from "@root/lib/http";
import { DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore, ExternalDataState } from "@root/shared";
import { Urls } from "../utils/constants";

export class DistributionGroupRemoveReleaseStore extends DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore<any> {
  constructor() {
    super(ExternalDataState.Loaded);
  }

  public removeRelease(distributionGroupName: string, releaseId: string): Promise<void> {
    return this.loadVoid(
      apiGateway.delete(Urls.ReleaseFromDistributionGroup, {
        params: {
          app_name: appStore.name,
          owner_name: appStore.ownerName,
          distribution_group_name: distributionGroupName,
          release_id: releaseId,
        },
      })
    );
  }
}
