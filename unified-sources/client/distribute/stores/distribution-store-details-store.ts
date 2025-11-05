import { LatestReleaseDetailsStore } from "./latest-release-details-store";
import { StoreReleaseListStore } from "./store-release-list-store";
import { distributionExternalStores } from "./distribution-external-stores";
import { DistributionStore } from "@root/data/distribute/models/distribution-store";
import { computed } from "mobx";

export class DistributionStoreDetailsStore {
  public latestReleaseDetailsStore: LatestReleaseDetailsStore;
  public storeReleaseListStore: StoreReleaseListStore;
  private _storeName: string;

  constructor(storeName: string) {
    this._storeName = storeName;
    this.latestReleaseDetailsStore = new LatestReleaseDetailsStore(this._storeName);
    this.storeReleaseListStore = new StoreReleaseListStore(this._storeName);
  }

  @computed
  public get data(): DistributionStore {
    return distributionExternalStores.distributionStoreListStore.dataArray.find((s) => s.name === this._storeName)!;
  }
}
