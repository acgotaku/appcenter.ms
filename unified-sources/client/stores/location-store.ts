import { observable, action, computed } from "mobx";
import { InjectedRouter, RouterState } from "react-router";
import { startsWith, merge, trim } from "lodash";
import { appStore } from "./app-store";
import { userStore } from "./user-store";
import { IApp, BeaconName, BeaconRoute } from "@lib/common-interfaces";
import { goUp } from "@root/lib/utils/go-up";
import { ParamsParserUtils } from "../lib/http/params-parser-utils";
import { PARAM_KEYS } from "@lib/constants/api";
import { logoutToSignIn as logoutToSignInUtil } from "@root/lib/http/redirect-to-login-utils";
import * as pluralize from "pluralize";

export class LocationStore {
  private _pendingTransition?: RouterState | null;
  private _cancelledTransitions = new WeakSet<RouterState>();
  private _router!: InjectedRouter; //set in setRouter
  private _routerState?: RouterState;
  private _appsRouteFragment: string = "apps";
  private _rootUrlTemplateWithAppContext: string = `/:${PARAM_KEYS.OWNER_TYPE}/:${PARAM_KEYS.OWNER_NAME}/${this._appsRouteFragment}/:${PARAM_KEYS.APP_NAME}`;
  @observable private activeBeacon?: BeaconName | null;
  @observable private activeOwnerName?: string;
  @observable private activeOwnerType?: string;
  @observable private activeAppName?: string;
  @observable private currentPath: string = "";
  @observable private isLoading = false;
  @observable public breadcrumbs = observable.array<{ path: string; title: string }>();

  @computed
  public get personalOrgUrl() {
    return `/users/${userStore.currentUser.name}/applications`;
  }

  /**
   * Sets the router instance.
   *
   * @param {InjectedRouter} router
   */
  public setRouter(router: InjectedRouter) {
    this._router = router;
  }

  /**
   * Sets the router state.
   *
   * @param {RouterState} routerState
   */
  @action
  public setRouterState(routerState: RouterState): void {
    const pathInfo = this.parse(routerState.location.pathname);
    this._routerState = routerState;
    this.activeBeacon = this.getBeacon(routerState);
    this.activeOwnerName = pathInfo.ownerName;
    this.activeOwnerType = pathInfo.ownerType;
    this.activeAppName = pathInfo.appName;
    this.isLoading = false;
    this.currentPath = routerState.location.pathname;

    // User transitioned to something else before pending transition completed
    if (this._pendingTransition && this._pendingTransition !== routerState) {
      this._cancelledTransitions.add(this._pendingTransition);
      this._pendingTransition = null;
    }
  }

  /**
   * Sets activeBeacon so that UI can be optimistically updated while loading that beacon.
   */
  @action
  public setLoadingBeacon(beacon: BeaconName, nextState: RouterState) {
    this.isLoading = true;
    this._pendingTransition = nextState;
    if (beacon) {
      this.activeBeacon = beacon;
    }
  }

  @action
  public updateBreadcrumbs = (breadcrumbs: any[]) => {
    this.breadcrumbs.replace(breadcrumbs);
  };

  public get beacon() {
    return this.activeBeacon;
  }
  public get ownerName() {
    return this.activeOwnerName;
  }
  public get ownerType() {
    return this.activeOwnerType;
  }
  public get appName() {
    return this.activeAppName;
  }
  public get loading() {
    return this.isLoading;
  }
  public get pathname() {
    return this.currentPath;
  }

  public get query() {
    return this._routerState?.location.query;
  }

  public getGoUpPath(preserveQuery = true): string {
    if (this.breadcrumbs.length) {
      return this.breadcrumbs[this.breadcrumbs.length - 1].path + preserveQuery ? window.location.search : "";
    }
    return "/";
  }

  public getGoUpPathFrom(path: string): string {
    const crumb = this.breadcrumbs[this.breadcrumbs.findIndex((crumb) => crumb.path === path) - 1];
    return crumb ? crumb.path : "/";
  }

  /**
   * Gets the router instance.
   *
   * @readonly
   * @type {InjectedRouter}
   */
  get router(): InjectedRouter {
    return this._router;
  }

  get hasAppContextInRoute(): boolean {
    return (
      !!this._routerState &&
      Boolean(
        this._routerState.params[PARAM_KEYS.OWNER_TYPE] &&
          this._routerState.params[PARAM_KEYS.OWNER_NAME] &&
          this._routerState.params[PARAM_KEYS.APP_NAME]
      )
    );
  }

