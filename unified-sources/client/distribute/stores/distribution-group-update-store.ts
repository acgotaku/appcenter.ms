import { action, observable } from "mobx";
import { appStore } from "@root/stores";
import { apiGateway } from "@root/lib/http";
import { DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore } from "@root/shared";
import { Urls } from "../utils/constants";
import { assign } from "lodash";

export class DistributionGroupUpdateStore extends DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore<any> {
  @observable public updateInProgress!: boolean;
  public updateDataPromise!: Promise<any>;

  @action
  public updateDistributionGroup(groupName: string, newGroupName: string, isPublic: boolean): Promise<void> {
    const body = {
      name: newGroupName,
    };
    assign(body, { is_public: isPublic });

    this.updateInProgress = true;
    this.updateDataPromise = apiGateway
      .patch(Urls.DistributionGroupPath, {
        params: {
          app_name: appStore.name,
          owner_name: appStore.ownerName,
          distribution_group_name: groupName,
        },
        body: body,
      })
      .finally(
        action(() => {
          this.updateInProgress = false;
        })
      );
    return this.loadVoid(this.updateDataPromise);
  }
}
