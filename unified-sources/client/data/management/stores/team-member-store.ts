import { apiGateway } from "@root/lib/http";
import { Store, FetchMode, LoadOptions, ResourceRequest } from "../../lib";
import { DeserializedTeamMember, SerializedTeamMember, TeamMember } from "../models/team-member";
import { API } from "../constants";
import { userStore } from "@root/stores/user-store";
import { RESPONSE_TYPES } from "@lib/common-interfaces";

export type TeamMembersQueryOrOptions = { organizationName?: string; teamName?: string; email?: string; userName?: string };

export class TeamMemberStore extends Store<DeserializedTeamMember, SerializedTeamMember, TeamMember> {
  protected ModelClass = TeamMember;

  protected generateIdFromResponse(resource: SerializedTeamMember, query?: any) {
    return resource.name;
  }

  protected getModelId(model: TeamMember): string {
    return model.name!;
  }

  protected deserialize(serialized: SerializedTeamMember, queryOrOptions?: TeamMembersQueryOrOptions): DeserializedTeamMember {
    return {
      id: serialized.id,
      displayName: serialized.display_name,
      name: serialized.name,
      email: serialized.email,
      teamRelations: [
        {
          organizationName: queryOrOptions?.organizationName || "",
          teamName: queryOrOptions?.teamName || "",
          role: serialized.role,
        },
      ],
    };
  }

  protected getCollection(query?: TeamMembersQueryOrOptions): Promise<SerializedTeamMember[]> {
    return apiGateway.get<SerializedTeamMember[]>(API.TEAMS_USERS, {
      params: {
        org_name: query?.organizationName || "",
        team_name: query?.teamName || "",
      },
    });
  }

  protected postResource(resource: TeamMember, options?: TeamMembersQueryOrOptions): Promise<void | SerializedTeamMember> {
    return apiGateway.post<SerializedTeamMember>(API.TEAMS_USERS, {
      params: {
        org_name: options?.organizationName || "",
        team_name: options?.teamName || "",
      },
      body: {
        user_email: resource.email,
      },
    });
  }

  protected deleteResource(resource: TeamMember, options?: TeamMembersQueryOrOptions): Promise<any> {
    return apiGateway.delete(API.TEAMS_USER, {
      params: {
        org_name: options?.organizationName || "",
        team_name: options?.teamName || "",
        user_name: options?.userName || "",
      },
      responseType: RESPONSE_TYPES.TEXT,
    });
  }

  public fetchCollection(
    query?: TeamMembersQueryOrOptions,
    { fetchMode = FetchMode.PreserveReplace, segmentFilter }: LoadOptions<DeserializedTeamMember, TeamMember> = {}
  ): ResourceRequest<TeamMember[], SerializedTeamMember[]> {
    return super.fetchCollection(query, { fetchMode, segmentFilter });
  }

  public get currentUserMember(): TeamMember | undefined {
    return this.get(userStore.currentUser.name);
  }
}

export const teamMemberStore = new TeamMemberStore();
