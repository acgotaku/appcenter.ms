import { appStore, locationStore } from "@root/stores";
import { apiGateway } from "@root/lib/http";
import { DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore, SortOptions } from "@root/shared";
import { StoreUrls } from "../utils/constants";
import { observable, computed, action, IObservableArray, runInAction } from "mobx";
import { compareVersion, compareEntry } from "../utils/compare-version-helper";
import { PartialRelease } from "@root/data/distribute/models/partial-release";
import { distributionExternalStores } from "../stores/distribution-external-stores";
import { convertSnakeToCamelCase, caseConvertedAny } from "./convert-snake-to-camel-case";

const enum ReleasesTableColumns {
  Release = 0,
  Version,
  Date,
  DistributionStore,
}

export class StoreReleaseListStore extends DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore<PartialRelease[]> {
  private storeName: string;

  @observable public confirmDialogVisible: boolean = false;
  @observable public releaseToDelete!: PartialRelease;

  @observable public sort: SortOptions = {
    column: 0,
    descending: true,
  };

  constructor(storeName: string) {
    super();
    this.storeName = storeName;
  }

  @computed
  public get dataArray() {
    return this.data ? this.data.slice() : [];
  }

  @computed
  public get sortedReleases() {
    const multiplier = this.sort.descending ? -1 : 1;
    let result: number = 0;
    const appOs = appStore.app.os;
    return this.dataArray.sort((a, b) => {
      switch (this.sort.column) {
        case ReleasesTableColumns.Date:
          result = compareEntry(a.uploadedAt, b.uploadedAt);
          if (result === 0) {
            result = compareVersion(a, b, appOs);
          }
          break;
        default:
          result = compareVersion(a, b, appOs);
          if (result === 0) {
            result = compareEntry(a.uploadedAt, b.uploadedAt);
          }
      }
      return multiplier * result;
    });
  }

  @action
  public updateSort(sortBy: SortOptions) {
    this.sort = sortBy;
  }

  public fetchReleaseList() {
    if (this.storeName) {
      const storeName: string = this.storeName;
      const fetchDataPromise = apiGateway
        .get<caseConvertedAny>(StoreUrls.GetDistributionStoreReleases, {
          params: {
            app_id: appStore.name,
            owner_id: appStore.ownerName,
            distribution_store_name: storeName,
          },
        })
        .then((result) => {
          return convertSnakeToCamelCase<PartialRelease[]>(result);
        });

      if (this.data) {
        this.loadInBackgroundVoid(fetchDataPromise);
      } else {
        this.loadVoid(fetchDataPromise);
      }
    }
  }

  public removeRelease(release: PartialRelease): void {
    const deleteReleaseStore = distributionExternalStores.distributionStoreDeleteReleaseStore;
    const storeDetailsStore = distributionExternalStores.getDistributionStoreDetailsStore(this.storeName);
    deleteReleaseStore.deleteRelease(this.storeName, release.id).then(() => {
      storeDetailsStore.latestReleaseDetailsStore.fetchLatestStoreRelease();
      distributionExternalStores.recentReleasesListStore.fetchList(true);
      runInAction(() => {
        // At this point we know that the data has become and observable array. So just make the assumption explicit
        (this.data as IObservableArray<PartialRelease>).remove(release);
        locationStore.goUp();
      });
    });
  }

  @action public prepareDeletion(release: PartialRelease) {
    this.confirmDialogVisible = true;
    this.releaseToDelete = release;
  }

  @action public resetDeletion() {
    this.confirmDialogVisible = false;
    this.releaseToDelete = null as any;
  }
}
