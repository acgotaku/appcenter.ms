import * as memoize from "memoizee";
import { appStore } from "@root/stores";
import { ReleaseDetailsLegacyStore } from "./release-details-legacy-store";
import { ReleaseListUIStore } from "./release-list-ui-store";
import { DistributionGroupListStore } from "./distribution-group-list-store";
import { DistributionGroupDetailsStore } from "./distribution-group-details-store";
import { RecentReleasesListLegacyStore } from "./recent-releases-list-legacy-store";
import { AppTestersStore } from "./app-testers-store";
import { IApp } from "@lib/common-interfaces";

export type memoized<T> = T & {
  delete(key: any): void;
};

/**
 * @deprecated This gathering of stores should be considered deprecated. New work should strongly consider
 * adopting the new data layer instead.
 */
export class DistributionStores {
  // shared
  public releaseDetailsLegacyStore = new ReleaseDetailsLegacyStore();

  // distribution group
  public appTestersStore = new AppTestersStore();
  public recentReleasesListLegacyStore = new RecentReleasesListLegacyStore();
  public getDistributionGroupListStore: memoized<(app: IApp) => DistributionGroupListStore> = memoize(
    (app: IApp) => new DistributionGroupListStore(app),
    { max: 5 }
  );
  private distributionGroupDetailsStoreMemoized = memoize(
    (app: IApp, groupName: string) => new DistributionGroupDetailsStore(groupName),
    { max: 20 }
  );

  // releases
  public releaseListUIStore = new ReleaseListUIStore(null as any, this);

  public getDistributionGroupDetailsStore(groupName: string) {
    return this.distributionGroupDetailsStoreMemoized(appStore.app, groupName);
  }

  public deleteDistributionGroupDetailsStore(groupName: string) {
    return this.distributionGroupDetailsStoreMemoized.delete(appStore.app, groupName);
  }
}

/**
 * @deprecated This gathering of stores should be considered deprecated. New work should strongly consider
 * adopting the new data layer instead.
 */
export const distributionStores = new DistributionStores();
