import { computed, action, observable, runInAction } from "mobx";
import { unionBy, remove, groupBy } from "lodash";
import { IApp, OS } from "@lib/common-interfaces";
import { apiGateway } from "@root/lib/http";
import { logger } from "@root/lib/telemetry";
import { CIBaseStore } from "./ci-base-store";
import { IDistributionStore, isAppleStore, IDestination, StoreType, StoreTrack } from "@root/data/build";
import { ReleaseHelper } from "@root/build/utils/release-helper";
import { FetchError } from "@root/lib/http/fetch-error";
import { t } from "@root/lib/i18n";
import { expr } from "mobx-utils";
import { AppleDowntime } from "@root/distribute/utils/constants";

export interface AppleAppLevelInfo {
  app_id: string;
  apple_id: string;
  team_identifier: string;
  service_connection_id: string;
}

export class DistributionStoresStore extends CIBaseStore<IDistributionStore[]> {
  @observable private storeCreationError?: FetchError;

  constructor(app: IApp) {
    super(app);
  }

  @computed
  get grouppedStores(): IDistributionStore[] {
    if (this.isLoaded && this.data && this.app) {
      const groups = groupBy(this.data, (store) => store.type);
      let grouppedStores: IDistributionStore[] = [];
      switch (this.app.os) {
        case OS.ANDROID: {
          grouppedStores = grouppedStores.concat(groups.googleplay ? groups.googleplay.reverse() : []);
          break;
        }
        case OS.IOS: {
          if (groups.apple) {
            const appleProductionStores = groups.apple.filter((store) => store.track === StoreTrack.Production);
            const appleTestFlightStores = groups.apple.filter((store) => store.track !== StoreTrack.Production);
            grouppedStores = grouppedStores.concat(appleProductionStores, appleTestFlightStores);
          }
          break;
        }
        default: {
          // for now we support only iOS and Android
          return [];
        }
      }
      return grouppedStores.concat(groups.intune || []);
    }

    return [];
  }

  @action
  public releaseNotesMinLength(storeId: string): number | undefined {
    if (this.isLoaded) {
      const store = this.data && this.data.find((store) => store.id === storeId);
      if (store) {
        return expr(() => ReleaseHelper.getReleaseNotesMinLength(store));
      }
    }
  }

  @action
  public releaseNotesMaxLength(storeId: string): number | undefined {
    if (this.isLoaded) {
      const store = this.data && this.data.find((store) => store.id === storeId);
      if (store) {
        return expr(() => ReleaseHelper.getReleaseNotesMaxLength(store));
      }
    }
  }

  @action
  public fetch(background: boolean = false) {
    this.lastFetchTimestamp = Date.now();

    const path = this.getPathWithSlug("distribution_stores");
    const fetchPromise = apiGateway.get<IDistributionStore[]>(path).then((stores) => {
      const { appleStores, nonAppleStores } = stores.reduce(
        (data, store) => {
          if (isAppleStore(store)) {
            data.appleStores.push(store);
          } else {
            data.nonAppleStores.push(store);
          }
          return data;
        },
        {
          appleStores: [],
          nonAppleStores: [],
        } as { [key: string]: IDistributionStore[] }
      );

      // if there is no apple stores nothing is needed
      if (!appleStores || appleStores.length === 0) {
        return stores;
      }

      // performing stores sync
      return this.getAppleAppInfo()
        .then((appleAppInfo) => {
          // continue only if Apple app is mapped with MC app and has a valid service connection id.
          if (appleAppInfo && appleAppInfo.team_identifier && appleAppInfo.apple_id && appleAppInfo.service_connection_id) {
            // fetch external TestFlight groups
            return this.getAllTestFlightGroups().then<IDistributionStore[]>((groups) => {
              // convert groups to stores
              const groupStores = groups.map((group) => {
                return {
                  id: group.id,
                  name: group.name,
                  track: StoreTrack.TestFlightExternal,
                  service_connection_id: appleAppInfo.service_connection_id,
                  type: StoreType.AppleStore.toLowerCase(),
                  external: true, // mark this group as external, to be able to create store in distribution
                } as IDistributionStore;
              });

              // use production and itunes connect stores
              let newStoresList: IDistributionStore[] = stores.filter(
                (store) =>
                  store.name === "Production" || store.name === "iTunes Connect users" || store.name === "App Store Connect Users"
              );

              // merge groups and srores. if it not exist in appleStores, it will be checked with external = true and then created before branch config saving
              const allAppleStores = unionBy(appleStores, groupStores, "name");
              //  getting only existing stores (actual deletion from distribution service perfomed in Distribution beacon)
              const allFinalGroups = remove(allAppleStores, (group) => groupStores.some((s) => s.name === group.name));

              newStoresList = newStoresList.concat(allFinalGroups).concat(nonAppleStores);
              return newStoresList;
            });
          } else {
            return stores;
          }
        })
        .catch((error: any) => {
          // not throwing as any error in case there is any error returned from api
          return stores;
        });
    });

    if (background) {
      this.loadInBackgroundVoid(fetchPromise);
    } else {
      this.loadVoid(fetchPromise);
    }
  }

