import { action, computed, observable } from "mobx";
import {
  isValidBugTrackerType,
  bugtrackerRepoStore,
  bugtrackerAccountStore,
  bugtrackerStore,
  BugTrackerType,
  BugTrackerOwnerRepos,
  DeserializedBugTrackerAccount,
  DeserializedBugtrackerSettings,
} from "@root/data/management";
import { locationStore } from "@root/stores";
import { NotificationType, IconName } from "@root/shared";
import { INotificationMessage } from "../../../constants/constants";
import { BugTrackerSettingsUIStore } from "./bugtracker-settings-ui-store";
import { t } from "@root/lib/i18n";

const assertUnreachableType = (t: any) => {
  throw new Error(`Unsupported value for BugTracker type: ${t}`);
};

export enum Step {
  AccountsAndServices,
  Repos,
  Settings,
}

/**
 * UI Store for BugTracker wizard page.
 */
export class BugTrackerWizardUIStore extends BugTrackerSettingsUIStore {
  @observable.ref private currentError?: Error;
  @observable public step: Step = Step.AccountsAndServices;
  @observable public repoFilter?: string;

  @observable private accessToken: string = "";

  public getSearchText(bugTrackerType?: string): string {
    let text = "";
    switch (bugTrackerType) {
      case "github":
        text = t("management:appServices.bugTracker.searchRepositories");
        break;
      case "vsts":
      case "jira":
        text = t("management:appServices.bugTracker.searchProjects");
        break;
    }
    return text;
  }

  public getIcon(accountName: string): IconName {
    const accountNameToIconName: { [K in BugTrackerType]: any } = {
      github: IconName.GitHub,
      vsts: IconName.AzureDevOps,
      jira: IconName.Jira,
    };

    return accountNameToIconName[accountName];
  }

  public getBugtrackerTitle(accountName?: string): string {
    const bugTrackerTitle = {
      github: "Github",
      jira: "Jira",
      vsts: "Azure DevOps",
    };

    return accountName ? bugTrackerTitle[accountName] : "";
  }

  @action
  public setTokendId(tokentId: string) {
    this.bugTracker.tokenId = tokentId;
  }

  public getAccessToken(): string {
    return this.accessToken;
  }

  @action
  public fetchRepos() {
    const repoType = (() => {
      const parts = locationStore.pathname.split("/");
      const lastSegment = parts.pop() || parts.pop();
      return isValidBugTrackerType(lastSegment) ? lastSegment : null;
    })();

    if (this.accessToken && repoType) {
      this.setAccount({
        accessTokenId: this.accessToken,
        externalProviderName: repoType,
        externalUserEmail: "",
        externalAccountName: "",
      });
    }
  }

  public filterAndSetAccount = (accessTokenId: string | undefined) => {
    const account = this.accounts.find((account) => account.accessTokenId === accessTokenId);
    if (account) {
      this.setAccount(account);
    }
  };

  @action
  public setAccessToken(accessToken: string) {
    this.accessToken = accessToken;
  }

  @action
  public setAccount(account: DeserializedBugTrackerAccount) {
    this.bugTracker.tokenId = account.accessTokenId || "";
    this.bugTracker.type = account.externalProviderName!;
    this.currentError = undefined;
    this.setSelectedRepoId(undefined);
    bugtrackerRepoStore.fetchCollection({ repoType: this.bugTracker.type, tokenId: this.bugTracker.tokenId }).onFailure((error) => {
      this.currentError = error;
    });

    this.step = Step.Repos;
  }

  @action
  public setRepoFilter(filter: string) {
    this.repoFilter = filter;
  }

  @computed
  public get hasNext() {
    return this.step === Step.Repos;
  }

  @computed
  public get hasPrevious() {
    return this.step === Step.Repos || this.step === Step.Settings;
  }

  @computed
  public get canAdd() {
    return this.step === Step.Settings;
  }

  public get isAdding() {
    return bugtrackerStore.isCreatingOrUpdating;
  }

  public get canGoNext() {
    const { type } = this.bugTracker;
    switch (type) {
      case "vsts":
        return !!this.bugTracker.settings!.vstsProjectId;
      case "github":
        return !!this.bugTracker.settings!.githubRepoId;
      case "jira":
        return !!this.bugTracker.settings!.jiraProjectId;
      default:
        assertUnreachableType(type);
    }
  }

  @action
  public setStep(step: Step) {
    this.step = step;
  }

  @action
  public next() {
    this.step = Step.Settings;
  }

