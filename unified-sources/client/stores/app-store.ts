import { Store, ResourceRequest } from "@root/data/lib";
import { apiGateway } from "@root/lib/http";
import { IApp, CollaboratorRole, OS, APP_OWNER_TYPES, RESPONSE_TYPES, PLATFORMS } from "@lib/common-interfaces";
import { sortBy, values, intersectionBy, reduce } from "lodash";
import { App } from "@root/data/shell/models/app";
import { API, isValidReleaseType } from "@root/data/management/constants";
import { action, computed, toJS, observable } from "mobx";
import * as pluralize from "pluralize";
import { userStore } from "./user-store";
import { notFoundStore } from "./not-found-store";
import { locationStore } from "./location-store";
import { isTesterApp } from "./utils/app-utils";
import { TeamAppAssociationInfo, TeamAppsQueryOrOptions } from "@root/data/management/stores/team-app-store";

export type AppQuery = {
  ownerName?: string;
  appName?: string;
};

type ForeignKey = keyof IApp;

export class AppStore extends Store<IApp, IApp, App> {
  @observable
  private currentApp?: App;
  private sorty = (app: App) => app.display_name?.toLowerCase();
  private appSessionCallbacks = new Map<(app: App) => void, Set<string>>();

  protected ModelClass = App;

  constructor(initialValues: IApp[] = []) {
    super();
    initialValues.forEach((app) => {
      // There’s some bad data where we sometimes get two copies of the same app
      if (!this.has(this.internalAppId(app))) {
        this.add(new App(app));
      }
    });
  }

  private internalAppId(app: IApp | undefined) {
    if (!app || !app.owner) {
      return undefined;
    }
    return App.internalAppId(app.owner.name, app.name);
  }

  protected generateIdFromResponse(resource: IApp, query?: any) {
    return this.internalAppId(resource);
  }

  protected getModelId(model: App): string {
    // @ts-ignore. [Should fix it in the future] Can be undefined. Should fix all references
    return this.internalAppId(model);
  }

  @computed
  get app(): App {
    // @ts-ignore. [Should fix it in the future] Can be undefined. Should fix all references
    return this.currentApp;
  }

  @action
  public setCurrentApp(app?: App): void {
    const oldApp = this.currentApp;
    this.currentApp = app;
    if (app && app !== oldApp) {
      this.appSessionCallbacks.forEach((unsubscribedApps, cb) => {
        if (!unsubscribedApps.has(app.id)) {
          cb(app);
        }
      });
    }
  }

  get name(): string | undefined {
    return this.currentApp ? this.currentApp.name : undefined;
  }

  get ownerName(): string | undefined {
    return this.currentApp ? this.currentApp.owner.name : undefined;
  }

  @computed
  get apps(): App[] {
    const resources = this.resources;
    return sortBy(resources, this.sorty);
  }

  public getDistinctReleaseTypes(apps: App[]): string[] {
    return Array.from(
      apps.reduce((set, app) => {
        if (isValidReleaseType(app.release_type)) {
          set.add(app.release_type);
        }
        return set;
      }, new Set<string>())
    ).sort();
  }

  @computed
  get release_types(): string[] {
    return this.getDistinctReleaseTypes(this.apps);
  }

  @computed
  get hasApps(): boolean {
    return this.apps.length > 0;
  }

  @computed
  get appsAsManager(): App[] {
    return this.apps.filter((app) => this.hasAnyCollaboratorRoleForApp(["manager"], app));
  }

  @computed
  get isOwnedByCurrentUser(): boolean {
    return this.app ? this.app.owner.name === userStore.currentUser.name : false;
  }

  @computed
  get appsOwnedByUsers(): App[] {
    return this.apps.filter((app) => app.owner.type === APP_OWNER_TYPES.USER);
  }

  @computed
  get nonDogfoodingAppsOwnedByUser(): App[] {
    return this.appsOwnedByUsers.filter((app) => app.isOwnedByCurrentUser && !(app.isMicrosoftInternal && isTesterApp(app)));
  }

