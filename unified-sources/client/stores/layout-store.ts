import { action, computed, observable } from "mobx";
import { IApp, INavigationItem, LayoutContext, OS, PLATFORMS } from "@lib/common-interfaces";
import { IconName } from "@lib/constants";
import { appStore } from "./app-store";
import { config } from "../lib/utils/config";
import { locationStore } from "./location-store";
import { organizationStore } from "./organization-store";
import { CrashPermission, CrashPermissions } from "./utils/crash-permissions";
import { getNavItems } from "./utils/management-nav-items";
import { getAdminNavItems } from "./utils/admin-nav-items";
import { t } from "@root/lib/i18n/i18n";
import { globalUIStore } from "@root/stores";
import { Utils } from "../lib/http/utils";
import { find } from "lodash";
import { isTesterApp } from "./utils/app-utils";
import uuid = require("uuid");

const cssVars = require("@css/vars.scss");
const tabletScreen = parseInt(cssVars.tabletScreen, 10);
const smallScreen = parseInt(cssVars.smallScreen, 10);
const mediumScreen = parseInt(cssVars.mediumScreen, 10);
const largeScreen = parseInt(cssVars.largeScreen, 10);

export enum Breakpoint {
  Tablet = tabletScreen,
  Small = smallScreen,
  Medium = mediumScreen,
  Large = largeScreen,
}

export class LayoutStore {
  private leftNavToggledCallbacks = new Map<string, (expanded: boolean) => void>();
  @observable public documentWidth = document.documentElement.scrollWidth;
  @observable public supportsMobile = document.documentElement.getAttribute("data-supports-mobile") === "true";
  public _ignoredRootPaths = config.getRootPathsNotInNav();
  private supportsMobileObserver = new MutationObserver(
    action(() => {
      this.supportsMobile = document.documentElement.getAttribute("data-supports-mobile") === "true";
      this.documentWidth = document.documentElement.scrollWidth;
    })
  );
  @observable public leftNavExpanded = window.innerWidth >= Breakpoint.Medium;
  public mobileSafariRequestedDesktopMode = window.navigator.platform === "iPhone" && !window.navigator.userAgent.includes("iPhone");
  @observable public desktopViewOverride = this.mobileSafariRequestedDesktopMode;

