import { computed, observable, action } from "mobx";
import { compact } from "lodash";
import { NotificationType } from "@root/shared";
import { IOrganization } from "@lib/common-interfaces";
import { FetchError } from "@root/lib/http/fetch-error";
import { appStore, locationStore, userStore, organizationStore } from "@root/stores";
import { getTransferAppStore } from "../stores/apps/transfer-app-store";
import { appUsersStore } from "../stores/user/app-users-store";
import {
  webhookStore,
  exportConfigurationStore,
  bugtrackerStore,
  teamStore,
  teamAppStore,
  TeamAppsQueryOrOptions,
  Team,
} from "@root/data/management";
import {
  appNotificationSettingsStore,
  deserializeEventType,
} from "@root/management/app-settings/notifications/data/notifications-store";
import { t } from "@root/lib/i18n";
import { EventValue } from "@root/management/app-settings/notifications/data/notifications-model";
import { EventType } from "@root/data/management";
import { dataSettingsStore } from "@root/data/management/stores/data-settings-store";
import { appApiTokenStore } from "@root/data/management/stores";
import { App } from "@root/data/shell/models";

const toBoolean = (eventValue: EventValue): boolean => eventValue !== EventValue.Disabled;

(window as any).appNotificationSettingsStore = appNotificationSettingsStore;

export class AppSettingsUIStore {
  @observable
  public deleteAppDialogIsVisible = false;

  constructor() {
    const { app } = appStore;
    appUsersStore.fetchAppUsers(appStore.app);
    dataSettingsStore.fetchOne(appStore.app.id);
    appNotificationSettingsStore.fetch();
    webhookStore.fetchCollection();
    bugtrackerStore.fetchBugTrackerSettings();
    exportConfigurationStore.fetchCollection({
      ownerName: appStore.app.owner.name,
      appName: appStore.app.name,
    });
    if (app.isOrgApp) {
      teamStore.fetchForManyToMany(teamAppStore, app.internalId, {
        organizationName: app.owner.name,
        appName: app.name,
      });
    }
    appApiTokenStore.fetchCollection();
  }

  @computed
  get deleteNotification() {
    if (!appStore.deletionFailed(appStore.app)) {
      return undefined;
    }
    return {
      type: NotificationType.Error,
      message: ((error) => {
        switch (error.status) {
          case 404:
            return t("management:appSettings.deleteErrors.appNotFoundError");
          case 403:
            return t("management:appSettings.deleteErrors.notAllowedError");
          default:
            return t("management:appSettings.deleteErrors.deletionFailedError");
        }
      })(appStore.deletionError<FetchError>(appStore.app)),
    };
  }

  @computed public get isPending() {
    return appUsersStore.isPending || appNotificationSettingsStore.isPending || webhookStore.isFetchingCollection;
  }

  @computed public get peopleSubtitle() {
    if (appUsersStore.isPending || teamStore.isFetchingCollection) {
      return undefined;
    }
    if (!this.appUsersSubtitle && !this.teamsSubtitle) {
      return t("management:appSettings.noPeople");
    }
    return this.appUsersSubtitle ? compact([this.appUsersSubtitle, this.teamsSubtitle]).join(", ") : this.teamsSubtitle;
  }

  @computed public get dataSubtitle() {
    const appPolicy = dataSettingsStore.get(appStore.app.id);
    if (dataSettingsStore.isFetching() || dataSettingsStore.fetchFailed() || !appPolicy) {
      return undefined;
    }

    return t("management:appData.retention.xDays", { x: appPolicy.retentionInDays });
  }

  @computed private get appUsersSubtitle() {
    if (appUsersStore.users.length === 0) {
      return undefined;
    }
    return t("management:appSettings.collaboratorsSubtitle", { users: appUsersStore.users, count: appUsersStore.users.length });
  }

