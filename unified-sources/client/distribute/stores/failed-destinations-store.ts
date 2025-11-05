import { observable, action, computed } from "mobx";
import { DestinationWrapper } from "../models/destination-wrapper";

export class FailedDestinationsStore {
  @observable private _dialogCanBeDisplayed = false;
  @observable private failedDestinations = observable.array<DestinationWrapper>();
  @observable private _releaseNumber!: number;

  @computed
  public get dialogCanBeDisplayed(): boolean {
    return this._dialogCanBeDisplayed && this.failedDestinations.length > 0;
  }

  @computed
  public get destinations(): DestinationWrapper[] {
    return this.failedDestinations;
  }

  public get releaseNumber(): number {
    return this._releaseNumber;
  }

  @action
  public setReleaseNumber = (releaseNumber: number) => {
    this._releaseNumber = releaseNumber;
  };

  @action
  public setDestinations = (destinations: DestinationWrapper[]) => {
    this.reset();
    this.failedDestinations = observable.array<DestinationWrapper>(destinations);
  };

  @action
  public enableFailedDestinationsDialog = (): void => {
    this._dialogCanBeDisplayed = true;
  };

  @action
  public reset = (): void => {
    this._dialogCanBeDisplayed = false;
    this.failedDestinations.clear();
  };
}

export const failedDestinationsStore = new FailedDestinationsStore();
