//
// Common context object passed from the shell
// to the beacons.
//

// Import contextual stores.
import { userStore, UserStore } from "./user-store";
import { appStore, AppStore } from "./app-store";
import { browserStore, BrowserStore } from "./browser-store";
import { locationStore, LocationStore } from "./location-store";
import { layoutStore, LayoutStore } from "./layout-store";
import { loadingStore, LoadingStore } from "./loading-store";
import { organizationStore, OrganizationStore } from "./organization-store";
import { optimizelyStore, OptimizelyStore } from "@root/stores/optimizely-store";

// Needs explicit typing to generate a d.ts file for UI tests
const commonContextWrapper: {
  userStore: UserStore;
  appStore: AppStore;
  browserStore: BrowserStore;
  locationStore: LocationStore;
  loadingStore: LoadingStore;
  layoutStore: LayoutStore;
  organizationStore: OrganizationStore;
  optimizelyStore: OptimizelyStore;
} = {
  userStore,
  appStore,
  browserStore,
  locationStore,
  loadingStore,
  layoutStore,
  organizationStore,
  optimizelyStore,
};

// Used by UI tests
(window as any).commonContext = commonContextWrapper;