  @computed private get teamsSubtitle(): string | undefined {
    let teamCount = this.teams.length;
    // If app belongs to an Org, Org admins is a team that has default access.
    const { app } = appStore;
    if (app.isOrgApp) {
      teamCount++;
    }
    if (teamCount === 0) {
      return undefined;
    }
    return t("management:appSettings.teamsSubtitle", { teamCount, count: teamCount });
  }

  @computed public get webhooksSubtitle() {
    if (!webhookStore.isFetchingCollection) {
      if (webhookStore.isEmpty) {
        return t("management:appSettings.noWebhooks");
      }

      return t("management:appSettings.webhooksSubtitle", {
        webhooks: webhookStore.resources.length,
        count: webhookStore.resources.length,
      });
    }
  }

  @computed public get exportConfigurationsSubtitle() {
    if (!exportConfigurationStore.isFetchingCollection) {
      if (exportConfigurationStore.isEmpty) {
        return t("management:appSettings.noExportConfigurations");
      }
    }
  }

  @computed public get exportConfigurationsCounts() {
    if (!exportConfigurationStore.isFetchingCollection) {
      if (exportConfigurationStore.isEmpty) {
        return null;
      }
      return [
        {
          name: "analytics",
          count: exportConfigurationStore.resources.length,
        },
      ];
    }
  }

  @computed public get servicesSubtitle() {
    if (!bugtrackerStore.isFetchingSettings) {
      const nbServices = bugtrackerStore.bugTracker ? 1 : 0;
      if (nbServices === 0) {
        return t("management:appSettings.noServices");
      }
      return t("management:appSettings.servicesSubtitle", { services: nbServices, count: nbServices });
    }
  }

  public get collaborators() {
    return appUsersStore.users;
  }

  @computed
  public get teams() {
    return teamStore.getTeamsForApp(appStore.app);
  }

  @computed get apiTokenCount(): number | undefined {
    return !appApiTokenStore.isFetchingCollection && !appApiTokenStore.collectionFetchFailed
      ? appApiTokenStore.resources.length
      : undefined;
  }

  public get shouldShowCollaboratorsSkeletons() {
    return appUsersStore.isPending || teamStore.isFetchingCollection;
  }

  @computed public get notificationsEnabled() {
    return appNotificationSettingsStore.data && appNotificationSettingsStore.data.enabled;
  }

  @computed public get notificationsSubtitle() {
    if (appNotificationSettingsStore.isLoaded && !this.notificationsEnabled) {
      return t("state.disabled");
    } else if (appNotificationSettingsStore.isLoaded && !this.notificationSummary) {
      return t("state.none");
    }
  }

  @computed
  public get notificationSettings() {
    if (!appNotificationSettingsStore.isLoaded) {
      return [];
    }
    const { settings } = appNotificationSettingsStore.serialize(appNotificationSettingsStore.data);
    return settings;
  }

