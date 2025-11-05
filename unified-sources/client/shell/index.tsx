import { optimizelyUpdater } from "@root/lib/optimizely";

declare const window: any;
declare const require: any;

import * as Sentry from "@sentry/react";
import "../global-config";

/* tslint:disable */
import * as React from "react";
/* tslint:enable */
import * as ReactDOM from "react-dom";
import { Router, RouterState, RedirectFunction, browserHistory, PlainRoute } from "react-router";
import { Shell } from "./shell";
import { childRoutes } from "../routes";
import { appStore, locationStore, notFoundStore, globalUIStore, userStore } from "@root/stores";
import { telemetry } from "../lib/telemetry";
import { config } from "../lib/utils/config";
import i18n from "../lib/i18n/i18n";
import i18next from "i18next";
import { PageNotFound } from "./page-not-found/page-not-found";
import { I18nextProvider } from "react-i18next";
import { isNewVersionAvailable } from "@root/lib/utils/new-version-checker";
import { LocationListener } from "history";

const environments = require("../../environments");

const ENV = config.getEnv();

// Set user context for telemetry
telemetry.setUser(userStore.currentUser);

let lastHref = window.location.pathname + window.location.search;
const hardNavigateOnNewVersionAvailable: LocationListener = (newLocation) => {
  // If a new version is available, do a hard navigation instead of a router update so the user
  // gets the new code. Comparing to current route is a fail-safe for if new-version-checker goes
  // horribly wrong and repeatedly tells us there’s a new version available on first page load;
  // this keeps us from ever having an infinite reload loop.
  const nextHref = newLocation.pathname + newLocation.search;
  if (isNewVersionAvailable() && lastHref !== nextHref) {
    // The new route will actually render faster than the hard navigation occurs, which looks weird,
    // so basically hiding everything while reloading is less jarring. TODO: talk to Design;
    // should we show a loading indicator instead or nah?
    document.body.style.visibility = "hidden";
    window.location = nextHref;
  }
  lastHref = nextHref;
};
browserHistory.listen(hardNavigateOnNewVersionAvailable);

/**
 * Set current app in appStore.
 * We used to do this in the route’s `onChange`, but child routes got processed
 * before the app store actually updated. Doing it here ensures that beacons can
 * always assume that `appStore.app` is set.
 */
const updateAppStoreFromLocation: LocationListener = (location) => {
  const { ownerType, ownerName, appName } = locationStore.parse(location.pathname);

  appStore.setAppOnRouteChange(ownerType, ownerName, appName);
};

browserHistory.listen(updateAppStoreFromLocation);
updateAppStoreFromLocation(window.location);

/**
 * Setup the telemetry context.
 * Need to save the AppStore context because http and appStore has a circular dependency
 */
telemetry.setAppStoreContext(appStore);

/**
 * Page not found (default route)
 */
const defaultRoute = {
  path: "*",
  component: PageNotFound,
};

/**
 * Don't mount specifically ignored paths to the router if we're in PROD env.
 */
const childrenRoutes =
  ENV === environments.PROD
    ? childRoutes.filter((route: PlainRoute) => {
        const rootPath = (route.path?.split("/") || []).slice(-1)[0] || "";
        return config.getRootPathsNotInNav().indexOf(rootPath) === -1;
      })
    : childRoutes;

/**
 * Operations to be performed on route updates
 */
const onRouteUpdate = (nextState: RouterState, prevState?: RouterState) => {
  // if the new amount of routes (basically subdirs) is higher, that means we are going to a new page, so we want to save the focus of the button/link that is taking us there
  if (prevState && nextState.routes.length > prevState.routes.length) {
    globalUIStore.setFocusReturnElement(document.activeElement);
  } else if (prevState && nextState.routes.length < prevState.routes.length) {
    // if the amount of routers/subdirs is lower, we are returning/navigation back, so we want to restore focus to the button/link that got us to the page/modal/place from which we are returning
    //setTimeout(() => globalUIStore.returnFocus(), 100);
  }
  // if the number stays the same, then don't do anything, because it means we just changed subdirectory and so we don't wanna manage focus in this case, the Autofocus component will handle that

  locationStore.setRouterState(nextState);
  if (locationStore.hasAppContextInRoute && !appStore.app) {
    notFoundStore.notify404();
  }
  telemetry.setPathContext(nextState.location.pathname);
};

/**
 * The root route of the application.
 */
const rootRoute = {
  path: "/",
  component: Shell,

  // The route which is loaded by default by the router for the given path.
  indexRoute: { onEnter: (nextState: any, replace: any) => replace("/apps") },

  childRoutes: childrenRoutes,

  // Called once when the route is entered. Necessary to handle the `first` time any route is loaded/deep linked.
  onEnter: (nextState: RouterState, replace: RedirectFunction, cb: Function | undefined) => {
    onRouteUpdate(nextState);
    if (cb) {
      cb();
    }
  },

  // Called when a route changes each time.
  onChange: (prevState: RouterState, nextState: RouterState, replace: RedirectFunction, cb: Function | undefined) => {
    onRouteUpdate(nextState, prevState);
    if (cb) {
      cb();
    }
  },
};

/**
 * Add a way to change the current language
 */
if (process.env.NODE_ENV !== "production") {
  if (typeof window.mc === "undefined") {
    window.mc = {};
  }

  window.mc.changeLanguage = (lang: string) => {
    i18next.changeLanguage(lang, (err) => {
      if (err) {
        return console.log("Unable to change the language", err);
      }
      console.log(`Language changed to "${lang}".`);
    });
  };

  window.mc.resetLanguage = () => {
    i18next.changeLanguage(i18n.options.fallbackLng![0], (err) => {
      if (err) {
        return console.log("Unable to change the language", err);
      }
      console.log(`Language reset to default.`);
    });
  };

  window.mc.viewLanguageKeys = () => {
    i18next.changeLanguage("cimode", (err) => {
      if (err) {
        return console.log("Unable to change to keys mode", err);
      }
      console.log(`Changed to keys mode.`);
    });
  };
}

optimizelyUpdater.start();

// We need to import common-context.ts so things get assigned to the window
import("@root/stores/common-context");

// The primary client-side router.
ReactDOM.render(
  <Sentry.ErrorBoundary>
    <I18nextProvider i18n={i18n}>
      <React.Suspense fallback={null}>
        <Router routes={[rootRoute, defaultRoute]} history={browserHistory}></Router>
      </React.Suspense>
    </I18nextProvider>
  </Sentry.ErrorBoundary>,
  document.getElementById("app")
);
