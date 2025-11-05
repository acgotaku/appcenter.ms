import { action, observable, set, computed } from "mobx";
import { noop } from "lodash";
import { apiGateway } from "@root/lib/http";
import { CIBaseStore } from "./ci-base-store";
import { ciStore } from "./ci-store";

import { IAHBranchStatus, IAHBuild } from "@root/data/build";
import { Utils } from "../utils";

/**
 * BranchesStore fetches and stores the Git branches for a given app
 */
export class BranchesStore extends CIBaseStore<IAHBranchStatus[]> {
  private fetchBranchesPromise?: Promise<IAHBranchStatus[]>;
  private _lastBuildId: number = 0;

  @observable
  private _requiresReconnect: boolean = false;

  public get lastBuildId(): number {
    return this._lastBuildId;
  }

  public get requiresReconnect(): boolean {
    return this._requiresReconnect;
  }

  @computed
  public get configuredBranches(): IAHBranchStatus[] {
    return this.data ? this.data.filter((branchStatus) => branchStatus.configured) : [];
  }

  @computed
  public get hasConfiguredBranches(): boolean {
    return this.configuredBranches.length > 0;
  }

  @action
  public setRequiresReconnect(value: boolean): void {
    if (this._requiresReconnect === value) {
      return;
    }
    this._requiresReconnect = value;
  }

  @action
  public fetchBranches(background: boolean = false): Promise<void> {
    this.lastFetchTimestamp = Date.now();

    const path = this.getPathWithSlug("branches");
    this.fetchBranchesPromise = apiGateway
      .get<IAHBranchStatus[]>(path)
      .then(
        action((branches: IAHBranchStatus[]) => {
          this.updateBranchStatuses(branches);
          return branches;
        })
      )
      .catch((err) => {
        if (this.shouldHandleError(err)) {
          this.setRequiresReconnect(true);
        }

        throw err;
      });

    if (background) {
      return this.loadInBackgroundVoid(this.fetchBranchesPromise);
    } else {
      return this.loadVoid(this.fetchBranchesPromise);
    }
  }

  @action
  public refresh(): Promise<void> {
    if (this.fetchBranchesPromise && this.fetchBranchesPromise.isPending()) {
      return this.fetchBranchesPromise.then(noop);
    }

    return this.fetchBranches(true);
  }

  @action
  public updateStatusLocally(
    branch: string,
    updateFunc: (status: IAHBranchStatus) => any,
    refresh: boolean = true,
    cancel: boolean = true
  ): boolean {
    const status = this.data && this.data.find((branchStatus) => branchStatus.branch && branchStatus.branch.name === branch);
    const branchFound = !!status;
    if (status) {
      updateFunc(status);
    }

    if (cancel && this.fetchBranchesPromise) {
      this.fetchBranchesPromise = undefined;
    }

    if (refresh) {
      this.refresh();
    }

    return branchFound;
  }

  public updateBranchLastBuild(build: IAHBuild, cancelBranchesRefresh: boolean = true) {
    if (!build || !build.sourceBranch || build.reason === "pullRequest") {
      return;
    }

    const sourceBranch = build.sourceBranch.replace(/^refs\/heads\//, "");

    this.updateStatusLocally(
      sourceBranch,
      (status) => {
        if (status.lastBuild !== undefined && status.lastBuild.id > this._lastBuildId) {
          this._lastBuildId = status.lastBuild.id;
        }
        // assuming monotonically increasing build ids
        if (status.lastBuild === undefined || !Number.isInteger(status.lastBuild.id)) {
          const buildCopy = Object.assign({}, build);
          set(status, { lastBuild: buildCopy });
        } else if (status.lastBuild.id === build.id || build.id > status.lastBuild.id) {
          if (status.lastBuild.id === build.id) {
            // ensure this build is really more recent
            const statusTimestamp = Date.parse((status.lastBuild && status.lastBuild.lastChangedDate) || "");
            const updateTimestamp = Date.parse(build.lastChangedDate || "");
            if (statusTimestamp > updateTimestamp) {
              return;
            }
          }
          // for some reason you can't extendObservable if it would change the `id` property
          // so we'll make a copy with the `id` property removed, and then set it.
          //
          // NOTE: this comment is outdated, as I’ve changed `extendObservable` to `set` for MobX 4. Cheers,
          // - Andrew
          const buildCopy: any = Object.assign({ startTime: null, finishTime: null, queueTime: null }, build);
          delete buildCopy.id;
          set(status.lastBuild, buildCopy);
          status.lastBuild.id = build.id;
        }
      },
      false,
      cancelBranchesRefresh
    );
  }

  public hasBranch(branchName: string): boolean {
    if (this.data && this.data.length > 0) {
      return this.data.some((branch) => branch.branch && branch.branch.name === branchName);
    }
    return false;
  }

  private updateBranchStatuses(branches: IAHBranchStatus[]): void {
    this.setRequiresReconnect(false);
    // Table doesn't deal well with observables, we'll help it by having nulls
    // instead of undefines
    if (Array.isArray(branches)) {
      const repoStore = this.app && this.app.id && ciStore.getRepoStore(this.app.id);

      branches.forEach((item) => {
        if (!item.lastBuild) {
          item.lastBuild = undefined;
        } else {
          this._lastBuildId = Math.max(item.lastBuild.id, this._lastBuildId);
        }
        if (repoStore && item.branch && item.branch.commit && item.branch.commit.commit) {
          repoStore.commitsStore.updateCommitInfoLocally(item.branch.commit);
        }
      });
    }
  }

  private shouldHandleError(err: any): boolean {
    return (
      err &&
      (err.status === 401 || // token is invalidated for Azure DevOps/GitHub/Bitbucket
        err.status === 403 || // token does not have the permission for Azure DevOps/BitBucket repos and GitHub Personal Private Repo
        err.status === 404 || // token does not have the permission for GitHub Private Repo in Organization
        (err.status === 400 && Utils.isCodeHostNotAuthenticatedErrorResponse(err)) || // user does not have token stored in App Center
        // workaround for Edge 14 bug - https://ghe-us.microsoft.com/mobile-services/mobile-center-portal/issues/2367
        (navigator.appVersion.includes("Edge/14.14393") && err.httpResponse && err.httpResponse.message === "TypeMismatchError"))
    );
  }
}
