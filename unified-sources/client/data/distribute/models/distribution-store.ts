import { IntuneDetails } from "./distribution-store-intune";
import { ApiDistributionStore } from "@root/api/clients/releases/api";

export interface DistributionStore {
  id: string;
  type?: ApiDistributionStore.ApiTypeEnum;
  name?: string;
  track?: string;
  intuneDetails?: IntuneDetails;
  serviceConnectionId?: string;
}

export function isGooglePlayStore(store: DistributionStore) {
  return store && store.type === "googleplay";
}

export function isIntuneStore(store: DistributionStore) {
  return store && store.type === "intune";
}

export function isAppleStore(store: DistributionStore) {
  return store && store.type === "apple";
}

export interface DistributionStoreRelease extends DistributionStore {
  isLatest?: boolean;
  publishingStatus?: string;
}
