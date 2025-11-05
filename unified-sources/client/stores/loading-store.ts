import { observable, computed, action } from "mobx";

export class LoadingStore {
  @observable private loaders = observable.map<string, true>();
  @observable private stack: boolean[] = [];
  @observable private loading: boolean = false;

  @computed
  public get isLoading() {
    return this.loading || this.loaders.size > 0;
  }

  @computed public get modalLoading() {
    return this.stack.length > 0;
  }

  @action
  public startLoading(id: string) {
    this.loaders.set(id, true);
  }

  @action
  public stopLoading(id: string) {
    this.loaders.delete(id);
  }

  @action
  public setLoading(loading: boolean) {
    this.loading = loading;
  }

  @action
  public setModal(modal: boolean) {
    if (modal) {
      this.stack.push(modal);
    } else {
      this.stack.pop();
    }
  }
}

export const loadingStore = new LoadingStore();
