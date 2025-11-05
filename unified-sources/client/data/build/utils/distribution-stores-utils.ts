import { IDistributionStore, StoreType } from "../models/types";

const checkStoreType = (store: IDistributionStore, type: StoreType): boolean =>
  store && store.type && store.type.toLowerCase() === type.toLowerCase();

export const isGooglePlayStore = (store: IDistributionStore) => checkStoreType(store, StoreType.GooglePlay);

export const isIntuneStore = (store: IDistributionStore) => checkStoreType(store, StoreType.Intune);

export const isAppleStore = (store: IDistributionStore) => checkStoreType(store, StoreType.AppleStore);

export enum DistributionStoreNames {
  GooglePlayTitle = "Google Play",
  IntuneTitle = "Intune Company Portal",
  AppleStoreTitle = "App Store",
  AppleTestFlightStoreTitle = "TestFlight",
  ITunesConnectTitle = "App Store Connect",
  DefaultStoreTitle = "Store",
}