  public appsForOwner(type: string, name: string | undefined, { caseSensitive = false } = {}): App[] {
    const transform: (appName: string | undefined) => string | undefined = caseSensitive
      ? (appName) => appName
      : (appName) => appName?.toLowerCase();
    return this.apps.filter((app) => {
      return app.owner && pluralize(app.owner.type) === pluralize(type) && transform(app.owner.name) === transform(name);
    });
  }

  public appsForSubscription(id: string) {
    return this.apps.filter((app) => app.azure_subscription && app.azure_subscription.subscription_id === id);
  }

  public isValidOwnerType(type: string): boolean {
    return values(APP_OWNER_TYPES).includes(pluralize.singular(type));
  }

  @computed
  get uniqueOSs(): string[] {
    // @ts-ignore. es-linter don't see effect of .filter((os) => !!os);
    return Array.from(
      reduce(
        this.apps,
        (osSet: Set<string | undefined>, app: IApp) => {
          return !osSet.has(app.os) ? osSet.add(app.os) : osSet;
        },
        new Set<string>()
      )
    )
      .filter((os) => !!os)
      .sort((aOS, bOS) => {
        let compare = 0;
        // Reorder the values to give higher priority to iOS, Android & Windows.
        if (aOS === OS.IOS) {
          compare -= 10;
        } else if (bOS === OS.IOS) {
          compare += 10;
        }

        if (aOS === OS.ANDROID) {
          compare -= 9;
        } else if (bOS === OS.ANDROID) {
          compare += 9;
        }

        if (aOS === OS.WINDOWS) {
          compare -= 8;
        } else if (bOS === OS.WINDOWS) {
          compare += 8;
        }
        return compare;
      });
  }

  @computed
  get uniqueFilterRoles() {
    return Array.from(
      reduce(
        this.apps,
        (roleSet: Set<string>, app: IApp) => {
          const role = this.getFilterRole(app);
          return roleSet.add(role);
        },
        new Set<string>()
      )
    ).sort((aRole, bRole) => {
      let compare = 0;
      // Reorder the values to give higher priority to Collaborator and then Tester.
      if (aRole === "collaborator") {
        compare -= 10;
      } else if (bRole === "collaborator") {
        compare += 10;
      }

      if (aRole === "tester") {
        compare -= 9;
      } else if (bRole === "tester") {
        compare += 9;
      }

      return compare;
    });
  }

  private getFilterRole(app: IApp): string {
    return isTesterApp(app) ? "tester" : "collaborator";
  }

  @computed
  get sdkDocUrl() {
    const sdkUrlName = (() => {
      if (!this.app) {
        return;
      }

      const { platform, os } = this.app;
      if (platform === PLATFORMS.XAMARIN.value) {
        return PLATFORMS.XAMARIN.value;
      } else if (platform === PLATFORMS.UNITY.value) {
        return PLATFORMS.UNITY.value;
      } else if (platform === PLATFORMS.REACT_NATIVE.value) {
        return PLATFORMS.REACT_NATIVE.value;
      } else if (platform === PLATFORMS.CORDOVA.value) {
        return PLATFORMS.CORDOVA.value;
      } else if (os === OS.ANDROID) {
        return OS.ANDROID;
      } else if (os === OS.IOS) {
        return OS.IOS;
      } else if (platform === PLATFORMS.UWP.value) {
        return PLATFORMS.UWP.value;
      } else if (os === OS.MACOS) {
        return OS.MACOS;
      } else if (os === OS.TVOS) {
        return OS.TVOS;
      } else if (platform === PLATFORMS.WPF.value) {
        return PLATFORMS.WPF.value;
      } else if (platform === PLATFORMS.WINFORMS.value) {
        return PLATFORMS.WINFORMS.value;
      }
    })();

    return `https://aka.ms/getting-started/${sdkUrlName}`;
  }

