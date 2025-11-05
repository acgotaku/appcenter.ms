import { observable } from "mobx";
import { Model } from "../../lib";
import { BugTrackerType } from "./bugtracker";

export interface BugTrackerOwner {
  name: string;
  id: string;
  login: string;
  avatar_url?: string;
}

export interface BugTrackerRepo {
  name?: string;
  url?: BugTrackerType;
  id?: string;
  description?: string;
  private?: boolean;
  owner: BugTrackerOwner;
}

export class BugTrackerRepo extends Model<BugTrackerRepo> implements BugTrackerRepo {
  @observable public name?: string;
  @observable public url?: BugTrackerType;
  @observable public id?: string;
  @observable public description?: string;
  @observable public private?: boolean;
  @observable public owner!: BugTrackerOwner;

  get displayLogin() {
    if (this.owner?.login) {
      return this.owner.login.includes("@") ? this.owner.login : `@${this.owner.login}`;
    }
    return "";
  }
}

export interface BugTrackerRepos {
  type: string;
  repositories: BugTrackerRepo[];
}

export interface BugTrackerOwnerRepos {
  owner: BugTrackerOwner;
  repos: BugTrackerRepo[];
}
