import { apiGateway } from "@root/lib/http";
import { AssociationStore, Association } from "../../lib";
import { API } from "../constants";
import { RESPONSE_TYPES, CollaboratorRole } from "@lib/common-interfaces";
import { observable } from "mobx";
import { Team } from "@root/data/management/models";

export interface TeamAppAssociationInfo {
  permissions?: CollaboratorRole[];
  team_permissions?: CollaboratorRole[];
}

export type TeamAppsQueryOrOptions = { organizationName?: string; teamName?: string; email?: string; appName?: string };

export class TeamAppAssociation extends Association<TeamAppAssociationInfo> {
  @observable permissions?: CollaboratorRole;
  setMetaInfo(response: TeamAppAssociationInfo) {
    if (response.team_permissions) {
      this.permissions = response.team_permissions[0];
    } else if (response.permissions) {
      this.permissions = response.permissions[0];
    }
  }
}

export class TeamAppStore extends AssociationStore<TeamAppAssociation, TeamAppAssociationInfo> {
  public LeftClass = Team;
  protected AssociationClass = TeamAppAssociation;

  protected associateResources(teamId: string, appId: string, query: TeamAppsQueryOrOptions): Promise<TeamAppAssociationInfo> {
    return apiGateway.post<TeamAppAssociationInfo>(API.TEAM_APPS, {
      params: {
        org_name: query.organizationName || "",
        team_name: query.teamName || "",
      },
      body: {
        name: query.appName || "",
      },
    });
  }

  protected disassociateResources(teamId: string, appId: string, query: TeamAppsQueryOrOptions) {
    return apiGateway.delete<void>(API.TEAM_APP, {
      params: {
        org_name: query.organizationName || "",
        team_name: query.teamName || "",
        app_name: query.appName || "",
      },
      responseType: RESPONSE_TYPES.TEXT,
    });
  }

  public patchAssociation(
    association: TeamAppAssociation,
    changes: Pick<TeamAppAssociation, "permissions">,
    options: TeamAppsQueryOrOptions
  ) {
    return apiGateway.patch<TeamAppAssociationInfo>(API.TEAM_APP, {
      params: {
        org_name: options.organizationName || "",
        team_name: options.teamName || "",
        app_name: options.appName || "",
      },
      body: {
        permissions: [changes.permissions],
      },
    });
  }

  public contains(teamId: string, appId: string) {
    return super.contains(teamId, appId);
  }
}

export const teamAppStore = new TeamAppStore();