  /**
   * Parse the given path to return ownerType, ownerName & appName.
   */
  public parse(path: string): { ownerType: string | undefined; ownerName: string | undefined; appName: string | undefined } {
    const defaults = {
      ownerType: undefined,
      ownerName: undefined,
      appName: undefined,
    };

    if (!path) {
      return defaults;
    }

    path = trim(path);
    if (path.length === 0) {
      return defaults;
    }

    const [, ownerType, ownerName, appsFragment, appName] = path.split("/");

    const isValidOwnerType = appStore.isValidOwnerType(ownerType);

    return {
      ownerType: isValidOwnerType ? ownerType : undefined,
      ownerName: isValidOwnerType ? ownerName : undefined,
      appName: isValidOwnerType && appsFragment === this._appsRouteFragment ? appName : undefined,
    };
  }

  public isCancelled(nextState: RouterState) {
    return this._cancelledTransitions.has(nextState);
  }

  /**
   * Gets the full parameterized root url.
   *
   * @returns {string}
   */
  public getParameterizedUrlWithApp(relativeUrl?: string): string {
    if (!relativeUrl) {
      return this._rootUrlTemplateWithAppContext;
    }

    if (startsWith(relativeUrl, "/")) {
      return `${this._rootUrlTemplateWithAppContext}${relativeUrl}`;
    } else {
      return `${this._rootUrlTemplateWithAppContext}/${relativeUrl}`;
    }
  }

  /**
   * Resolves a parameterized url using the params provided.
   * If the url isn't parameterized, all keys in the params will be appended as query parameters.
   *
   * @param parameterizedUrl
   * @param params
   */
  public getResolvedUrl(parameterizedUrl: string, params?: { [key: string]: string }): string {
    if (!parameterizedUrl) {
      return "";
    }
    return ParamsParserUtils.parse(parameterizedUrl, params || {});
  }

  /**
   * Gets the full url by prepending the root url for App Center.
   * Root url consists of `app_name` and `owner_name`.
   *
   * If `params` exist, they will be added to their corresponding placeholders if the url is
   * parameterized. Otherwise, they will be appended as query parameters.
   *
   * Note: This function should be used by all beacons for creating urls for `Link` or `href`.
   *
   * @param {string} relativeUrl
   * @param {*} [app]
   * @param {{[key: string]: string | string[]}} [params]
   * @returns {string}
   */
  public getUrlWithApp(url: string, app?: IApp, params?: { [key: string]: any }): string {
    const rootUrl = this._createRootUrl(app);

    // Parse url with the given params
    url = ParamsParserUtils.parse(url, params || {});

    // App doesn't exist for the rootUrl to populate
    if (rootUrl.length === 0) {
      return url;
    }

    // If the url is empty, return the root url
    if (url.length === 0) {
      return `${rootUrl}`;
    }

    if (startsWith(url, "/")) {
      return `${rootUrl}${url}`;
    } else {
      return `${rootUrl}/${url}`;
    }
  }

  /**
   * Gets the full url by prepending the root url for App Center using the current app from appStore.
   * Root url consists of `app_name` and `owner_name`.
   *
   * If `params` exist, they will be added to their corresponding placeholders if the url is
   * parameterized. Otherwise, they will be appended as query parameters.
   *
   * Note: This function should be used by all beacons for creating urls for `Link` or `href`.
   *
   * @param {string} url
   * @param {{ [key: string]: string }} [params]
   * @returns {string}
   */
  public getUrlWithCurrentApp(url: string, params?: { [key: string]: string }): string {
    return this.getUrlWithApp(url, appStore.app, params || {});
  }

  /**
   * Gets the full url by prepending the root url for the App Center install portal.
   * Root url consists of `app_name` and `owner_name`.
   *
   * If `params` exist, they will be added to their corresponding placeholders if the url is
   * parameterized. Otherwise, they will be appended as query parameters.
   *
   * Note: This function should be used by all beacons for creating urls for `Link` or `href`.
   *
   * @param {string} relativeUrl
   * @param {*} [app]
   * @param {{[key: string]: string | string[]}} [params]
   * @returns {string}
   */
  public getInstallPortalUrlWithApp(url: string, app?: IApp, params?: { [key: string]: string | string[] }): string {
    return location.protocol + "//install." + location.host.toLowerCase() + this.getUrlWithApp(url, app, params);
  }

