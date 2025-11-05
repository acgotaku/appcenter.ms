import { observable, action, computed } from "mobx";
import { IUser } from "@lib/common-interfaces";
import { User } from "@root/data/shell/models/user";

/**
 * Simple User Store
 */
export class UserStore {
  @observable
  private _currentUser: User;

  constructor() {
    // get the user data from initProps which should always exist.
    this._currentUser = new User(((window as any).initProps || {}).user || {});
  }

  get currentUser(): User {
    return this._currentUser;
  }

  @computed
  get currentUserFriendlyName() {
    const user = this.currentUser;
    if (!user) {
      return "";
    }

    return (user.display_name || "").trim() || user.name;
  }

  @computed
  get userLoggedIn(): boolean {
    // This is needed to handle the case when an unauthenticated user visits an app through a public link. They'll be a currentUser but won't have an email
    if (this.currentUser) {
      return !!this.currentUser.email;
    }
    return false;
  }

  @action
  public updateCurrentUser(user: IUser) {
    this._currentUser = new User(user);
  }
}

/**
 * Export the store
 */
export const userStore = new UserStore();
