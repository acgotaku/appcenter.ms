import { computed, observable, action, IObservableArray } from "mobx";
import { differenceWith, compact } from "lodash";
import { appStore } from "@root/stores";
import { FetchError } from "@root/lib/http/fetch-error";
import { teamAppStore, TeamAppsQueryOrOptions, teamStore, TeamAppAssociation } from "@root/data/management";
import { IApp, CollaboratorRole, APP_OWNER_TYPES, NotificationType } from "@lib/common-interfaces";
import { INotificationMessage } from "../../../../constants/constants";
import { App } from "@root/data/shell/models/app";
import { ResourceRequest } from "@root/data/lib";

export class TeamAppsUIStore {
  @observable public addAppNotificationAllowed = false;
  @observable public updateAppNotificationAllowed = false;
  @observable public deleteAppNotificationAllowed = false;
  public updateRoleRequests = observable.array<ResourceRequest<TeamAppAssociation, any>>();
  private appIdsToDelete: IObservableArray<any> = observable.array([], { deep: false });
  private appIdToAdd!: string;

  @action
  public hideNotifications(): void {
    this.addAppNotificationAllowed = false;
    this.updateAppNotificationAllowed = false;
    this.deleteAppNotificationAllowed = false;
  }

  public notification(organizationName: string, teamName: string): INotificationMessage {
    return (
      this.addAppNotification(organizationName, teamName) ||
      this.updateNotification ||
      this.deleteNotification(organizationName, teamName)
    );
  }

  @computed
  get fetchFailed(): boolean {
    return appStore.collectionFetchFailed;
  }

  @computed
  get isFetching(): boolean {
    return appStore.isFetchingCollection;
  }

  public isDisassociating(organizationName: string, teamName: string): boolean {
    return this.appIdsToDelete.some((id) => teamAppStore.isDisassociating(teamStore.compoundKey(organizationName, teamName), id));
  }

  public addAppNotification(organizationName: string, teamName: string): INotificationMessage {
    const teamId = teamStore.compoundKey(organizationName, teamName);
    if (!this.addAppNotificationAllowed || !teamAppStore.associationFailed(teamId, this.appIdToAdd)) {
      return null as any;
    }

    const error = teamAppStore.associationError<FetchError>(teamId, this.appIdToAdd);
    return {
      type: NotificationType.Error,
      message: ((status) => {
        switch (error.status) {
          case 409:
            return "Oops. This app is already added to this team.";
          case 403:
            return "Oops. You can’t add apps to this team.";
          case 404:
            return "Oops. We could not find this team or the organization.";
          case 400:
            return error.message ?? "Something isn’t right with the data used to add this app.";
          default:
            return "Oops. Something went wrong. Please try again later.";
        }
      })(status),
    };
  }

  @computed
  public get updateNotification(): INotificationMessage {
    if (!this.updateAppNotificationAllowed) {
      return null as any;
    }

    const requestWithError = this.updateRoleRequests.find((req) => !!req.error);
    if (!requestWithError) {
      return null as any;
    } else {
      const error = requestWithError.error as FetchError;
      return {
        type: NotificationType.Error,
        message: (() => {
          switch (error.status) {
            case 404:
              return "Oops. We could not find this app.";
            case 403:
              return "Oops. You can’t update the role for this app.";
            case 400:
              return "Something isn’t right with the data used to update this app.";
            default:
              return "Something went wrong. Please try again later.";
          }
        })(),
      };
    }
  }

