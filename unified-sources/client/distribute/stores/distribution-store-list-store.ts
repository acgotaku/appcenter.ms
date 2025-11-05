import { isEmpty } from "lodash";
import { observable, computed, action } from "mobx";
import { appStore } from "@root/stores";
import { apiGateway } from "@root/lib/http";
import { DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore } from "@root/shared";
import { DistributionStore } from "@root/data/distribute/models/distribution-store";
import { StoreUrls } from "../utils/constants";
import { convertSnakeToCamelCase, caseConvertedAny } from "./convert-snake-to-camel-case";

export class DistributionStoreListStore extends DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore<DistributionStore[]> {
  @observable public selectedStoreName!: string;
  @computed get selectedStore() {
    if (!isEmpty(this.data)) {
      return this.data!.find((o) => o.name === this.selectedStoreName);
    }
  }

  @computed get dataArray() {
    return this.data ? Array.from(this.data) : [];
  }

  @action
  public setSelectedStoreName(storeName: string) {
    this.selectedStoreName = storeName;
  }

  public hasDistributionStoreWithName(name: string): boolean {
    return !!this.dataArray.find((ds) => ds.name!.toLowerCase() === name.toLowerCase());
  }

  public fetchDistributionStoresList(background: boolean = true): Promise<void> {
    const fetchDataPromise = apiGateway
      .get<caseConvertedAny[]>(StoreUrls.AllStores, {
        params: {
          app_name: appStore.name,
          owner_name: appStore.ownerName,
        },
      })
      .then((result) => {
        return convertSnakeToCamelCase<DistributionStore[]>(result);
      });

    if (this.data && background) {
      return this.loadInBackgroundVoid(fetchDataPromise);
    } else {
      return this.loadVoid(fetchDataPromise);
    }
  }

  @action
  public updateDistributionStore(storeName: string, service_connection_id: string): Promise<any> {
    const body = {
      service_connection_id: service_connection_id,
    };
    return apiGateway.patch(StoreUrls.DistributionStorePath, {
      params: {
        app_name: appStore.name,
        owner_name: appStore.ownerName,
        distribution_store_name: storeName,
      },
      body: body,
    });
  }
}
