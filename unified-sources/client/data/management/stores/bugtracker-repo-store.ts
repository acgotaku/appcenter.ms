import { apiGateway } from "@root/lib/http";
import { Store } from "../../lib";
import { BugTrackerRepo, BugTrackerOwnerRepos, BugTrackerRepos } from "../models";
import { API } from "../constants";
import { appStore } from "@root/stores";
import { computed } from "mobx";

export type BugTrackerRepoOptions = { repoType: string; tokenId: string };

export class BugTrackerRepoStore extends Store<BugTrackerRepo, BugTrackerRepo> {
  protected ModelClass = BugTrackerRepo;

  protected getCollection(query?: BugTrackerRepoOptions): Promise<any> {
    return apiGateway
      .get<BugTrackerRepos>(API.BUGTRACKER_REPOS, {
        params: {
          owner_name: appStore.app.owner.name,
          app_name: appStore.app.name,
          repo_type: query?.repoType,
          token_id: query?.tokenId,
        },
      })
      .then((result: BugTrackerRepos) => {
        return result.repositories;
      });
  }

  @computed
  public get ownerRepos(): BugTrackerOwnerRepos[] {
    if (this.collectionFetchFailed) {
      return [];
    }

    return Object.values(
      this.resources.reduce((map, repo) => {
        if (!map[repo.owner.id]) {
          map[repo.owner.id] = { owner: repo.owner, repos: [repo] } as BugTrackerOwnerRepos;
        } else {
          map[repo.owner.id].repos.push(repo);
        }
        return map;
      }, {})
    );
  }

  protected deserialize(serialized: BugTrackerRepo): BugTrackerRepo {
    return serialized;
  }

  public getGlobalCacheKey() {
    return appStore.app ? appStore.app.id : undefined;
  }

  protected generateIdFromResponse(resource: BugTrackerRepo, query?: any) {
    return resource.id;
  }

  protected getModelId(model: BugTrackerRepo): string | undefined {
    return model.id;
  }
}

export const bugtrackerRepoStore = new BugTrackerRepoStore();
