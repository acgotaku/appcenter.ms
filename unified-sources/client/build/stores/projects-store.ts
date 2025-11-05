import { observable, computed, action } from "mobx";
import { IApp, IHttpOptions } from "@lib/common-interfaces";
import { apiGateway } from "@root/lib/http";
import { CIBaseStore } from "./ci-base-store";
import { IToolsetProjects, EXTENDED_REPO_SEARCH_DEPTH } from "@root/data/build";
import { noop } from "lodash";
import { appFeaturesStore } from "@root/stores";

/**
 * ProjectsStore fetches and stores the projects for a given app
 */
export class ProjectsStore extends CIBaseStore<IToolsetProjects> {
  private fetchPromise?: Promise<IToolsetProjects>;

  private branch?: string;
  private lastCommitSha?: string;

  constructor(app: IApp, branch: string) {
    super(app);

    this.branch = branch;
  }

  @observable
  public failedDependencies: number = 0;

  @computed
  public get hasData(): boolean {
    return this.isLoaded && this.data != null;
  }

  private fetch(hash: string, nested?: boolean): Promise<IToolsetProjects> {
    if (this.fetchPromise && !nested) {
      this.fetchPromise = undefined;
    }

    const path = this.getPathWithSlug("branches/:branch/toolset_projects");

    const options: IHttpOptions = {
      params: {},
    };

    const queryParams = {
      branch: this.branch,
      os: this.app && this.app.os,
      platform: (this.app && this.app.platform) || "Objective-C-Swift",
    };
    const maxSearchParams = appFeaturesStore.isBuildExtendedBranchSearchDepthActive(this.app?.id)
      ? {
          maxSearchDepth: EXTENDED_REPO_SEARCH_DEPTH,
        }
      : {};
    const params = { ...queryParams, ...maxSearchParams };
    Object.assign(options.params as object, params);

    this.lastCommitSha = hash;

    const promise = apiGateway.get<IToolsetProjects>(path, options).catch(
      action((err: any) => {
        if (err && err.status === 424) {
          const numFailed = this.failedDependencies;
          if (numFailed > 50) {
            throw err;
          }
          this.failedDependencies = numFailed + 1;
          return Promise.delay(5000).then(() => {
            return this.fetch(hash, true);
          });
        }
        throw err;
      })
    );

    if (nested) {
      return promise;
    }
    this.fetchPromise = promise;

    return this.load(this.fetchPromise).then((projects) => {
      if (this.failedDependencies > 0) {
        this.failedDependencies = 0;
      }
      return projects;
    });
  }

  public fetchForCommit(hash: string) {
    // tslint:disable-next-line:possible-timing-attack
    if (hash === this.lastCommitSha && this.fetchPromise && !this.fetchPromise.isRejected()) {
      return;
    }
    this.fetch(hash).catch(noop);
  }
}
