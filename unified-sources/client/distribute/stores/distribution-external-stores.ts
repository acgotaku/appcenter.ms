import * as memoize from "memoizee";
import { DistributionStoreListStore } from "./distribution-store-list-store";
import { DistributionStoreDeleteStore } from "./distribution-store-delete-store";
import { StoreRecentReleasesListStore } from "./store-recent-releases-list-store";
import { DistributionStoreDetailsStore } from "./distribution-store-details-store";
import { DistributionStoreDeleteReleaseStore } from "./distribution-store-delete-release-store";

export class DistributionExternalStores {
  public distributionStoreListStore = new DistributionStoreListStore();
  public distributionStoreDeleteStore = new DistributionStoreDeleteStore();
  public distributionStoreDeleteReleaseStore = new DistributionStoreDeleteReleaseStore();
  public recentReleasesListStore = new StoreRecentReleasesListStore();

  public getDistributionStoreDetailsStore = memoize(
    (storeName: string) => {
      return new DistributionStoreDetailsStore(storeName);
    },
    { max: 5 }
  );
}
export const distributionExternalStores = new DistributionExternalStores();