  private getAllTestFlightGroups(): Promise<IDestination[]> {
    return apiGateway.get<IDestination[]>(this.getPathWithSlug("apple_test_flight_groups"));
  }

  private getAppleAppInfo(): Promise<AppleAppLevelInfo | null> {
    return apiGateway.get<AppleAppLevelInfo>(this.getPathWithSlug("apple_mapping")).catch((error: any) => {
      // not throwing as any error in case there is any error returned from api
      return Promise.resolve(null);
    });
  }

  public refreshOptimistically() {
    const fetchDelta = this.lastFetchToNow();
    if (fetchDelta === undefined || fetchDelta > 60 * 1000 || this.isFailed) {
      this.fetch(this.isLoaded);
    }
  }

  public createStoreIfNotExists(distributionStoreId: string): Promise<IDistributionStore | null> {
    if (this.isLoaded) {
      const store = this.data && this.data.find((store) => store.id === distributionStoreId);
      if (store && isAppleStore(store) && store.external) {
        return apiGateway
          .post<IDistributionStore>(this.getPathWithSlug("distribution_stores"), {
            body: {
              name: store.name,
              type: StoreType.AppleStore.toLowerCase(),
              track: store.track,
              service_connection_id: store.service_connection_id,
            },
          })
          .then((createdStore) => {
            logger.info(`Ending Creation of apple store for track ${createdStore.track} with storeId : ${createdStore.id}`, {
              result: "succeed",
              source: "build-configuration",
            });
            return createdStore;
          })
          .catch((error) => {
            logger.warn(`Failed to create apple store for track ${store.track}`, error, {
              result: "failed",
              source: "build-configuration",
              message: error.message,
            });
            runInAction(() => {
              this.storeCreationError = error;
            });
            throw error;
          });
      } else {
        return Promise.resolve(store || null);
      }
    }

    return Promise.resolve(null);
  }

  @computed get errorNotification(): string | void {
    if (this.storeCreationError) {
      switch (this.storeCreationError.status) {
        case 400:
          return t("build:distribute.storeCreationErrors.appleStoreCredentialsInvalid");
        case 409:
          return t("build:distribute.storeCreationErrors.appleStoreCreateDuplicate");
        default:
          return t("build:distribute.storeCreationErrors.unhandledError");
      }
    }
  }

  public isAppleServiceDowntimeActive(storeId: string) {
    if (this.isLoaded) {
      const store = this.data && this.data.find((store) => store.id === storeId);
      if (store && isAppleStore(store)) {
        const currentDate: Date = new Date();
        const appleDowntimeStartDate: Date = AppleDowntime.StartDate;
        const appleDowntimeEndDate: Date = AppleDowntime.EndDate;
        return currentDate.getTime() >= appleDowntimeStartDate.getTime() && currentDate.getTime() < appleDowntimeEndDate.getTime();
      } else {
        return false;
      }
    }
    return false;
  }

  public isAppleServiceDowntimeCompleted(storeId: string) {
    if (this.isLoaded) {
      const store = this.data && this.data.find((store) => store.id === storeId);
      if (store && isAppleStore(store)) {
        const currentDate: Date = new Date();
        const appleDowntimeEndDate: Date = AppleDowntime.EndDate;
        return currentDate.getTime() >= appleDowntimeEndDate.getTime();
      } else {
        return true;
      }
    }
    return true;
  }

  @action
  public resetError() {
    this.storeCreationError = undefined;
  }
}
