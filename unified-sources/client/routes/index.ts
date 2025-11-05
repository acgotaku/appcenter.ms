import { RouterState } from "react-router";
import { get } from "lodash";
import * as memoize from "memoizee";
import { locationStore } from "../stores/location-store";
import { BeaconName, BeaconRoute } from "@lib/common-interfaces";

interface BeaconRouteConfig {
  beacon: BeaconName;
  path: string;
  route: string;
  getPackage(cb: Function): void;
}

interface RouteFragment {
  sync: "component" | "childRoutes" | "indexRoute";
  async: "getComponent" | "getChildRoutes" | "getIndexRoute";
  required: boolean;
}

const MALFORMED_BEACON_MESSAGE =
  "Beacon exports are undefined or malformed. Please check if beacon `route` Object is exported and it contains `component` or `getComponent` and `childRoutes` or `getChildRoutes`";

function requireErrorHandler(err: Error) {
  return console.error("Please try refreshing the page!", "\n", err);
}

const routes: BeaconRouteConfig[] = [
  {
    beacon: "apps",
    path: "",
    route: "apps",
    getPackage: (cb) =>
      (require as any).ensure([], (require) => cb(require("@root/management").default), requireErrorHandler, "management"),
  },
  {
    beacon: "apps",
    path: "settings",
    route: "settings",
    getPackage: (cb) =>
      (require as any).ensure([], (require) => cb(require("@root/management").default), requireErrorHandler, "management"),
  },
  {
    beacon: "settings",
    path: locationStore.getParameterizedUrlWithApp("settings"),
    route: "appSettings",
    getPackage: (cb) =>
      (require as any).ensure([], (require) => cb(require("@root/management").default), requireErrorHandler, "management"),
  },
  {
    beacon: "overview",
    path: locationStore.getParameterizedUrlWithApp(""),
    route: "overview",
    getPackage: (cb) =>
      (require as any).ensure([], (require) => cb(require("@root/management").default), requireErrorHandler, "management"),
  },
  {
    beacon: "settings",
    path: "auth/aad/tenant/callback",
    route: "aadTenantLinking",
    getPackage: (cb) =>
      (require as any).ensure([], (require) => cb(require("@root/management").default), requireErrorHandler, "management"),
  },
  {
    beacon: "analytics",
    path: locationStore.getParameterizedUrlWithApp("analytics"),
    route: "analytics",
    getPackage: (cb) =>
      (require as any).ensure([], (require) => cb(require("@root/analytics").default), requireErrorHandler, "analytics"),
  },
  {
    beacon: "prototype",
    path: locationStore.getParameterizedUrlWithApp("beacon"),
    route: "beacon",
    getPackage: (cb) =>
      (require as any).ensure([], (require) => cb(require("@root/prototype").default), requireErrorHandler, "prototype"),
  },
  {
    beacon: "distribute",
    path: locationStore.getParameterizedUrlWithApp("distribute"),
    route: "distribute",
    getPackage: (cb) =>
      (require as any).ensure([], (require) => cb(require("@root/distribute").default), requireErrorHandler, "distribute"),
  },
  {
    beacon: "crashes",
    path: locationStore.getParameterizedUrlWithApp("crashes"),
    route: "crashes",
    getPackage: (cb) => (require as any).ensure([], (require) => cb(require("@root/crashes").default), requireErrorHandler, "crashes"),
  },
];

const setLoading = memoize((beacon: BeaconName, nextState: RouterState) => locationStore.setLoadingBeacon(beacon, nextState), {
  length: 1,
});

const loadBeaconRouteFragment = (config: BeaconRouteConfig, fragment: RouteFragment) => (nextState: RouterState, cb: Function) => {
  // Hack because `settings` beacon is actually part of the management beacon like `apps`,
  // but must use a different beacon name because it has its own nav item. I think we can remove
  // this hack as part of upgrading to react-router 4, if we ever do that.
  const beaconToSetLoading = config.beacon === "settings" ? "apps" : config.beacon;
  setLoading(beaconToSetLoading, nextState);
  config.getPackage((Beacon) => {
    if (locationStore.isCancelled(nextState)) {
      return;
    }

    const route = get<any>(Beacon, config.route, {});
    if (route[fragment.sync]) {
      cb(null, route[fragment.sync]);
    } else if (route[fragment.async]) {
      route[fragment.async](nextState, cb);
    } else if (fragment.required) {
      cb(new Error(MALFORMED_BEACON_MESSAGE));
    }

    return null;
  });
};

export const childRoutes: BeaconRoute[] = routes.map((r) => ({
  path: r.path,
  beacon: r.beacon,
  getComponent: loadBeaconRouteFragment(r, { sync: "component", async: "getComponent", required: true }),
  getChildRoutes: loadBeaconRouteFragment(r, { sync: "childRoutes", async: "getChildRoutes", required: true }),
  getIndexRoute: loadBeaconRouteFragment(r, { sync: "indexRoute", async: "getIndexRoute", required: false }),
}));
