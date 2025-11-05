import { observable, computed, action } from "mobx";
import { capitalize, remove, sortBy } from "lodash";
import { Model } from "../../lib";
import { ITeam } from "@lib/common-interfaces";
import { TeamMember } from "./team-member";
import { teamAppStore } from "../stores/team-app-store";
import { teamMemberStore } from "../stores/team-member-store";
import * as pluralize from "pluralize";
import { appStore } from "@root/stores/app-store";
import { App } from "@root/data/shell/models/app";

export type SerializedTeam = ITeam;

export interface DeserializedTeam {
  id: string;
  name?: string;
  displayName?: string;
  description?: string;
  teamMemberRole?: "maintainer" | "collaborator";
  expectedMemberCount?: number;
  expectedAppCount?: number;
  organizationName?: string;
  sourceType?: string;
}

export class Team extends Model<DeserializedTeam> implements DeserializedTeam {
  // Marty, in the future, maybe have a way to specify this externally.
  private memberSorty = (member: TeamMember) => (member?.displayName || member?.name)?.toLowerCase();
  private appSorty = (app: App) => app.display_name?.toLowerCase();

  // The Observables.
  @observable public id!: string;
  @observable public displayName?: string;
  @observable public name?: string;
  @observable public description?: string;
  @observable public teamMemberRole?: ITeam["team_member_role"];
  @observable public expectedAppCount?: number;
  @observable public organizationName?: string;
  @observable public expectedMemberCount;
  @observable public sourceType?: string;

  @computed
  public get humanReadableRole(): string {
    return capitalize(this.teamMemberRole);
  }

  @computed
  public get prettyMemberCount(): string {
    const membersPostfix = "member";
    return `${this.memberCount} ${this.memberCount > 1 ? pluralize(membersPostfix) : membersPostfix}`;
  }

  @computed
  public get prettyAppCount(): string {
    const appsPostFix = "app";
    if (this.appCount === 0) {
      return "—";
    } else {
      return `${this.appCount} ${this.appCount && this.appCount > 1 ? pluralize(appsPostFix) : appsPostFix}`;
    }
  }

  @computed
  public get memberCount(): number {
    // This is very much horrible & terrible. But I have to do this because "relations" are managed per resource instance right now.
    // (Ref for "relations": `team-member.ts`)
    // This leads to cases where a `delete` of a resource results in deletion of that resource for all relations --
    // which in turn modifies the overall "members" length.
    // Ideally, we would have a join "table/resource/store" and we'd delete just the relationship from that store instead of
    // deleting the entire resource. Until we have that in the data layer, this should satisfy the UX requirements.
    // Marty, Change this to react off `members.length` once relationships work.
    return this.expectedMemberCount;
  }

  @computed
  public get appCount(): number | undefined {
    return this.expectedAppCount;
  }

  @action
  public incrementMemberCount(): void {
    this.expectedMemberCount++;
  }

  @action
  public decrementMemberCount(): void {
    this.expectedMemberCount--;
  }

  @action
  public incrementAppCount(): void {
    if (this.expectedAppCount) {
      this.expectedAppCount++;
    }
  }

  @action
  public decrementAppCount(): void {
    if (this.expectedAppCount) {
      this.expectedAppCount--;
    }
  }

  @computed
  public get members(): TeamMember[] {
    const members = teamMemberStore.resources.filter(
      (member) => this.organizationName && this.name && member.belongsTo(this.organizationName, this.name)
    );
    // Get the maintainers of this team
    const maintainers = sortBy(
      remove(members, (member) => this.organizationName && this.name && member.isMaintainer(this.organizationName, this.name)),
      this.memberSorty
    );
    // Sort the other members
    const sortedMembers = sortBy(members, this.memberSorty);
    // Add the maintainers back to the front of the array
    sortedMembers.unshift(...maintainers);
    return sortedMembers;
  }

  @computed
  public get apps(): App[] {
    const teamId = [this.organizationName, this.name].join("/");
    const apps = appStore.apps.filter((app) => {
      const appId = App.internalAppId(app.owner.name, app.name);
      return teamAppStore.contains(teamId, appId);
    });

    return sortBy(apps, this.appSorty);
  }
}
