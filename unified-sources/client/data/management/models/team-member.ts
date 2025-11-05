import { observable, action, ObservableMap, computed } from "mobx";
import { capitalize } from "lodash";
import { Model } from "../../lib";
import { ITeam, IUser } from "@lib/common-interfaces";
import { userStore } from "../../../stores/user-store";

export type TeamMemberRelation = {
  organizationName?: string;
  teamName?: string;
  role?: ITeam["team_member_role"];
};

export interface SerializedTeamMember extends IUser {
  role: ITeam["team_member_role"];
}

export interface DeserializedTeamMember {
  id?: string;
  name?: string;
  displayName?: string;
  email?: string;
  teamRelations: TeamMemberRelation[]; // A member can belong to multiple teams potentially with different roles for each team.
}

export class TeamMember extends Model<DeserializedTeamMember> implements DeserializedTeamMember {
  @observable private relations?: ObservableMap<string, TeamMemberRelation>;
  @observable public id!: string;
  @observable public displayName?: string;
  @observable public email?: string;
  @observable public name?: string;

  @computed
  public get teamRelations(): TeamMemberRelation[] {
    return Array.from(this.relations?.values() || []);
  }

  @computed
  get isCurrentUser(): boolean {
    return userStore.currentUser.name === this.name;
  }

  public getRole(organizationName: string, teamName: string): ITeam["team_member_role"] | undefined {
    if (!this.belongsTo(organizationName, teamName)) {
      return;
    }
    return this.relations?.get(this.relationId(organizationName, teamName))?.role;
  }

  public humanReadableRole(organizationName: string, teamName: string): string {
    return capitalize(this.getRole(organizationName, teamName));
  }

  public belongsTo(organizationName: string, teamName: string): boolean {
    return !!this.relations?.has(this.relationId(organizationName, teamName));
  }

  public isMaintainer(organizationName: string, teamName: string): boolean {
    return this.getRole(organizationName, teamName) === "maintainer";
  }

  @action
  public removeRelation(organizationName: string, teamName: string): void {
    if (!this.belongsTo(organizationName, teamName)) {
      return;
    }
    if (this.relations) {
      this.relations.delete(this.relationId(organizationName, teamName));
    }
  }

  @action
  public applyChanges(changes: Partial<DeserializedTeamMember>) {
    const { teamRelations = [], ...others } = changes;
    if (!this.relations) {
      this.relations = new ObservableMap<string, TeamMemberRelation>();
    }
    teamRelations.forEach((relation) => {
      const { organizationName, teamName, role } = relation;
      if (this.relations) {
        this.relations.set(this.relationId(organizationName, teamName), { organizationName, teamName, role });
      }
    });
    super.applyChanges(others);
  }

  private relationId(organizationName: string | undefined, teamName: string | undefined): string {
    return `${organizationName}-${teamName}`;
  }
}