  /**
   * Gets the full url by prepending the root url for the App Center install portal using the current
   * app from appStore. Root url consists of `app_name` and `owner_name`.
   *
   * If `params` exist, they will be added to their corresponding placeholders if the url is
   * parameterized. Otherwise, they will be appended as query parameters.
   *
   * Note: This function should be used by all beacons for creating urls for `Link` or `href`.
   *
   * @param {string} url
   * @param {{ [key: string]: string }} [params]
   * @returns {string}
   */
  public getInstallPortalUrlWithCurrentApp(url: string, params?: { [key: string]: string }): string {
    return this.getInstallPortalUrlWithApp(url, appStore.app, params || {});
  }

  /**
   * Navigates to the given location using the given app context.
   * Prepends the common root to the pathname in the location object/location string before navigation.
   *
   * If you want to apply hashed fragments to the url, please use `LocationDescriptorObject` to construct your location.
   * `LocationDescriptorObject` contains a `state` property which will be automatically applied as hashed fragment by react-router.
   *
   * Note: This function should be used for navigation by all beacons who need app context for their operations.
   *
   * @param {(LocationDescriptorObject | string)} location
   * @param {IApp} [app]
   * @param {{[key: string]: string}} [params]
   */
  public pushWithApp(location: Location | string, app: IApp, params?: { [key: string]: any }): void {
    if (!this._router) {
      throw new Error("Router instance not initialized.");
    }

    if (typeof location === "string") {
      location = this.getUrlWithApp(location as string, app, params);
    } else {
      location = merge({}, location, {
        pathname: this.getUrlWithApp((location as Location).pathname, app, params),
        query: {},
      });
    }

    this._router.push(location);
  }

  /**
   * Navigates to the given location using the current app context.
   * Prepends the common root to the pathname in the location object/location string before navigation.
   *
   * If you want to apply hashed fragments to the url, please use `LocationDescriptorObject` to construct your location.
   * `LocationDescriptorObject` contains a `state` property which will be automatically applied as hashed fragment by react-router.
   *
   * Note: This function should be used for navigation by all beacons who need app context for their operations.
   *
   * @param {(LocationDescriptorObject | string)} location
   * @param {{[key: string]: string}} [params]
   */
  public pushWithCurrentApp(location: Location | string, params?: { [key: string]: any }): void {
    if (!appStore.app) {
      console.error("Current app is not set!");
    }
    this.pushWithApp(location, appStore.app, params || {});
  }

  /**
   * Navigates to the app list page.
   */
  public pushAppList(): void {
    this._router.push("/apps");
  }

  /**
   * Navigates to the root page.
   */
  public pushRoot(): void {
    this._router.push("/");
  }

  /**
   * Navigates to the org applications list page
   */
  public pushOrgAppList(): void {
    this._router.push(`/orgs/${this.activeOwnerName}/applications`);
  }

  /**
   * Navigates to the user settings page.
   */
  public pushToSettings(path?: string): void {
    if (path) {
      this._router.push(`/settings${startsWith(path, "/") ? "" : "/"}${path}`);
    } else {
      this._router.push("/settings");
    }
  }

  /**
   * Goes up 1 level in the current browser location.
   */
  public goUp(preserveQuery = true): void {
    if (this._routerState) {
      goUp(this._router, this._routerState.routes, this._routerState.location, preserveQuery);
    }
  }

  /**
   * Gets the full root url using the app.
   * If an app isn't provided, `appStore` will be used to get the
   * `owner_name` and `app_slug`.
   *
   * @param {IApp} [app]
   * @returns {string}
   */
  private _createRootUrl(app?: IApp): string {
    if (!app) {
      return "";
    }

    return ParamsParserUtils.parse(this._rootUrlTemplateWithAppContext, {
      [`${PARAM_KEYS.OWNER_TYPE}`]: pluralize(app.owner?.type || ""),
      [`${PARAM_KEYS.OWNER_NAME}`]: app.owner?.name,
      [`${PARAM_KEYS.APP_NAME}`]: app.name,
    });
  }

  private getBeacon(routerState: RouterState) {
    const beaconRoute: BeaconRoute | undefined = routerState.routes.find((r: BeaconRoute) => Boolean(r.beacon));
    return beaconRoute ? beaconRoute.beacon : null;
  }

  /**
   * Redirects the user to the logout page, with a return URL to the sign-in page
   *
   * @param message The message to show on the login screen after logout
   */
  public logoutToSignIn(message?: string, returnToCurrentLocation: boolean = false) {
    logoutToSignInUtil(message, returnToCurrentLocation);
  }
}

export const locationStore = new LocationStore();
