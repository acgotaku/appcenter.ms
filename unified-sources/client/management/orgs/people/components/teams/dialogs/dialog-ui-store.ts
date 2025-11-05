import { observable, action } from "mobx";

export class DialogUIStore {
  @observable
  public isVisible: boolean = false;

  @action
  public setVisible(value: boolean): void {
    this.isVisible = value;
  }
}
