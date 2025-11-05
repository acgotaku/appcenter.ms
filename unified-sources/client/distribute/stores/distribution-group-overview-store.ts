import { observable, action, computed } from "mobx";

import { getStorageManager } from "@root/shared";

const BannerReadKey = "groupDetailsStore/banner";

export class DistributionGroupOverviewStore {
  @observable private bannerRead: boolean = false;

  @action
  public onBannerDismissClicked = () => {
    getStorageManager().saveObject(BannerReadKey, { read: true });
    this.bannerRead = true;
  };

  @computed
  public get isBannerRead(): boolean {
    const obj = getStorageManager().getObject(BannerReadKey);
    if (!obj) {
      return this.bannerRead;
    } else {
      return obj.read;
    }
  }
}
