import { appStore } from "@root/stores";
import { apiGateway } from "@root/lib/http";
import { DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore, ExternalDataState } from "@root/shared";
import { Urls } from "../utils/constants";

export class ReleaseDeleteStore extends DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore<any> {
  public deleteDataPromise!: Promise<any>;

  constructor() {
    super(ExternalDataState.Loaded);
  }

  public deleteRelease(releaseId: number): Promise<any> {
    this.deleteDataPromise = apiGateway.delete(Urls.ReleasePath, {
      params: {
        app_name: appStore.name,
        owner_name: appStore.ownerName,
        release_id: releaseId.toString(),
      },
    });

    return this.load(this.deleteDataPromise);
  }
}
