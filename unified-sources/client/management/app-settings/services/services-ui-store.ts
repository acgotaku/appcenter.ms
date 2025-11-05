import { action, computed, observable } from "mobx";
import { bugtrackerStore, bugtrackerAccountStore, DeserializedBugTrackerAccount, BugTrackerType } from "@root/data/management";
import { IconName } from "@root/shared";
import { locationStore, appStore } from "@root/stores";
import { NotificationType } from "@root/shared";
import { INotificationMessage } from "../../constants/constants";
import { FetchError } from "@root/lib/http/fetch-error";
import { logger } from "@root/lib/telemetry";
import { ServicesStore } from "@root/management/app-settings/services/services-store";
import { ServiceConnectionDialogFormUIStore } from "./service-connection-dialog-form-ui-store";
import { bugTrackerWizardUIStore } from "./bugtracker/bugtracker-wizard-ui-store";

const assertUnreachableType = (t: any) => {
  throw new Error(`Unsupported value for BugTracker type: ${t}`);
};

/**
 * UI Store for Services page.
 */
export class ServicesUIStore {
  public serviceConnectionDialogFormUIStore = new ServiceConnectionDialogFormUIStore();

  @observable public disconnectBugTrackerWarningIsVisible = false;

  public getIcon(accountName: string): IconName {
    const accountNameToIconName: { [K in BugTrackerType]: IconName } = {
      github: IconName.GitHub,
      vsts: IconName.AzureDevOps,
      jira: IconName.Jira,
    };

    return accountNameToIconName[accountName];
  }

  public getBugtrackerTitle(accountName: string): string {
    const accountNameToTitle = {
      github: "GitHub",
      vsts: "Azure DevOps",
      jira: "Jira",
    };

    return accountNameToTitle[accountName];
  }

  @action
  public fetchBugTrackers(accessTokenId?: string) {
    bugtrackerStore.fetchBugTrackerSettings(accessTokenId);
    bugtrackerAccountStore.fetchCollection();
  }

  @computed
  public get connectedBugTracker() {
    const bugTrackerSettings = bugtrackerStore.bugTracker;
    if (!bugTrackerSettings || !bugTrackerSettings.settings) {
      return null;
    }

    let repo;
    switch (bugTrackerSettings.type) {
      case "github":
        repo = bugTrackerSettings.settings.githubRepoName;
        break;
      case "vsts":
        repo = `${bugTrackerSettings.settings.vstsAccountName}/${bugTrackerSettings.settings.vstsProjectName}`;
        break;
      case "jira":
        repo = bugTrackerSettings.settings.jiraProjectName;
        break;
      default:
        assertUnreachableType(bugTrackerSettings.type);
    }

    return {
      type: bugTrackerSettings.type,
      state: bugTrackerSettings.state,
      account: (bugTrackerSettings.type === "github" ? "@" : "") + bugTrackerSettings.settings.ownerName,
      repo,
    };
  }

  @computed
  public get showUnauthorizedAction(): boolean {
    if (this.connectedBugTracker) {
      return this.connectedBugTracker.state!.toLowerCase() === "unauthorized";
    }

    return false;
  }

  @action
  public reauthenticateConnectedBugtracker = () => {
    if (this.connectedBugTracker) {
      switch (this.connectedBugTracker.type) {
        case "github":
        case "vsts": {
          location.replace(
            ServicesStore.buildAuthUrl(this.connectedBugTracker.type, locationStore.getUrlWithCurrentApp("/settings/services"))
          );
          break;
        }
        case "jira": {
          this.serviceConnectionDialogFormUIStore.setServiceAndShowForm(ServicesStore.bugTrackerServices[2], (connection) => {
            bugtrackerStore.fetchBugTrackerSettings(connection!.id);
          });
          break;
        }
      }
    }
  };

  @computed
  public get connectedBugTackerAccounts() {
    return bugtrackerAccountStore.resources;
  }

  @computed
  public get isFetchingBugTracker() {
    return bugtrackerAccountStore.isFetchingCollection || bugtrackerStore.isFetchingSettings;
  }

  @computed
  public get isFetchingBugTrackerSettings() {
    return bugtrackerStore.isFetchingSettings;
  }

  public addAccountOrService() {
    logger.info("app-services-add-account-or-service");
    bugTrackerWizardUIStore.setAccessToken("");
    locationStore.pushWithCurrentApp(`settings/services/bugtracker/add`);
  }

  public pushWithAccountLink(account: DeserializedBugTrackerAccount) {
    bugTrackerWizardUIStore.setAccessToken(account.accessTokenId || "");
    locationStore.pushWithCurrentApp(`settings/services/bugtracker/add/${account.externalProviderName?.toLowerCase()}`);
  }

  public configureBugTracker() {
    logger.info("app-services-configure-bugtracker");
    locationStore.pushWithCurrentApp(`settings/services/bugtracker/configure`);
  }

  @computed
  public get userCanEdit() {
    return appStore.hasAnyCollaboratorRole(["manager", "developer"]);
  }

  @computed
  public get servicesCount() {
    return this.isFetchingBugTracker ? null : bugtrackerStore.bugTracker ? 1 : 0;
  }

  @action
  public disconnectBugTracker() {
    this.disconnectBugTrackerWarningIsVisible = true;
  }

  @action
  public cancelDisconnectBugTracker() {
    this.disconnectBugTrackerWarningIsVisible = false;
  }

  @action
  public finishDisconnectBugTracker() {
    logger.info("app-services-disconnected-bugtracker");
    bugtrackerStore.deleteBugTrackerSettings();
    this.disconnectBugTrackerWarningIsVisible = false;
  }

  @computed
  public get notification(): INotificationMessage | undefined {
    // Check for errors while fetching bugtracker settings.
    if (bugtrackerStore.fetchBugTrackerSettingsError && (bugtrackerStore.fetchBugTrackerSettingsError as FetchError).status !== 404) {
      return {
        type: NotificationType.Error,
        message: bugtrackerStore.fetchBugTrackerSettingsError.message,
      };
    }

    // Check for errors while fetching bugtracker accounts.
    if (bugtrackerAccountStore.collectionFetchFailed) {
      return {
        type: NotificationType.Error,
        message: bugtrackerAccountStore.collectionFetchError!.message,
      };
    }

    // Check for errors while deleting bugtracker settings.
    if (bugtrackerStore.deleteBugTrackerSettingsError) {
      return {
        type: NotificationType.Error,
        message: bugtrackerStore.deleteBugTrackerSettingsError.message,
      };
    }
  }
}
