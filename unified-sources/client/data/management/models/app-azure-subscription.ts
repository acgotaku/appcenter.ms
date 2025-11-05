import { Model } from "../../lib/model";
import { observable, computed } from "mobx";

export interface IAppAzureSubscription {
  subscriptionId?: string;
  appName?: string;
  ownerName?: string;
}

export class AppAzureSubscription extends Model<IAppAzureSubscription> implements IAppAzureSubscription {
  @observable public subscriptionId?: string;
  @observable public appName?: string;
  @observable public ownerName?: string;

  @computed
  get id(): string {
    return `${this.ownerName}-${this.appName}-${this.subscriptionId}`;
  }
}
