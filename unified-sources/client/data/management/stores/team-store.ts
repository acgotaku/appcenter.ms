import { apiGateway } from "@root/lib/http";
import { Store, FetchMode, LoadOptions } from "../../lib";
import { SerializedTeam, Team, DeserializedTeam } from "../models/team";
import { teamMemberStore } from "./team-member-store";
import { teamAppStore } from "./team-app-store";
import { API } from "../constants";
import { userStore } from "@root/stores/user-store";
import { TeamMember } from "../models/team-member";
import { RESPONSE_TYPES } from "@lib/common-interfaces";
import { App } from "@root/data/shell/models";

export enum TeamType {
  Team = "team",
  Distribution = "distribution group",
}

export type TeamsQueryOrOptions = {
  organizationName: string;
  teamName?: string;
  userLimit?: string;
  include?: string[];
  teamType?: TeamType;
  appName?: string;
};

export class TeamStore extends Store<DeserializedTeam, SerializedTeam, Team, TeamsQueryOrOptions> {
  protected ModelClass = Team;

  protected deserialize(serialized: SerializedTeam, queryOrOptions?: TeamsQueryOrOptions): DeserializedTeam {
    return {
      id: serialized.id,
      name: serialized.name,
      displayName: serialized.display_name,
      description: serialized.description,
      expectedAppCount: serialized.apps_count || 0,
      expectedMemberCount: serialized.members_count || 1,
      teamMemberRole: serialized.team_member_role,
      organizationName: queryOrOptions?.organizationName,
      sourceType: serialized.source_type ? TeamType[serialized.source_type] : TeamType[0],
    };
  }

  protected generateIdFromResponse(resource: SerializedTeam, query?: TeamsQueryOrOptions) {
    return query && this.compoundKey(query.organizationName, resource.name);
  }

  protected getModelId(model: Team): string | undefined {
    return model.organizationName && model.name && this.compoundKey(model.organizationName, model.name);
  }

  protected getCollection(query: TeamsQueryOrOptions): Promise<SerializedTeam[]> {
    if (query.appName) {
      return apiGateway.get<SerializedTeam[]>(API.APP_TEAMS, {
        params: {
          owner_name: query.organizationName,
          app_name: query.appName,
        },
      });
    } else {
      const params = Object.assign(
        { org_name: query.organizationName },
        query.teamType ? { source_type: query.teamType === TeamType.Team ? "0" : "1" } : {},
        query.include ? { include: query.include } : {}
      );
      return apiGateway.get<SerializedTeam[]>(API.TEAMS, {
        params: params,
      });
    }
  }

  protected postResource(resource: Team, options?: TeamsQueryOrOptions): Promise<void | SerializedTeam> {
    return apiGateway.post<SerializedTeam>(API.TEAMS, {
      params: {
        org_name: options?.organizationName || "",
      },
      body: {
        display_name: resource.displayName,
        source_type: resource.sourceType,
      },
    });
  }

  protected patchResource(resource: Team, changes: Partial<DeserializedTeam>, options?: TeamsQueryOrOptions): Promise<SerializedTeam> {
    return apiGateway.patch<SerializedTeam>(API.TEAM, {
      params: {
        org_name: options?.organizationName || "",
        team_name: options?.teamName || "",
      },
      body: {
        display_name: changes.displayName,
      },
    });
  }

  protected deleteResource(resource: Team, options?: TeamsQueryOrOptions): Promise<SerializedTeam> {
    return apiGateway.delete<SerializedTeam>(API.TEAM, {
      params: {
        org_name: options?.organizationName || "",
        team_name: options?.teamName || "",
      },
      responseType: RESPONSE_TYPES.TEXT,
    });
  }

  public fetchCollection(
    query?: TeamsQueryOrOptions,
    { fetchMode = FetchMode.PreserveReplace, segmentFilter }: LoadOptions<DeserializedTeam, Team> = {}
  ) {
    return super.fetchCollection(query, { fetchMode, segmentFilter });
  }

  public getTeamsForApp(app: App) {
    return this.resources.filter(
      (team) =>
        team.organizationName && team.name && teamAppStore.contains(this.compoundKey(team.organizationName, team.name), app.internalId)
    );
  }

  public delete(resource: Team | string, optimistic = true, options?: TeamsQueryOrOptions) {
    const model = typeof resource === "string" ? this.get(resource) : resource;
    const request =
      typeof resource === "string"
        ? super.delete(resource as string, optimistic, options)
        : super.delete(resource as Team, optimistic, options);
    return request.onSuccess(() => {
      if (options) {
        teamMemberStore.resources.forEach(
          (member) => options.teamName && member.removeRelation(options.organizationName, options.teamName)
        );
      }
      if (model) {
        teamAppStore.getAllAssociationsForLeftKey(this.getModelId(model)).forEach((association) => {
          teamAppStore.remove(association.leftKey, association.rightKey);
        });
      }
    });
  }

  public getTeams(organizationName?: string): Team[] {
    if (!organizationName) {
      return this.resources;
    }
    return this.resources.filter((team) => team.organizationName === organizationName);
  }

  /**
   * For each team in our collection, this function will -
   * - Check the `teamMemberRole` for each team.
   * - If `teamMemberRole` exists, track the current user in the `teamMemberStore`.
   *   - If we have the current user's member resource, apply the changes.
   *   - If we don't have a resource, create a new one with the changes.
   * - If we have current user's resource & `teamMemberRole` doesn't exist, remove the team's relation.
   *
   * While creating the resource, the func will create the appropriate `teamRelation`.
   */
  public syncCurrentUserMemberRelations(): void {
    const { currentUser } = userStore;
    this.resources.forEach((team) => {
      const currentUserMember = teamMemberStore.currentUserMember;
      const memberData = {
        name: currentUser.name,
        email: currentUser.email,
        displayName: currentUser.display_name,
        teamRelations: [{ organizationName: team.organizationName, teamName: team.name, role: team.teamMemberRole }],
      };

      if (team.teamMemberRole && !currentUserMember) {
        teamMemberStore.add(new TeamMember(memberData));
      } else if (team.teamMemberRole && currentUserMember) {
        currentUserMember.applyChanges(memberData);
      } else if (!team.teamMemberRole && currentUserMember && team.organizationName && team.name) {
        currentUserMember.removeRelation(team.organizationName, team.name);
      }
    });
  }
}

export const teamStore = new TeamStore();
