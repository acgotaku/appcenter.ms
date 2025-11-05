import { action, observable } from "mobx";
import { appStore, locationStore } from "@root/stores";
import { apiGateway } from "@root/lib/http";
import { DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore, ExternalDataState } from "@root/shared";
import { RESPONSE_TYPES } from "@lib/common-interfaces";
import { distributionExternalStores } from "./distribution-external-stores";
import { DistributionStore } from "@root/data/distribute/models/distribution-store";
import { StoreUrls, StoreRoutes } from "../utils/constants";
import { DistributionStoreAppleDeleteAppInfoStore } from "./distribution-store-apple-delete-app-info-store";
import { ResponseHelper, StoresTelemetry } from "../utils";
import { assign } from "lodash";
import { ApiDistributionStore } from "@root/api/clients/releases/api";

export class DistributionStoreDeleteStore extends DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore<any> {
  public deleteDataPromise!: Promise<any>;
  @observable public confirmDialogVisible: boolean = false;
  @observable public storeToDelete!: DistributionStore;

  constructor() {
    super(ExternalDataState.Idle);
  }

  @action
  public deleteDistributionStore(storeName: string): Promise<any> {
    if (this.storeToDelete.type === "googleplay") {
      return this.load(this.deleteAllConnectedStores("googleplay"));
    } else if (this.storeToDelete.type === "apple") {
      const deleteAppleAppInfoStore: DistributionStoreAppleDeleteAppInfoStore = new DistributionStoreAppleDeleteAppInfoStore();
      return deleteAppleAppInfoStore.deleteAppleAppInfo().then(() => {
        return this.load(this.deleteAllConnectedStores("apple"));
      });
    } else {
      return this.load(this.deleteStore(storeName));
    }
  }

  public deleteAllConnectedStores(storeType: ApiDistributionStore.ApiTypeEnum): Promise<any> {
    const connectedStores: string[] = this.getConnectedStores(storeType);
    const deleteStoresPromises: Promise<any>[] = [];

    connectedStores.map((storeName) => {
      deleteStoresPromises.push(this.deleteStore(storeName));
    });

    return Promise.all(deleteStoresPromises).then(() => {
      return deleteStoresPromises[0];
    });
  }

  public getConnectedStores(storeType: ApiDistributionStore.ApiTypeEnum): string[] {
    // Getting only those connected stores to delete which are created and have Id
    const connectedStoreTypeStores: DistributionStore[] =
      distributionExternalStores.distributionStoreListStore.data!.filter((item) => item.type === storeType && item.id) || null;
    const connectedStores: string[] = [];

    if (connectedStoreTypeStores) {
      connectedStoreTypeStores.forEach((store) => connectedStores.push(store.name!));
    }
    return connectedStores;
  }

  public deleteStore(storeName: string): Promise<any> {
    this.deleteDataPromise = apiGateway.delete(StoreUrls.DistributionStorePath, {
      params: {
        app_name: appStore.name,
        owner_name: appStore.ownerName,
        distribution_store_name: storeName,
      },
      responseType: RESPONSE_TYPES.TEXT,
    });

    return this.deleteDataPromise;
  }

  @action public delete() {
    this.deleteDistributionStore(this.storeToDelete.name!)
      .then(
        action(() => {
          this.confirmDialogVisible = false;
          StoresTelemetry.track(`/stores/connections/deleted`, this.storeToDelete.type, this.storeToDelete.track, {
            result: "success",
          });

          distributionExternalStores.distributionStoreListStore.fetchDistributionStoresList();
          locationStore.pushWithCurrentApp(StoreRoutes.DistributionStores);
        })
      )
      .catch((error: any) => {
        let props = { result: "failed" };
        props = assign(props, ResponseHelper.extractResponse(error));
        StoresTelemetry.track(`/stores/connections/error-deleting`, this.storeToDelete.type, this.storeToDelete.track, props);
        return null;
      });
  }

  @action public prepareDeletion(store: DistributionStore) {
    this.confirmDialogVisible = true;
    this.storeToDelete = store;
  }

  @action public cancelDeletion() {
    this.confirmDialogVisible = false;
    this.storeToDelete = null as any;
  }
}
