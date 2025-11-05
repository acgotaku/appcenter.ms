import * as React from "react";
import { range } from "lodash";
import { observer } from "mobx-react";
import { Grid, RowCol, GridSpacing, Skeletal, NavigationList, PanelPosition, ListVirtualization } from "@root/shared";
import { TeamCard } from "../team-card/team-card";
import { TeamsUIStore } from "../teams-ui-store";
import { TeamType } from "@root/data/management/stores/team-store";
import { Team } from "@root/data/management/models";

const styles = require("./team-list.scss");

export interface TeamListProps extends Skeletal {
  teams: Team[];
  organizationName: string;
  selectedTeamName?: string;
  eventualNumberOfTeams?: number;
  condensed?: boolean;
  teamsUiStore: TeamsUIStore;
  teamDetailsDefaultTab: string;
  teamType: TeamType;
}

@observer
export class TeamList extends React.Component<TeamListProps, {}> {
  public static defaultProps: TeamListProps = {
    teams: [],
    organizationName: undefined as any,
    selectedTeamName: undefined,
    eventualNumberOfTeams: 4,
    condensed: false,
    teamsUiStore: undefined as any,
    teamDetailsDefaultTab: undefined as any,
    teamType: undefined as any,
  };

  public render() {
    const { teams, selectedTeamName, organizationName, condensed, teamsUiStore, teamDetailsDefaultTab, teamType } = this.props;
    if (this.props.skeleton) {
      return (
        <Grid rowSpacing={GridSpacing.None} bordered>
          {range(0, this.props.eventualNumberOfTeams).map((value) => {
            return (
              <RowCol key={value}>
                <TeamCard skeleton organizationName={undefined} team={undefined} teamType={teamType} condensed={condensed} />
              </RowCol>
            );
          })}
        </Grid>
      );
    }

    const parentPath = teamType === TeamType.Distribution ? "distribution" : "teams";

    return (
      <NavigationList
        enableArrowKeyFocus={PanelPosition.Secondary}
        items={teams}
        virtualize={ListVirtualization.Never}
        activeItem={(team) => team.name === selectedTeamName}
        renderContainer={(props) => <Grid rowSpacing={GridSpacing.None} bordered padded {...props} />}
        renderItem={(team, props, { index }) => (
          <div role="listitem">
            <RowCol
              className={styles.row}
              {...props}
              columnSpacing={GridSpacing.None}
              key={team.name}
              to={`/orgs/${organizationName}/people/${parentPath}/${team.name}/${teamDetailsDefaultTab.toLowerCase()}`}
            >
              <TeamCard
                organizationName={organizationName}
                team={team}
                teamType={teamType}
                condensed={condensed}
                onDelete={teamsUiStore.confirmDeleteTeam}
                onLeave={teamsUiStore.confirmLeaveTeam}
              />
            </RowCol>
          </div>
        )}
      />
    );
  }
}
