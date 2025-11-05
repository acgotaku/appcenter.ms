import * as React from "react";
import { observer } from "mobx-react";
import { Menu, Trigger, ClickableIcon, IconName, Action } from "@root/shared";
import { Team } from "@root/data/management/models";
import { teamMemberStore } from "@root/data/management/stores";
import { organizationStore } from "@root/stores";
import { TeamType } from "@root/data/management/stores/team-store";

export interface TeamCardMenuProps {
  organizationName: string;
  team: Team;
  teamType: TeamType;
  onDelete?: (organizationName: string, team: Team) => void;
  onLeave?: (organizationName: string, team: Team) => void;
}

@observer
export class TeamCardMenu extends React.Component<TeamCardMenuProps, {}> {
  public render() {
    const { team, organizationName, teamType } = this.props;
    const organization = organizationStore.find(organizationName);
    const memberRole = teamMemberStore.currentUserMember && teamMemberStore.currentUserMember.getRole(organizationName, team.name!);
    const currentUserMemberRole = memberRole || team.teamMemberRole;
    const allowedToDelete = currentUserMemberRole === "maintainer" || organizationStore.isCurrentUserAnAdmin(organization);
    const allowedToLeave = currentUserMemberRole === "collaborator";
    return allowedToDelete || allowedToLeave ? (
      <Menu data-test-id={`team-delete-menu-${team.name}`}>
        <Trigger>
          <ClickableIcon key={team.id} icon={IconName.More} />
        </Trigger>
        {allowedToDelete ? (
          <Action
            text={`Delete ${teamType}`}
            onClick={this.onDelete(team)}
            danger={true}
            data-test-id="team-card-menu-delete-action"
          />
        ) : null}
        {allowedToLeave ? <Action text={`Leave ${teamType}`} onClick={this.onLeave(team)} /> : null}
      </Menu>
    ) : null;
  }

  private onDelete = (team: Team) => (event: React.MouseEvent<HTMLElement>): void => {
    event.preventDefault();
    const { onDelete, organizationName } = this.props;
    if (typeof onDelete === "function") {
      onDelete(organizationName, team);
    }
  };

  private onLeave = (team: Team) => (event: React.MouseEvent<HTMLElement>): void => {
    event.preventDefault();
    const { onLeave, organizationName } = this.props;
    if (typeof onLeave === "function") {
      onLeave(organizationName, team);
    }
  };
}
