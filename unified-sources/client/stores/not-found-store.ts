import { observable, action, computed } from "mobx";

export type NotFoundProps = {
  message?: string;
  returnTo?: string;
};

export class NotFoundStore {
  @observable
  private isNotFound = false;

  @observable
  public notFoundProps: NotFoundProps = {};

  @computed
  get is404(): boolean {
    return this.isNotFound;
  }

  @action
  public notify404(props?: NotFoundProps): void {
    this.notFoundProps = props || {};
    this.isNotFound = true;
  }

  @action
  public reset(): void {
    this.notFoundProps = {};
    this.isNotFound = false;
  }
}

export const notFoundStore = new NotFoundStore();
