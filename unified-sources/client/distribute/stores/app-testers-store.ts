import { Urls } from "../utils/constants";
import { DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore } from "@root/shared";
import { IUser } from "@lib/common-interfaces";
import { appStore } from "@root/stores";
import { apiGateway } from "@root/lib/http";

export class AppTestersStore extends DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore<IUser[]> {
  public fetchAppTesters(): Promise<IUser[]> {
    const fetchDataPromise = apiGateway.get<IUser[]>(Urls.GetTestersPath, {
      params: {
        app_id: appStore.name,
        owner_id: appStore.ownerName,
      },
    });

    return this.load(fetchDataPromise);
  }
}
