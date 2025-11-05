import { observable, computed } from "mobx";
import { Model } from "../../lib";

const bugTrackerType: { [key: string]: BugTrackerType } = {
  Github: "github",
  VSTS: "vsts",
  Jira: "jira",
};

export function isValidBugTrackerType(type?: string): type is BugTrackerType {
  return !!type && Object.values(bugTrackerType).includes(type as any);
}

export type BugTrackerEventType = "NewCrashGroupCreated" | "NewAppRelease";
export type BugTrackerType = "github" | "vsts" | "jira";
export type BugTrackerState = "enabled" | "disabled" | "unauthorized";

export interface SerializedBugtrackerSettings {
  callback_url?: string;
  owner_name: string;

  vsts_project_id?: string;
  vsts_project_uri?: string;
  vsts_project_name?: string;
  vsts_account_name?: string;
  vsts_area_path?: string;
  vsts_default_payload?: { [key: string]: string };

  github_repo_id?: string;
  github_repo_name?: string;
  github_repo_uri?: string;
  github_label?: string;

  jira_project_id?: string;
  jira_project_name?: string;
}

export interface DeserializedBugtrackerSettings {
  callbackUrl: string;
  ownerName: string;

  vstsProjectId?: string;
  vstsProjectUri: string;
  vstsProjectName: string;
  vstsAccountName: string;
  vstsAreaPath: string;
  vstsDefaultPayload: string;

  githubRepoId?: string;
  githubRepoName: string;
  githubRepoUri: string;
  githubLabel: string;

  jiraProjectId?: string;
  jiraProjectName: string;
}

export interface SerializedBugTracker {
  type?: string;
  state?: BugTrackerState;
  token_id: string;
  event_types: BugTrackerEventType[];
  settings?: SerializedBugtrackerSettings;
}

export interface DeserializedBugTracker {
  type?: BugTrackerType;
  state?: BugTrackerState;
  tokenId?: string;
  settings?: Partial<DeserializedBugtrackerSettings>;
  eventTypes?: { [key in BugTrackerEventType]: boolean };
}

export class BugTracker extends Model<DeserializedBugTracker> implements DeserializedBugTracker {
  @observable public type?: BugTrackerType;
  @observable public state?: BugTrackerState;
  @observable public tokenId?: string;
  @observable public settings?: DeserializedBugtrackerSettings;
  @observable public eventTypes: DeserializedBugTracker["eventTypes"];

  constructor(initialValues: Partial<DeserializedBugTracker> = {}) {
    // Ensure leaves are all initialized so MobX will track them
    const defaultSettings: Partial<DeserializedBugtrackerSettings> = {
      callbackUrl: undefined,
      ownerName: undefined,
      vstsProjectId: undefined,
      vstsProjectUri: undefined,
      vstsProjectName: undefined,
      vstsAccountName: undefined,
      vstsAreaPath: undefined,
      vstsDefaultPayload: undefined,
      githubRepoId: undefined,
      githubRepoName: undefined,
      githubRepoUri: undefined,
      githubLabel: undefined,
      jiraProjectId: undefined,
      jiraProjectName: undefined,
    };
    const defaultEventTypes: DeserializedBugTracker["eventTypes"] = {
      NewCrashGroupCreated: true,
      NewAppRelease: false,
    };

    super({
      state: "enabled",
      ...initialValues,
      settings: {
        ...defaultSettings,
        ...initialValues.settings,
      },
      eventTypes: {
        ...defaultEventTypes,
        ...initialValues.eventTypes,
      },
    });
  }

  @computed get isValid() {
    const { vstsAreaPath, vstsDefaultPayload } = this.settings!;

    if (this.type === "vsts") {
      return (
        vstsAreaPath &&
        vstsAreaPath.length >= BugTracker.areaValidations.minLength &&
        vstsAreaPath.length <= BugTracker.areaValidations.maxLength &&
        (!vstsDefaultPayload ||
          (vstsDefaultPayload.length <= BugTracker.payloadValidations.maxLength &&
            BugTracker.payloadValidations.isValidPayload(null, vstsDefaultPayload)))
      );
    }

    return true;
  }

  public static readonly areaValidations = {
    minLength: 2,
    maxLength: 64,
  };

  public static readonly payloadValidations = {
    maxLength: 512,
    isValidPayload: (_, value: string) => {
      if (!value) {
        return true;
      }
      try {
        const json = JSON.parse(value);
        for (value in Object.values(json)) {
          if (typeof value !== "string") {
            return false;
          }
        }

        return true;
      } catch (exc) {
        return false;
      }
    },
  };
}
