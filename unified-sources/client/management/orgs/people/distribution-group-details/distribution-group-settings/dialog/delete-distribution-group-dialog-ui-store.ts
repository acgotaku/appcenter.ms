import { observable, action } from "mobx";

export class DeleteDistributionGroupDialogUIStore {
  @observable
  public isVisible: boolean = false;

  @action
  public setVisible(value: boolean): void {
    this.isVisible = value;
  }
}
