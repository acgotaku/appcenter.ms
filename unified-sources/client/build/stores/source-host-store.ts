import { action, computed, observable } from "mobx";
import { appStore } from "@root/stores";
import { apiGateway } from "@root/lib/http";
import { DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore } from "@root/shared";

import { IAHSourceRepositoryLite } from "@root/data/build";
import { IHttpOptions } from "@lib/common-interfaces";
import { ExternalCredential } from "@root/data/shell/models";
import { Utils } from "../utils";

export enum RepoProviderState {
  Unknown,
  Unauthorized,
  Authorized,
  Expired,
}

export class SourceHostStore extends DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore<IAHSourceRepositoryLite[]> {
  private static storeCache: { [sourceHost: string]: SourceHostStore } = {};

  public static forSourceHost(sourceHost: string): SourceHostStore {
    let store = this.storeCache[sourceHost];
    if (!store) {
      this.storeCache[sourceHost] = store = new SourceHostStore(sourceHost);
    }
    return store;
  }

  private _sourceHost: string;

  constructor(sourceHost: string) {
    super();
    this._sourceHost = sourceHost;
  }

  @observable public selectedRepoId?: string;
  @observable public searchFilter: string = "";
  @observable public providerState: RepoProviderState = RepoProviderState.Unknown;
  @observable public selfHost?: boolean = undefined;
  @observable public selfHostServiceConnection?: ExternalCredential = undefined;

  @computed
  get filtered(): IAHSourceRepositoryLite[] {
    const repos = this.data;
    if (repos && this.isLoaded && !!this.searchFilter && this.searchFilter.trim().length > 0) {
      const searched = this.searchFilter.trim().toLowerCase().split("/");
      return repos.filter((repo: any) => {
        for (const element of searched) {
          const isName = repo.name && repo.name.toLowerCase().indexOf(element) >= 0;
          const isLogin = repo.owner && repo.owner.login && repo.owner.login.toLowerCase().indexOf(element) >= 0;
          if (!isName && !isLogin) {
            return false;
          }
        }
        return true;
      });
    }
    return repos || [];
  }

  get isUnauthorized(): boolean {
    return this.providerState === RepoProviderState.Unauthorized;
  }

  get requiresReconnect(): boolean {
    return this.providerState === RepoProviderState.Expired;
  }

  @action
  public setSelfHost() {
    this.selfHost = true;
  }

  @action
  public setGeneralHost() {
    this.selfHost = false;
    this.selfHostServiceConnection = undefined;
  }

  @action
  public resetHostType() {
    this.selfHost = undefined;
    this.selfHostServiceConnection = undefined;
  }

  @action
  public setSelfHostServiceConnection(selfHostServiceConnection: ExternalCredential) {
    this.selfHostServiceConnection = selfHostServiceConnection;
  }

  @action
  public setSearchFilter(searchFilter: string) {
    this.searchFilter = searchFilter;
  }

  @action
  public selectRepo(repoId: string) {
    const repo =
      this.data &&
      this.data.find((item: any) => {
        return item.id === repoId;
      });
    if (!repo) {
      throw Error(`Repository with ID ${repoId} not found.`);
    }

    this.selectedRepoId = repoId;
  }

  @action
  public setProviderState(state: RepoProviderState): void {
    if (this.providerState === state) {
      return;
    }
    this.providerState = state;
  }

  public fetchUserRepos(): Promise<IAHSourceRepositoryLite[] | null> {
    const path = `/v0.1/apps/${appStore.app.owner.name}/${appStore.app.name}/source_hosts/${this._sourceHost}/repositories`;
    const options: IHttpOptions = {};
    if (this.selfHost && this.selfHostServiceConnection) {
      options.params = { service_connection_id: this.selfHostServiceConnection.id };
    }
    const fetchPromise = apiGateway.get<any[]>(path, options.params ? options : undefined);
    return this.load(fetchPromise)
      .then((repos) => {
        this.setProviderState(RepoProviderState.Authorized);
        return repos;
      })
      .catch((err) => {
        if (err) {
          switch (err.status) {
            case 400:
              if (Utils.isCodeHostNotAuthenticatedErrorResponse(err)) {
                this.setProviderState(RepoProviderState.Unauthorized);
              }
              return null;
            case 401:
              this.setProviderState(RepoProviderState.Expired);
              return null;
          }
          // workaround for Edge 14 bug - https://ghe-us.microsoft.com/mobile-services/mobile-center-portal/issues/2367
          if (navigator.appVersion.includes("Edge/14.14393") && err.httpResponse && err.httpResponse.message === "TypeMismatchError") {
            this.setProviderState(RepoProviderState.Unauthorized);
            return null;
          }
        }
        throw err;
      });
  }
}