  @action
  public previous() {
    if (this.step === Step.Repos) {
      this.step = Step.AccountsAndServices;
      locationStore.pushWithCurrentApp(`settings/services/bugtracker/add`);
    } else {
      this.step = Step.Repos;
    }
  }

  @action
  public add() {
    const repo = this.selectedRepo;

    if (!repo) {
      return;
    }

    let settings: Partial<DeserializedBugtrackerSettings> = {
      ownerName: repo.owner?.login,
    };

    switch (this.bugTracker.type) {
      case "vsts":
        settings = {
          ...settings,
          vstsProjectId: repo.id,
          vstsProjectUri: repo.url,
          vstsProjectName: repo.name,
          vstsAccountName: repo.owner?.name,
        };
        break;

      case "github":
        settings = { ...settings, githubRepoId: repo.id, githubRepoUri: repo.url, githubRepoName: repo.name };
        break;

      case "jira":
        settings = { ...settings, jiraProjectId: repo.id, jiraProjectName: repo.name };
        break;
    }

    Object.assign(this.bugTracker.settings as object, settings);
    this.currentError = undefined;
    bugtrackerStore
      .createOrUpdate(this.bugTracker)
      .onSuccess(
        action(() => {
          BugTrackerWizardUIStore.close();
          bugTrackerWizardUIStore.setStep(Step.AccountsAndServices);
        })
      )
      .onFailure((error) => {
        this.currentError = error;
      });
  }

  @action
  public setSelectedRepoId(repoId?: string) {
    const { type } = this.bugTracker;

    // In case of VSTS, set the default area path to the name of the project
    if (type === "vsts") {
      this.bugTracker.settings!.vstsProjectId = repoId;
      if (this.selectedRepo) {
        this.setArea(this.selectedRepo.name || "");
      }
    } else if (type === "github") {
      this.bugTracker.settings!.githubRepoId = repoId;
    } else if (type === "jira") {
      this.bugTracker.settings!.jiraProjectId = repoId;
    } else {
      assertUnreachableType(type);
    }
  }

  @computed
  public get accounts(): DeserializedBugTrackerAccount[] {
    return bugtrackerAccountStore.resources;
  }

  public static close() {
    locationStore.pushWithCurrentApp(`settings/services`);
  }

  @computed
  public get selectedRepoName() {
    const repo = this.selectedRepo;
    return repo ? repo.name : null;
  }

  @computed
  public get selectedRepoId(): string | undefined {
    const { type } = this.bugTracker;
    switch (type) {
      case "vsts":
        return this.bugTracker.settings!.vstsProjectId;
      case "github":
        return this.bugTracker.settings!.githubRepoId;
      case "jira":
        return this.bugTracker.settings!.jiraProjectId;
      case undefined:
        return undefined;
      default:
        assertUnreachableType(type);
    }
  }

  @computed
  public get selectedRepo() {
    const repo =
      bugtrackerRepoStore.resources && this.selectedRepoId
        ? bugtrackerRepoStore.resources.find((repo) => repo.id === this.selectedRepoId)
        : null;
    return repo ? repo : null;
  }

  @computed
  public get repos(): BugTrackerOwnerRepos[] {
    return this.repoFilter
      ? bugtrackerRepoStore.ownerRepos
          .map((ownerRepo) => ({
            owner: ownerRepo.owner,
            repos: ownerRepo.repos.filter(
              (repo) => this.repoFilter && repo.name?.toLowerCase().includes(this.repoFilter.toLowerCase())
            ),
          }))
          .filter((ownerRepo) => ownerRepo.repos.length > 0)
      : bugtrackerRepoStore.ownerRepos;
  }

  @computed
  public get isFetching() {
    return bugtrackerAccountStore.isFetchingCollection || bugtrackerRepoStore.isFetchingCollection;
  }

  @computed
  public get isFetchingRepos() {
    return bugtrackerRepoStore.isFetchingCollection;
  }

  @computed
  public get notification(): INotificationMessage | undefined {
    // Check for errors while fetching accounts.
    if (bugtrackerAccountStore.collectionFetchFailed) {
      return {
        type: NotificationType.Error,
        message: bugtrackerAccountStore.collectionFetchError!.message,
      };
    }

    // Check for errors while fetching repos and creation.
    if (this.currentError) {
      return {
        type: NotificationType.Error,
        message: this.currentError.message,
      };
    }
  }
}

export const bugTrackerWizardUIStore = new BugTrackerWizardUIStore();
