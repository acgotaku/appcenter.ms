import { action, observable } from "mobx";
import { appStore } from "@root/stores";
import { apiGateway } from "@root/lib/http";
import { DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore } from "@root/shared";
import { RESPONSE_TYPES } from "@lib/common-interfaces";
import { Urls } from "../utils/constants";

export class DistributionGroupDeleteStore extends DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore<any> {
  public deleteDataPromise!: Promise<any>;
  @observable public deletionInProgress!: boolean;

  @action
  public deleteDistributionGroup(groupName: string): Promise<void> {
    this.deletionInProgress = true;

    this.deleteDataPromise = apiGateway
      .delete(Urls.DistributionGroupPath, {
        params: {
          app_name: appStore.name,
          owner_name: appStore.ownerName,
          distribution_group_name: groupName,
        },
        responseType: RESPONSE_TYPES.TEXT,
      })
      .finally(
        action(() => {
          this.deletionInProgress = false;
        })
      );

    return this.loadVoid(this.deleteDataPromise);
  }
}
