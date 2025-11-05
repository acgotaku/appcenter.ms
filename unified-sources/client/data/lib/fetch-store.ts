import { IObservableValue, computed, observable, action, reaction } from "mobx";
import { ResourceRequest } from "./resource-request";

/**
 * A simple store that uses ResourceRequest to
 * fetch some data asynchronously.
 */
export abstract class FetchStore<U, T = U, P = any> {
  @observable private fetchRequest = observable.box(null) as IObservableValue<ResourceRequest<U, T> | null>;
  @observable public data!: U;
  @observable public json!: any;

  constructor() {
    reaction(() => this.getGlobalCacheKey(), this.clearCache);
  }

  /**
   * Specifies an observable which, when changed, will clear all cached data and requests.
   */
  public getGlobalCacheKey(): any {
    return undefined;
  }

  @computed
  public get isPending() {
    return this.fetchRequest.get() ? this.fetchRequest.get()!.isPending : false;
  }

  @computed
  public get isLoaded() {
    return this.fetchRequest.get() ? this.fetchRequest.get()!.isLoaded : false;
  }

  @computed
  public get isFailed() {
    return this.fetchError != null;
  }

  @computed
  public get fetchError() {
    return this.fetchRequest.get() ? this.fetchRequest.get()!.error : undefined;
  }

  @action
  public fetch(params?: P, optimistic?: boolean) {
    if (!optimistic) {
      this.data = null as any;
    }
    const resourceRequest = new ResourceRequest(
      this.fetchData(params!),
      () => this.data,
      (error, response: T | null) => {
        if (error) {
          return;
        }

        this.data = this.deserialize(response!);
      }
    );

    this.fetchRequest.set(resourceRequest);
    return resourceRequest;
  }

  @action
  public fetchJsonAction() {
    //@ts-ignore
    this.fetchJson().then(
      action((response) => {
        this.json = response;
      })
    );
  }

  @action
  protected clearCache = () => {
    this.data = null as any;
    this.fetchRequest = observable.box(null);
  };

  protected abstract fetchData(params: P): Promise<any>;
  protected abstract deserialize(data: T): U;
}