  @computed
  public get notificationSummary() {
    if (!appNotificationSettingsStore.isLoaded) {
      return null;
    }

    const settings = deserializeEventType(appNotificationSettingsStore.serialize(appNotificationSettingsStore.data).settings);
    const summaryKeys: string[] = [];
    if (
      [
        EventType.BuildCompleteSucceeded,
        EventType.BuildCompleteFixed,
        EventType.BuildCompleteFailed,
        EventType.BuildCompleteBroken,
      ].every((eventType) => toBoolean(settings[eventType]))
    ) {
      summaryKeys.push("management:notifications.summary.allBuilds");
    } else if (
      [EventType.BuildCompleteSucceeded, EventType.BuildCompleteFixed, EventType.BuildCompleteBroken].every((eventType) =>
        toBoolean(settings[eventType])
      )
    ) {
      summaryKeys.push("management:notifications.summary.allSuccessfulBuilds");
      summaryKeys.push("management:notifications.summary.brokenBuilds");
    } else if (
      [EventType.BuildCompleteFixed, EventType.BuildCompleteFailed, EventType.BuildCompleteBroken].every((eventType) =>
        toBoolean(settings[eventType])
      )
    ) {
      summaryKeys.push("management:notifications.summary.fixedBuilds");
      summaryKeys.push("management:notifications.summary.allFailedBuilds");
    } else if ([EventType.BuildCompleteFixed, EventType.BuildCompleteBroken].every((eventType) => toBoolean(settings[eventType]))) {
      summaryKeys.push("management:notifications.summary.fixedBuilds");
      summaryKeys.push("management:notifications.summary.brokenBuilds");
    } else if ([EventType.BuildCompleteSucceeded, EventType.BuildCompleteFixed].every((eventType) => toBoolean(settings[eventType]))) {
      summaryKeys.push("management:notifications.summary.allSuccessfulBuilds");
    } else if ([EventType.BuildCompleteFailed, EventType.BuildCompleteBroken].every((eventType) => toBoolean(settings[eventType]))) {
      summaryKeys.push("management:notifications.summary.allFailedBuilds");
    } else if (toBoolean(settings[EventType.BuildCompleteFixed])) {
      summaryKeys.push("management:notifications.summary.fixedBuilds");
    } else if (toBoolean(settings[EventType.BuildCompleteBroken])) {
      summaryKeys.push("management:notifications.summary.brokenBuilds");
    }

    if (toBoolean(settings[EventType.NewAppRelease])) {
      summaryKeys.push("management:notifications.summary.versionDistributed");
    }

    if (toBoolean(settings[EventType.NewCrashGroupCreated])) {
      summaryKeys.push("management:notifications.summary.crashGroup");
    }

    if (
      [EventType.TestRunFinished, EventType.TestRunCancelled, EventType.TestRunInvalid, EventType.TestRunTimedOut].every((eventType) =>
        toBoolean(settings[eventType])
      )
    ) {
      summaryKeys.push("management:notifications.summary.testRunCompleted");
    }

    if (
      [EventType.ResignGenericFailure, EventType.ResignCertificateMismatch, EventType.ResignInvalidCredentials].every((eventType) =>
        toBoolean(settings[eventType])
      )
    ) {
      summaryKeys.push("management:notifications.summary.addingDevicesToReleaseFailed");
    }

    return summaryKeys.length > 0 ? summaryKeys : null;
  }

  public get isDeletingApp() {
    return appStore.isDeleting(appStore.app);
  }

  @computed public get secondaryNavItems() {
    const navItems: any[] = [];

    if (this.userCan.editDetails) {
      navItems.push({
        route: locationStore.getUrlWithCurrentApp("settings/details"),
        title: t("management:appDetails.title"),
      });
    }

    if (this.userCan.seeCollaborators) {
      navItems.push({
        route: locationStore.getUrlWithCurrentApp("settings/collaborators"),
        title: t("management:common.collaborators.title"),
      });
    }

    if (this.userCan.seeServices) {
      navItems.push({
        route: locationStore.getUrlWithCurrentApp("settings/services"),
        title: t("management:appServices.title"),
      });
    }

    if (this.userCan.seeWebhooks) {
      navItems.push({
        route: locationStore.getUrlWithCurrentApp("settings/webhooks"),
        title: t("management:appWebhooks.title"),
      });
    }

    if (this.userCan.seeExport) {
      navItems.push({
        route: locationStore.getUrlWithCurrentApp("settings/export"),
        title: t("management:appExport.title"),
      });
    }

    navItems.push({
      route: locationStore.getUrlWithCurrentApp("settings/notifications"),
      title: t("management:notifications.title"),
    });

    if (this.userCan.seeAppApiTokens) {
      navItems.push({
        route: locationStore.getUrlWithCurrentApp("settings/apitokens"),
        title: t("management:appApiTokens.title"),
      });
    }

    return navItems;
  }

