import { observable, action, computed } from "mobx";
import { Release } from "@root/distribute/models/release";
import { DistributeSourceType } from "@root/distribute/stores/wizard-store";

export abstract class CommonDistributionSummaryStore {
  @observable public branch?: string;
  @observable public buildId?: number;
  @observable public mandatoryUpdate: boolean = false;
  @observable public notifyTesters: boolean = true;
  @observable public release?: Release;
  @observable public source: DistributeSourceType = DistributeSourceType.Upload;

  @computed get distributionGroup() {
    return undefined;
  }

  @computed
  get iconUrl(): string | undefined {
    return undefined;
  }

  @action public setUpdateIsMandatory(mandatory: boolean) {
    this.mandatoryUpdate = mandatory;
  }

  @action public setNotifyTesters(notify: boolean) {
    this.notifyTesters = notify;
  }
}