  /**
   * @summary Returns true if the current user has at-least one role from the given array of `collaboratorRoles` for the current `app`.
   *
   * @desc Use this API where you need to check if an action is allowed or a component or a view should be shown to the current user.
   *
   * For example,
   *
   * //
   * // I want to show this view if the user is a "manager" & "developer"
   * //
   *
   * appStore.hasAnyCollaboratorRole(["manager", "developer"]) ? (
   *  // render the view or the component
   * ) : (
   *  null
   * );
   *
   *
   * //
   * // This button should be enabled if the user is a "manager"
   * //
   *
   * <Button disabled={!appStore.hasCollaboratorRole(["manager"])} />
   *
   * //
   * // Don't do this
   * //
   *
   * if (appStore.hasAnyCollaboratorRole(["viewer"])) {
   *  return null;
   * }
   *
   * In other words, always check for roles that you *know* should be allowed access to perform the actions or see a view.
   *
   * The reason for this is that a user can have all three roles ("manager", "developer", "viewer") on an app at the same time from
   * different sources and these roles do not follow a traditional hierarchical permissions model.
   *
   * @param {Role[]} collaboratorRoles - An array of roles that you would like to check for the current app.
   */
  public hasAnyCollaboratorRole(collaboratorRoles: CollaboratorRole[]): boolean {
    return this.hasAnyCollaboratorRoleForApp(collaboratorRoles, this.currentApp);
  }

  /**
   * @summary Returns true if the current user has at-least one role from the given array of `collaboratorRoles` for the given `app`.
   *
   * @desc Use this API where you need to check if an action is allowed or a component or a view should be shown to the current user.
   *
   * For example,
   *
   * //
   * // I want to show this view if the user is a "manager" & "developer"
   * //
   *
   * appStore.hasAnyCollaboratorRoleForApp(["manager", "developer"], app) ? (
   *  // render the view or the component
   * ) : (
   *  null
   * );
   *
   *
   * //
   * // This button should be enabled if the user is a "manager"
   * //
   *
   * <Button disabled={!appStore.hasAnyCollaboratorRoleForApp(["manager"], app)} />
   *
   * //
   * // Don't do this
   * //
   *
   * if (appStore.hasAnyCollaboratorRoleForApp(["viewer"], app)) {
   *  return null;
   * }
   *
   * In other words, always check for roles that you *know* should be allowed access to perform the actions or see a view.
   *
   * The reason for this is that a user can have all three roles ("manager", "developer", "viewer") on an app at the same time from
   * different sources and these roles do not have hierarchical permissions.
   *
   * @param {Role[]} collaboratorRoles - An array of roles that you would like to check for the given app.
   * @param {IApp} app - The app.
   */
  public hasAnyCollaboratorRoleForApp(collaboratorRoles: CollaboratorRole[], app: IApp | undefined): boolean {
    if (!collaboratorRoles || collaboratorRoles.length === 0 || !app) {
      return false;
    }
    return intersectionBy(app.member_permissions || [], collaboratorRoles, (role) => role.toLowerCase()).length !== 0;
  }

  @action
  public fetchApp(query: AppQuery): ResourceRequest<App | undefined, IApp> {
    const { ownerName, appName } = query;
    return super.fetchOne(App.internalAppId(ownerName || "", appName), query);
  }

  @action
  public removeApp(app: IApp): void {
    this.remove(this.internalAppId(app)!);
  }

  @action
  public updateAppInAppsList(oldApp: IApp, newApp: IApp): void {
    const oldAppInstance = this.get(this.internalAppId(oldApp)!);
    if (!oldApp || !newApp || !oldAppInstance) {
      return;
    }

    const appInstance = new App(toJS(newApp));

    // If the owner changed, remove the old app instance,
    // since the owner is part of the app's unique identifier in our map.
    if (appInstance.owner.name !== oldAppInstance.owner.name) {
      this.remove(oldAppInstance);
    }

    this.add(appInstance);

    if (this.app && this.app.id === newApp.id) {
      this.setCurrentApp(appInstance);
    }
  }

  public findApp(ownerName: string, appName: string): IApp | undefined {
    if (!ownerName || !appName) {
      return undefined;
    }
    return this.get(App.internalAppId(ownerName, appName));
  }

  public hasAppChanged(ownerType: string, ownerName: string, appName: string): boolean {
    if (!this.app) {
      return true;
    }
    return pluralize(this.app.owner.type) !== pluralize(ownerType) || this.app.owner.name !== ownerName || this.app.name !== appName;
  }

