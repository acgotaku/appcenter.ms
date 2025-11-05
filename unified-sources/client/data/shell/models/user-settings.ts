import { observable, set } from "mobx";

export class UserSettings {
  @observable public marketing_opt_in?: "true" | "false";

  constructor(values?: any) {
    set(this, values);
  }
}
