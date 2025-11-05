import { observable, action, computed } from "mobx";
import { apiGateway } from "@root/lib/http";
import { CIBaseStore } from "./ci-base-store";
import { IAHCommit } from "@root/data/build";
import { ciStore } from "./ci-store";
import { chunk } from "lodash";

export class CommitsStore extends CIBaseStore<any> {
  private fetchPromises: { [sha: string]: Promise<any> } = {};

  private readonly commits = {
    lite: observable.map({}, { deep: false }),
    full: observable.map({}, { deep: false }),
  };

  private toLoad: { [hash: string]: boolean } = {};
  private timeoutId: NodeJS.Timer | null = null;

  @computed
  private get shortShaSupported(): boolean {
    return !(ciStore.currentRepoStore && ciStore.currentRepoStore.data && ciStore.currentRepoStore.data.type === "vsts");
  }

  private isCommitLoading(sha: string, commitForm: string = "lite"): boolean {
    if (this.commits[commitForm].has(sha)) {
      return false;
    }

    const promise = this.fetchPromises[sha];
    return promise && !promise.isResolved();
  }

  private isCommitLoaded(sha: string, commitForm: string = "lite") {
    return this.commits[commitForm].has(sha);
  }

  public getCommit(sha: string, commitForm: string = "lite"): IAHCommit | null {
    const commits = this.commits[commitForm];
    if (!commits.has(sha)) {
      return null;
    }
    return commits.get(sha);
  }

  public fetchCommit(sha: string, commitForm: string = "lite"): Promise<void> {
    const currentFetch = this.fetchPromises[sha];
    if (currentFetch) {
      if (!currentFetch.isResolved) {
        return currentFetch;
      }
    }

    const path = this.getPathWithSlug("commits/:sha");
    this.fetchPromises[sha] = apiGateway
      .get(path, {
        params: {
          sha: sha,
          form: commitForm,
        },
      })
      .then(
        action((commitInfo: any) => {
          this.commits[commitForm].set(String(commitInfo.sha), commitInfo);
          return commitInfo;
        })
      );

    return this.loadVoid(this.fetchPromises[sha]);
  }

  /**
   * Batches calls to load commit information.
   */
  @action
  public ensureCommitInfo(sha: string, commitForm: string = "lite") {
    if (
      !sha ||
      (this.shortShaSupported ? sha.length > 40 : sha.length !== 40) ||
      this.isCommitLoaded(sha, commitForm) ||
      this.isCommitLoading(sha, commitForm)
    ) {
      return;
    }

    this.toLoad[sha] = true;
    this.setTimeoutToFetchCommits(commitForm);
  }

  @action
  private setTimeoutToFetchCommits(commitForm: string) {
    if (!this.timeoutId) {
      this.timeoutId = setTimeout(() => {
        this.fireCommitFetch(commitForm).finally(() => {
          if (this.timeoutId) {
            clearTimeout(this.timeoutId);
          }
          this.timeoutId = null;
          if (Object.keys(this.toLoad).length > 0) {
            this.setTimeoutToFetchCommits(commitForm);
          }
        });
      }, 150);
    }
  }

  @action
  public updateCommitInfoLocally(commit: IAHCommit, commitForm: string = "lite") {
    this.commits[commitForm].set(commit.sha, commit);
  }

  @action
  private fireCommitFetch(commitForm: string = "lite"): Promise<IAHCommit[]> {
    const hashes = Object.keys(this.toLoad);
    const hashChunks = chunk(hashes, 40);

    return Promise.all<IAHCommit[]>(hashChunks.map((chunk) => this.fetchCommitsBatch(chunk, commitForm)))
      .then((commitChunks) => {
        const commits: IAHCommit[] = [];
        commitChunks.forEach((chunk) => {
          commits.push(...chunk);
        });
        return commits;
      })
      .catch(() => {
        return [];
      });
  }

  protected fetchCommitsBatch(shas: string[], commitForm: string = "lite"): Promise<IAHCommit[]> {
    const shasToFetch = shas.filter((sha: string) => {
      return sha && (this.shortShaSupported ? sha.length <= 40 : sha.length === 40) && !this.fetchPromises[sha];
    });

    if (shasToFetch.length === 0) {
      return Promise.resolve([]);
    }

    shasToFetch.forEach((sha) => {
      delete this.toLoad[sha];
    });

    const path = this.getPathWithSlug("commits/batch");
    const fetchPromise = apiGateway
      .get<IAHCommit[]>(path, {
        params: {
          form: commitForm,
          hashes: shasToFetch.join(","),
        },
      })
      .then(
        action((commitInfos: any[]) => {
          commitInfos.forEach((commitInfo) => {
            this.commits[commitForm].set(String(commitInfo.sha), commitInfo);
          });
          return commitInfos;
        })
      );

    shasToFetch.forEach((sha: string) => {
      this.fetchPromises[sha] = fetchPromise;
    });

    // Do not load into the DataStore for the batch call, status is managed seperately
    return fetchPromise;
  }
}