  constructor() {
    this.supportsMobileObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-supports-mobile"],
    });

    window.addEventListener(
      "resize",
      action((event: Event) => {
        this.documentWidth = document.documentElement.scrollWidth;
        if (event.currentTarget) {
          const windowTarget = event.currentTarget as Window;
          if (this.leftNavExpanded && windowTarget.innerWidth < Breakpoint.Medium) {
            this.toggleNavSize();
          } else if (!this.leftNavExpanded && windowTarget.innerWidth >= Breakpoint.Medium) {
            this.toggleNavSize();
          }
        }
      })
    );
  }

  @computed
  public get isMobile() {
    return this.documentWidth < Breakpoint.Tablet;
  }

  @computed
  public get layoutContext() {
    return locationStore.appName ? LayoutContext.App : LayoutContext.None;
  }

  @computed get navItems() {
    return this.processRoutesRecursive(this.navItemsByDomain);
  }

  @computed get rootNavItems() {
    return this.processRoutesRecursive(this._rootNavItems);
  }

  @computed get orgNavItems() {
    return organizationStore.hasOrganizations
      ? this._rootNavItems.concat(getNavItems(organizationStore.organizations))
      : this._rootNavItems;
  }

  @computed get adminNavItems() {
    return getAdminNavItems();
  }

  get leftNavDefaultsCollapsed() {
    return window.innerWidth < Breakpoint.Medium;
  }

  get navItemsByDomain() {
    const { app } = appStore;
    if (Utils.isInstallSubdomain() || (app && isTesterApp(app))) {
      return this.orgNavItems;
    } else if (locationStore.hasAppContextInRoute) {
      return this._defaultPrimaryNavRoutes;
    } else if (locationStore.beacon === "admin") {
      return this.adminNavItems;
    } else {
      return this.orgNavItems;
    }
  }

  @action
  public toggleNavSize = () => {
    this.leftNavExpanded = !this.leftNavExpanded;
    globalUIStore.setIsNavBarOpen(this.leftNavExpanded);
  };

  /**
   * This should only ever be called by the left nav component.
   */
  public notifyLeftNavToggleFinished() {
    this.leftNavToggledCallbacks.forEach((cb) => {
      cb(this.leftNavExpanded);
    });
  }

  /**
   * Registers a callback to be called when the nav expansion toggled animation completes. This
   * is only ever expected to be used when working with things that don't adhere to the React
   * render lifecycle, like Highcharts.
   *
   * @returns An unsubscribe function that should be called when your component no longer wishes
   * to received updates about the toggle animation completing, like when your component unmounts.
   */
  public onLeftNavToggleFinished(callback: (expanded: boolean) => void) {
    // Generate a unique ID for this callback, so we can use it as the key in the map for quick
    // lookup later.
    const id = uuid.v4();
    this.leftNavToggledCallbacks.set(id, callback);
    // Build a function that can be used to unsubscribe from notifications.
    return () => {
      // Capture the ID in the return unsub function
      this.leftNavToggledCallbacks.delete(id);
    };
  }

  /**
   * Filters the given navItem if it is supposed to be ignored from the Nav.
   */
  private _filterIgnoredRootPaths(navItem: INavigationItem): boolean {
    if (!this._ignoredRootPaths || !this._ignoredRootPaths.length) {
      return true;
    }

    return this._ignoredRootPaths.indexOf(navItem.route) === -1;
  }

  /**
   * Filters the paths using the feature value provided by the navItem.
   */
  private _filterPathsUsingFeature(navItem: INavigationItem): boolean {
    return true;
  }

  /**
   * Filters the NavItems by OS, platform and the related feature flag.
   *
   * Looks at the `notAllowedOSPlatforms` array and the app OS, platform to figure out whether
   * the navItem should be filtered or not.
   *
   * If a related feature flag is active, this item will be shown.
   * If not, it will be not shown.
   */
  private _filterRootPathsUsingOSPlatformAndRelatedFeatureFlags(
    navItem: INavigationItem,
    app: IApp,
    layoutContext: LayoutContext
  ): boolean {
    switch (layoutContext) {
      case LayoutContext.App:
        if (!app) {
          return true;
        } else {
          // If navItem doesn't have notAllowedOSPlatforms, we want this navItem to show up.
          if (!navItem.notAllowedOSPlatforms) {
            return true;
          }

          // Try to find a matchingOSPlatformPair from the notAllowedOSPlatforms array.
          const matchingOSPlatformPair = navItem.notAllowedOSPlatforms.find((osPlatform) => {
            return osPlatform.os === app.os && osPlatform.platform === app.platform;
          });

          // If we couldn't find any matching pair from notAllowedOSPlatforms array, we want this navItem to show up.
          if (!matchingOSPlatformPair) {
            return true;
          }

          // Hide the navItem if nothing worked out.
          return false;
        }
      default:
        return true;
    }
  }

  /**
   * Takes a tree of navigation items and returns a new one, with `route` values replaced
   * with absolute URLs including the user and current app, via `locationStore`.
   */
  private processRoutesRecursive(navItems: INavigationItem[] = []) {
    return navItems.reduce((items, item) => {
      if (
        this._filterRootPathsUsingOSPlatformAndRelatedFeatureFlags(item, appStore.app, this.layoutContext) &&
        this._filterIgnoredRootPaths(item) &&
        this._filterPathsUsingFeature(item) &&
        (!item.hasOwnProperty("isVisible") || item.isVisible)
      ) {
        const route = item.isExternalLink ? item.route : locationStore.getUrlWithApp(item.route, appStore.app);

        return items.concat({
          ...item,
          route: item.isAdminLink ? `/${item.route}` : route,
          childItems: this.processRoutesRecursive(item.childItems),
        });
      }

      return items;
    }, [] as INavigationItem[]);
  }

  get _rootNavItems(): INavigationItem[] {
    const rootItems: INavigationItem[] = [
      {
        route: "/apps",
        beacon: "apps",
        title: t("common:navigation.allApps"),
        icon: IconName.AppHome,
        isExternalLink: true,
      },
      {
        route: "",
        title: "",
        filler: true,
        showLineWhenMobile: true,
      },
    ];

    return rootItems;
  }

  public getFirstUsableChildRouteForBeacon(beacon: string, childRoute?: string): string {
    // Top-level route that matches the specified beacon
    const route = find(this._defaultPrimaryNavRoutes, ({ beacon: route }) => route === beacon);
    if (!route) {
      return "";
    }

    // Child routes under the top-level route
    const childRoutes = route.childItems;
    if (!childRoutes) {
      return [beacon, childRoute].join("/");
    }

    // If there are no sub-nav items, just go to what they’re asking for
    if (!childRoutes.length) {
      return [beacon, childRoute].join("/");
    }

    // Return the first child route
    let firstUsableChildRoute = childRoutes[0].route;

    // Unless we’re on a mobile device and there is a mobile-ready child route
    const firstMobileReadyRoute = childRoutes.find(({ mobileReady }) => mobileReady);
    if (this.isMobile && !!firstMobileReadyRoute && !!firstMobileReadyRoute.route) {
      firstUsableChildRoute = firstMobileReadyRoute.route;
    }

    // Unless we’re on desktop or a mobile-ready child route was specified
    const nestedRoute = childRoutes.find(({ route: nestedRoute }) => nestedRoute === `${route.route}/${childRoute}`);
    if ((!this.isMobile || (!!nestedRoute && nestedRoute.mobileReady)) && !!nestedRoute && !!nestedRoute.route) {
      firstUsableChildRoute = nestedRoute.route;
    }

    return firstUsableChildRoute;
  }

  //
  // These are the default routes display shown by the Navigation component.
  // When adding a new top-level beacon, edit this file and add your route and
  // the text to show. The beacons will then pick it up.
  //
  get _defaultPrimaryNavRoutes(): INavigationItem[] {
    return [
      {
        route: "beacon",
        beacon: "prototype",
        title: "Beacon",
        icon: IconName.AppBeacon,
        childItems: [
          {
            route: "beacon/ui-components",
            title: "UI Components",
          },
          {
            route: "beacon/icon-guide",
            title: "Icon Guide",
          },
          {
            route: "beacon/drag-drop-upload-guide",
            title: "DragDropUpload Guide",
          },
          {
            route: "beacon/users",
            title: "Users",
          },
          {
            route: "beacon/logs",
            title: "Logs",
          },
          {
            route: "beacon/tests",
            title: "Tests",
          },
          {
            route: "beacon/infinite-scrolling",
            title: "Infinite Scrolling",
          },
          {
            route: "beacon/select",
            title: "SelectPage",
          },
          {
            route: "beacon/progress",
            title: "ProgressPage",
          },
          {
            route: "beacon/crashes-splash-screens",
            title: "Crashes Splash Screens",
          },
          {
            route: "beacon/crashes-charts",
            title: "Crashes Charts",
          },
          {
            route: "beacon/coming-soon",
            title: "ComingSoon",
          },
          {
            route: "beacon/database-word-map",
            title: "Database Worldmap",
          },
        ],
      },
      {
        route: "",
        beacon: "overview",
        title: t("common:navigation.apps"),
        icon: IconName.GettingStarted,
        mobileReady: true,
        childItems: [],
        get isVisible() {
          // Hide Overview for Custom apps unless they are from HockeyApp
          return appStore.app && !appStore.app.isCustomApp;
        },
      },
      {
        route: "",
        title: "",
        filler: true,
      },
      {
        route: "build",
        beacon: "build",
        title: t("common:navigation.build"),
        icon: IconName.AppBuild,
        childItems: [],
        notAllowedOSPlatforms: [
          // Hide Cordova build, for all OS-es
          {
            os: OS.IOS,
            platform: PLATFORMS.CORDOVA.value,
          },
          {
            os: OS.ANDROID,
            platform: PLATFORMS.CORDOVA.value,
          },
          {
            os: OS.WINDOWS,
            platform: PLATFORMS.CORDOVA.value,
          },

          // Hide React Native build, for Windows
          {
            os: OS.WINDOWS,
            platform: PLATFORMS.REACT_NATIVE.value,
          },
        ],
        get isVisible() {
          // Hide Build due to AppCenter retirement
          return false;
        },
      },
      {
        route: "test",
        beacon: "test",
        title: t("common:navigation.test.main"),
        icon: IconName.AppTest,
        childItems: [
          {
            route: "test/runs",
            title: t("common:navigation.test.runs"),
          },
          {
            route: "test/device-sets",
            title: t("common:navigation.test.deviceSets"),
          },
        ],
        get isVisible() {
          // Hide Test due to AppCenter retirement
          return false;
        },
      },
      {
        route: "distribute",
        beacon: "distribute",
        title: t("common:navigation.distribute.main"),
        icon: IconName.AppDistribute,
        mobileReady: true,
        childItems: [
          {
            route: "distribute/releases",
            title: t("common:navigation.distribute.releases"),
            mobileReady: true,
            get isVisible() {
              // Hide releases for Electron apps
              return appStore.app && !appStore.app.isElectronApp;
            },
          },
          {
            route: "distribute/distribution-groups",
            title: t("common:navigation.distribute.groups"),
            get isVisible() {
              // Hide distribution groups for Electron apps
              return appStore.app && !appStore.app.isElectronApp;
            },
          },
          {
            route: "distribute/distribution-stores",
            title: t("common:navigation.distribute.stores"),
            get isVisible() {
              if (appStore.app) {
                const isGooglePlayStoreEnabled = appStore.app.isAndroidApp;
                const isIntuneStoreEnabled = appStore.app.isAndroidApp || appStore.app.isIosApp;
                return isGooglePlayStoreEnabled || isIntuneStoreEnabled;
              }
            },
          },
          {
            route: "distribute/code-push",
            title: t("common:navigation.distribute.codePush"),
            get isVisible() {
              //Hide CodePush due to AppCenter retirement
              return false;
            },
          },
        ],
        get isVisible() {
          if (appStore.app) {
            return appStore.app.isSupportedForBeacon("distribute") && appStore.app.isAppWhitelisted;
          }
        },
      },
      {
        route: "",
        title: "",
        filler: true,
      },
      {
        route: "",
        title: "",
        filler: true,
      },
      {
        route: "crashes",
        beacon: "crashes",
        title: t("common:navigation.crashes.main"),
        icon: IconName.AppCrashes,
        mobileReady: true,
        childItems: [
          {
            route: "crashes/errors",
            title: t("common:navigation.crashes.issues"),
            mobileReady: true,
          },
          {
            route: "crashes/mappings",
            title: t("common:navigation.crashes.mappings"),
            get isVisible() {
              if (appStore.app) {
                return (
                  CrashPermissions.hasPermission(CrashPermission.Viewer) &&
                  (appStore.app.isProguardCapable || appStore.app.isElectronApp)
                );
              }
            },
          },
          {
            route: "crashes/symbols",
            title: t("common:navigation.crashes.symbols"),
            get isVisible() {
              if (appStore.app) {
                return (
                  CrashPermissions.hasPermission(CrashPermission.Viewer) &&
                  // it would be nice to show symbols tab whenever users had uploaded symbols as well as the below criteria
                  !appStore.app.isCustomApp
                );
              }
            },
          },
        ],
        get isVisible() {
          if (appStore.app) {
            return appStore.app.isSupportedForBeacon("crashes");
          }
        },
      },
      {
        route: "analytics",
        beacon: "analytics",
        title: t("common:navigation.analytics.main"),
        icon: IconName.AppAnalytics,
        childItems: [
          {
            route: "analytics/overview",
            title: t("common:navigation.analytics.overview"),
          },
          {
            route: "analytics/events",
            title: t("common:navigation.analytics.events"),
          },
          {
            route: "analytics/log-flow",
            title: t("common:navigation.analytics.logFlow"),
          },
        ],
        get isVisible() {
          if (appStore.app) {
            return appStore.app.isSupportedForBeacon("analytics");
          }
        },
      },
      {
        route: "",
        title: "",
        filler: true,
      },
      {
        route: "settings",
        beacon: "settings",
        title: t("common:navigation.settings"),
        icon: IconName.AppSettings,
        mobileReady: true,
      },
    ];
  }
}

/**
 * Export the store
 */
export const layoutStore = new LayoutStore();
