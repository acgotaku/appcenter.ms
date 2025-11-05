import * as memoize from "memoizee";
import { StorageManager } from "@root/lib/utils/storage-manager";
import { userStore } from "@root/stores/user-store";
import { locationStore } from "@root/stores/location-store";
import { BeaconName } from "@lib/common-interfaces";

// Expose a 'memoized' function to get a storage manager for the current beacon.
const memoizedGetStorageManager = memoize((userId: string, beaconName: string) => new StorageManager(userId, beaconName));
export const getStorageManager = (isBeaconAgnostic?: boolean) =>
  memoizedGetStorageManager(userStore.currentUser.id || "", isBeaconAgnostic ? "all-beacons" : locationStore.beacon || "");
export const getStorageManagerForBeacon = (beaconName: BeaconName) =>
  memoizedGetStorageManager(userStore.currentUser.id || "", beaconName);