  public deleteNotification(organizationName: string, teamName: string): INotificationMessage {
    if (!this.deleteAppNotificationAllowed) {
      return null as any;
    }

    const teamId = teamStore.compoundKey(organizationName, teamName);
    const errors: FetchError[] = compact(
      this.appIdsToDelete.map((appId) => teamAppStore.disassociationError<FetchError>(teamId, appId))
    );
    if (errors.length === 0) {
      return null as any;
    } else if (errors.length === 1) {
      const error = errors[0];
      return {
        type: NotificationType.Error,
        message: (() => {
          switch (error.status) {
            case 404:
              return "Oops. We could not find this app.";
            case 403:
              return "Oops. You can’t remove this app.";
            case 400:
              return "Something isn’t right with the data used to delete this app.";
            default:
              return "Something went wrong. Please try again later.";
          }
        })(),
      };
    } else {
      const hasUnauthorizedError = errors.some((error: FetchError) => error.status === 403);
      const notFoundError = errors.some((error: FetchError) => error.status === 404);
      return {
        type: NotificationType.Error,
        message: (() => {
          switch (true) {
            case notFoundError:
              return "Oops. We could not find some of the apps.";
            case hasUnauthorizedError:
              return "Oops. You can’t remove apps from this team.";
            default:
              return "An error occurred removing some apps. Please try again later.";
          }
        })(),
      };
    }
  }

  @action
  public addApp(app: App, organizationName: string, teamName: string): void {
    this.hideNotifications();
    this.appIdToAdd = App.internalAppId(app.owner.name, app.name);
    this.addAppNotificationAllowed = true;
    const options: TeamAppsQueryOrOptions = {
      organizationName: organizationName,
      teamName: teamName,
      appName: app.name,
    };

    teamAppStore
      .associate(teamStore.compoundKey(organizationName, teamName), App.internalAppId(app.owner.name, app.name), true, options)
      .onSuccess(() => {
        const team = teamStore.get(organizationName, teamName);
        team!.incrementAppCount();
      })
      .onFailure(() => {
        this.addAppNotificationAllowed = true;
      });
  }

  @action
  public deleteApps(apps: App[], organizationName: string, teamName: string): void {
    this.hideNotifications();
    this.appIdsToDelete.clear();
    this.deleteAppNotificationAllowed = true;
    apps.forEach((app) => {
      const options: TeamAppsQueryOrOptions = {
        organizationName: organizationName,
        teamName: teamName,
        appName: app.name,
      };
      const appId = App.internalAppId(app.owner.name, app.name);
      this.appIdsToDelete.push(appId);
      teamAppStore.disassociate(teamStore.compoundKey(organizationName, teamName), appId, true, options).onSuccess(() => {
        const team = teamStore.get(organizationName, teamName);
        team!.decrementAppCount();
      });
    });
  }

  @action
  public updateAppsRole = (apps: App[], role: CollaboratorRole, organizationName: string, teamName: string): void => {
    this.hideNotifications();
    this.updateRoleRequests.clear();
    this.updateAppNotificationAllowed = true;
    apps.forEach((app) => {
      const options: TeamAppsQueryOrOptions = {
        organizationName,
        teamName,
        appName: app.name,
      };

      const teamId = teamStore.compoundKey(organizationName, teamName);
      this.updateRoleRequests.push(
        teamAppStore.updateAssociation(teamId, app.internalId, { permissions: role }, true, options) as any
      );
    });
  };

  public fetch(organizationName: string, teamName: string): void {
    appStore.fetchForManyToMany(teamAppStore, teamStore.compoundKey(organizationName, teamName), { organizationName, teamName });
  }

  public getAppsForTheOrganization(organizationName: string): App[] {
    return appStore.appsForOwner(APP_OWNER_TYPES.ORG, organizationName);
  }

  public getAvailableApps(teamApps: App[], organizationName: string, teamName: string): App[] {
    const allowedApps = this.getAppsForTheOrganization(organizationName).filter((app) =>
      appStore.hasAnyCollaboratorRoleForApp(["manager"], app)
    );
    return differenceWith(allowedApps, teamApps, (allowedApp: IApp, teamApp: IApp) => {
      return (
        allowedApp &&
        teamApp &&
        allowedApp.name === teamApp.name &&
        allowedApp.owner?.name === teamApp.owner?.name &&
        allowedApp.owner?.type === teamApp.owner?.type
      );
    });
  }
}