  public setAppOnRouteChange(ownerType: string | undefined, ownerName: string | undefined, appName: string | undefined) {
    if (!ownerType || !ownerName || !appName) {
      // When clearing out an app we should let the current route change finish so that we don’t trigger
      // reactions, due to the separate update cycles of MobX and react-router. Otherwise, a reaction
      // to `appStore.app` being set to undefined will happen before react-router `onChange` has finished,
      // causing components to hit an error trying to access app properties, e.g. `appStore.app.os`.
      setTimeout(() => {
        // if we go from route with app context to route without app context and immediately go back
        // timeout will set app to undefined and app will crash
        if (!locationStore.hasAppContextInRoute) {
          this.setCurrentApp();
        }
      }, 0);
      return;
    }

    if (this.hasAppChanged(ownerType, ownerName, appName)) {
      const app = this.get(App.internalAppId(ownerName, appName));
      if (!app) {
        notFoundStore.notify404();
        return;
      }
      this.setCurrentApp(app);
    }
  }

  /**
   * Registers a function to be called when an app is selected.
   * Returns an unsubscribe function optionally taking an `App` as an argument.
   * If an app is passed, the callback will not be run again for that app.
   * If called with no arguments, the callback will not be run again for any app.
   * @param callback The function to run when the app is selected.
   */
  public onStartAppSession(callback: (app: App) => void): (app?: App) => void {
    this.appSessionCallbacks.set(callback, new Set());
    return (app?: App) => {
      if (app) {
        const currentSet = this.appSessionCallbacks.get(callback);
        if (currentSet) {
          currentSet.add(app.id);
        }
      } else {
        this.appSessionCallbacks.delete(callback);
      }
    };
  }

  protected getResource(id: string, query?: AppQuery): Promise<IApp> {
    return apiGateway.get<IApp>(API.USER_APP, {
      params: {
        owner_name: query?.ownerName || "",
        app_name: query?.appName || "",
      },
    });
  }

  protected postResource(resource: App, options?: AppQuery): Promise<void | IApp> {
    const ownerIsUser = options && options.ownerName === userStore.currentUser.name;
    const url = ownerIsUser ? API.USER_APPS : API.ORG_APPS;
    const params = ownerIsUser ? {} : { org_name: options?.ownerName || "" };

    const body: Partial<IApp> = {
      description: resource.description,
      display_name: resource.display_name,
      name: resource.name,
      os: resource.os,
      platform: resource.platform,
    };

    if (resource.release_type) {
      body.release_type = resource.release_type;
    }

    // @ts-ignore. [Should fix it in the future] params.org_name can be undefined
    return apiGateway.post(url, {
      body,
      params: params,
    });
  }

  protected getCollection(
    query?: TeamAppsQueryOrOptions,
    foreignKey?: ForeignKey,
    foreignKeyValue?: IApp[ForeignKey]
  ): Promise<(IApp & TeamAppAssociationInfo)[]> {
    if (query && query.teamName && query.organizationName) {
      return apiGateway.get<(IApp & TeamAppAssociationInfo)[]>(API.TEAM_APPS, {
        params: {
          org_name: query.organizationName,
          team_name: query.teamName,
        },
      });
    } else {
      throw new Error("getCollection is only implemented for appStore in the context of getting apps for a team.");
    }
  }

  protected patchResource(resource: App, changes: Partial<IApp>, options?: any): Promise<any> {
    return apiGateway.patch(API.USER_APP, {
      body: changes,
      params: {
        owner_name: resource.owner.name,
        app_name: resource.name,
      },
    });
  }

  protected deleteResource(resource: App, options?: any): Promise<any> {
    return apiGateway.delete<void>(API.DELETE_APP, {
      params: {
        owner_name: resource.owner.name,
        app_name: resource.name,
      },
      responseType: RESPONSE_TYPES.TEXT,
    });
  }

  protected deserialize(serialized: IApp, queryOrOptions?: any, foreignKey?: ForeignKey, foreignKeyValue?: IApp[ForeignKey]): IApp {
    return serialized;
  }
}

export const appStore = new AppStore(((window as any).initProps || {}).apps || []);
