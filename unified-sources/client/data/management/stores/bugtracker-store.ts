import { apiGateway } from "@root/lib/http";
import { reduce } from "lodash";
import { Store, ResourceRequest } from "../../lib";
import {
  SerializedBugTracker,
  DeserializedBugTracker,
  BugTracker,
  SerializedBugtrackerSettings,
  BugTrackerEventType,
  isValidBugTrackerType,
} from "../models";
import { API } from "../constants";
import { appStore } from "@root/stores";
import { RESPONSE_TYPES } from "@lib/common-interfaces";
import { action, computed, observable } from "mobx";

const ResourceId = "0";

export class BugTrackerStore extends Store<DeserializedBugTracker, SerializedBugTracker, BugTracker> {
  @observable
  private updateStateRequest?: ResourceRequest<{}>;

  protected ModelClass = BugTracker;

  @action
  public fetchBugTrackerSettings(accessTokenId?: string): ResourceRequest<BugTracker | undefined, SerializedBugTracker> {
    if (accessTokenId) {
      return this.fetchOne(ResourceId).onSuccess(() => {
        this.updateStateRequest = new ResourceRequest(
          apiGateway.put(API.BUGTRACKER_UPDATE_STATE, {
            params: {
              owner_name: appStore.app.owner.name,
              app_name: appStore.app.name,
            },
            body: {
              token_id: accessTokenId,
            },
          }),
          undefined,
          () => this.fetchOne(ResourceId)
        );
      });
    }
    return this.fetchOne(ResourceId);
  }

  @computed
  public get bugTracker() {
    return this.resources.length > 0 ? this.resources[0] : null;
  }

  public get fetchBugTrackerSettingsError() {
    return this.fetchError(ResourceId);
  }

  public get updateBugTrackerSettingsError() {
    return this.updateError(ResourceId);
  }

  public get deleteBugTrackerSettingsError() {
    return this.deletionError(ResourceId);
  }

  public get isCreatingOrUpdating() {
    return this.isUpdating(ResourceId);
  }

  @action
  public createOrUpdate(changes: DeserializedBugTracker) {
    const isNew = this.resources.length === 0;
    const resource = isNew ? new BugTracker(changes) : this.bugTracker;
    this.add(resource!);

    return this.update(resource!, changes, false).onFailure(() => {
      if (isNew) {
        this.remove(resource!);
      }
    });
  }

  public deleteBugTrackerSettings() {
    return this.delete(ResourceId);
  }

  @computed
  public get isFetchingSettings() {
    return this.isFetching(ResourceId) || (this.updateStateRequest && this.updateStateRequest.isPending);
  }

  protected deserialize(serialized: SerializedBugTracker): DeserializedBugTracker {
    const type = serialized.type?.toLowerCase();
    if (!isValidBugTrackerType(type)) {
      throw new Error(`Unsupported bug tracker type: ${type}`);
    }

    const payload =
      serialized.settings?.vsts_default_payload && Object.keys(serialized.settings.vsts_default_payload).length > 0
        ? JSON.stringify(serialized.settings.vsts_default_payload)
        : null;

    return {
      type,
      state: serialized.state,
      tokenId: serialized.token_id,
      settings: serialized.settings && {
        callbackUrl: serialized.settings.callback_url,
        ownerName: serialized.settings.owner_name,
        vstsProjectId: serialized.settings.vsts_project_id,
        vstsProjectUri: serialized.settings.vsts_project_uri,
        vstsProjectName: serialized.settings.vsts_project_name,
        vstsAccountName: serialized.settings.vsts_account_name,
        vstsAreaPath: serialized.settings.vsts_area_path,
        vstsDefaultPayload: payload!,
        githubRepoId: serialized.settings.github_repo_id,
        githubRepoName: serialized.settings.github_repo_name,
        githubRepoUri: serialized.settings.github_repo_id,
        githubLabel: serialized.settings.github_label,
        jiraProjectId: serialized.settings.jira_project_id,
        jiraProjectName: serialized.settings.jira_project_name,
      },
      eventTypes: {
        NewCrashGroupCreated: serialized.event_types.includes("NewCrashGroupCreated"),
        NewAppRelease: serialized.event_types.includes("NewAppRelease"),
      },
    };
  }

  protected getResource(id: string, query?: any): Promise<SerializedBugTracker> {
    return apiGateway.get<SerializedBugTracker>(API.BUGTRACKER, {
      params: {
        owner_name: appStore.app.owner.name,
        app_name: appStore.app.name,
      },
    });
  }

  protected patchResource(resource: BugTracker, changes: Partial<DeserializedBugTracker>, options?: any): Promise<any> {
    const update = Object.assign({}, resource, changes);
    const settings: SerializedBugtrackerSettings | undefined = update.settings && {
      callback_url: update.settings.callbackUrl,
      owner_name: update.settings.ownerName,
      vsts_project_id: update.settings.vstsProjectId,
      vsts_project_uri: update.settings.vstsProjectUri,
      vsts_project_name: update.settings.vstsProjectName,
      vsts_account_name: update.settings.vstsAccountName,
      vsts_area_path: update.settings.vstsAreaPath,
      vsts_default_payload: update.settings.vstsDefaultPayload ? JSON.parse(update.settings.vstsDefaultPayload) : null,
      github_repo_id: update.settings.githubRepoId,
      github_repo_name: update.settings.githubRepoName,
      github_repo_uri: update.settings.githubRepoUri,
      github_label: update.settings.githubLabel,
      jira_project_id: update.settings.jiraProjectId,
      jira_project_name: update.settings.jiraProjectName,
    };

    const payload: SerializedBugTracker = {
      type: update.type,
      state: update.state,
      token_id: update.tokenId || "",
      settings,
      event_types: reduce(
        update.eventTypes!,
        (types: BugTrackerEventType[], value: boolean, key: BugTrackerEventType) => (value ? [...types, key] : types),
        []
      ),
    };

    return apiGateway.put<SerializedBugTracker>(API.BUGTRACKER, {
      params: {
        owner_name: appStore.app.owner.name,
        app_name: appStore.app.name,
      },
      body: payload,
    });
  }

  protected deleteResource(resource: BugTracker): Promise<any> {
    return apiGateway.delete(API.BUGTRACKER, {
      params: {
        owner_name: appStore.app.owner.name,
        app_name: appStore.app.name,
      },
      responseType: RESPONSE_TYPES.TEXT,
    });
  }

  public getGlobalCacheKey() {
    return appStore.app ? appStore.app.id : undefined;
  }

  protected generateIdFromResponse(resource: SerializedBugTracker, query?: any) {
    return ResourceId;
  }

  protected getModelId(model: BugTracker): string {
    return ResourceId;
  }
}

export const bugtrackerStore = new BugTrackerStore();