  public userCan = observable({
    get deleteApp() {
      return appStore.hasAnyCollaboratorRole(["manager"]);
    },

    get editDetails() {
      return appStore.hasAnyCollaboratorRole(["manager"]);
    },

    get changeNotifications() {
      return true;
    },

    get seeCollaborators() {
      return true;
    },

    get seeAppSecret() {
      return appStore.hasAnyCollaboratorRole(["manager", "developer"]);
    },

    get seeExport() {
      return appStore.hasAnyCollaboratorRole(["manager", "developer"]);
    },

    get seeAppApiTokens() {
      return appStore.hasAnyCollaboratorRole(["manager", "developer"]);
    },

    get transferApp() {
      const { app } = appStore;

      const { currentUser } = userStore;
      const isCurrentUserTheAppOwner = currentUser.name === app.owner.name;
      const userToOrgTransfer = app.isUserApp && isCurrentUserTheAppOwner;
      const isAppManager = appStore.hasAnyCollaboratorRole(["manager"]);
      const orgToOrgTransfer = app.isOrgApp && isAppManager;

      return userToOrgTransfer || orgToOrgTransfer;
    },

    get editServices() {
      return appStore.hasAnyCollaboratorRole(["manager"]);
    },

    get seeServices() {
      return true;
    },

    get editWebhooks() {
      return appStore.hasAnyCollaboratorRole(["manager"]);
    },

    get seeWebhooks() {
      return true;
    },

    get editExportConfigurations() {
      return appStore.hasAnyCollaboratorRole(["manager", "developer"]);
    },
  });

  public launchTransferAppDialog = () => {
    const store = getTransferAppStore(appStore.app);
    store.resetState();
    store.setNewOwnerName(null as any);
    store.showTransferConfirmationDialog();
  };

  @action
  public launchDeleteAppDialog = () => {
    this.deleteAppDialogIsVisible = true;
  };

  @action
  public cancelDeletingApp = () => {
    this.deleteAppDialogIsVisible = false;
  };

  public deleteApp = () => {
    const { app } = appStore;
    const orgName = app.owner;
    const teams = this.teams;
    const teamsRemoved: Team[] = [];
    const appId = App.internalAppId(app.owner.name, app.name);
    let teamsDisassociated: number = 0;
    //if belongs to no teams
    if (teams.length === 0) {
      appStore
        .delete(app, false)
        .onSuccess(() => {
          app.isUserApp
            ? locationStore.pushAppList()
            : locationStore.router.push(organizationStore.homePageUrl(app.owner as IOrganization) as any);
        })
        .onFailure(() => {
          this.cancelDeletingApp();
        });
    } else {
      teams.forEach((team) => {
        const options: TeamAppsQueryOrOptions = {
          organizationName: orgName.name,
          teamName: team.name,
          appName: app.name,
        };

        teamAppStore.disassociate(teamStore.compoundKey(orgName.name, team.name), appId, true, options).onSuccess(() => {
          teamsDisassociated++;
          teamsRemoved.push(team);
          // once removed from every team, delete
          if (teamsDisassociated === teams.length) {
            appStore
              .delete(app, false)
              .onSuccess(() => {
                app.isUserApp
                  ? locationStore.pushAppList()
                  : locationStore.router.push(organizationStore.homePageUrl(app.owner as IOrganization) as any);
              })
              .onFailure(() => {
                this.cancelDeletingApp();
                //now re-associate all teams that were disassociated
                teamsRemoved.forEach((removedTeam) => {
                  const restoreOptions: TeamAppsQueryOrOptions = {
                    organizationName: orgName.name,
                    teamName: removedTeam.name,
                    appName: app.name,
                  };
                  teamAppStore.associate(teamStore.compoundKey(orgName.name, removedTeam.name), appId, true, restoreOptions);
                });
              });
          }
        });
      });
    }
  };

  public resetDataStoreStates() {
    appUsersStore.resetStates();
    appUsersStore.resetData();
  }
}
