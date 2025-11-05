import * as React from "react";
import { RouteComponentProps } from "react-router";
import { observer } from "mobx-react";
import {
  Page,
  TopBar,
  Panelify,
  PanelInjectedProps,
  PanelOutlet,
  PanelPosition,
  PrimaryButton,
  PageNotification,
  EmptyState,
} from "@root/shared";

import { TeamList } from "../components/teams/team-list/team-list";
import { TeamsUIStore } from "../components/teams/teams-ui-store";
import { LeaveTeamDialog } from "../components/teams/dialogs/leave-team-dialog/leave-team-dialog";
import { DeleteTeamDialog } from "../components/teams/dialogs/delete-team-dialog/delete-team-dialog";
import { TeamDetailsTab } from "../team-details/team-details";
import { TeamType } from "@root/data/management/stores/team-store";
import { withTranslation, WithTranslation } from "react-i18next";
import { t } from "@root/lib/i18n";

const noTeamsImg = require("./images/no-teams.svg");

export interface TeamsProps extends PanelInjectedProps {
  // Nothing to add here yet.
}

export const Teams = Panelify(
  withTranslation(["management"])(
    observer(
      class Teams extends React.Component<TeamsProps & RouteComponentProps<any, any> & WithTranslation, {}> {
        private teamsUiStore = new TeamsUIStore();

        public UNSAFE_componentWillMount() {
          const { org_name, team_name } = this.props.params;
          this.teamsUiStore.fetch(org_name, team_name, TeamType.Team);
        }

        public UNSAFE_componentWillReceiveProps(nextProps) {
          const { team_name, org_name } = this.props.params;
          if (team_name !== nextProps.params["team_name"] || org_name !== nextProps.params["org_name"]) {
            this.teamsUiStore.hideNotifications();
          }
        }

        public render() {
          const { params, panelPosition } = this.props;
          const { org_name, team_name } = params;
          const { notification, teamToLeave, leaveTeam, deleteTeam, teamToDelete } = this.teamsUiStore;
          const condensed = panelPosition === PanelPosition.Secondary;
          const newTeamPath = `/orgs/${org_name}/people/teams/create`;
          const teams = this.teamsUiStore.getTeams(org_name);

          // Helper flags
          const hasTeams = teams.length > 0;
          const showEmptyState = !this.teamsUiStore.isFetching && !hasTeams;
          const showSkeleton = this.teamsUiStore.isFetching && !hasTeams;

          return (
            <Page data-test-id="teams">
              <TopBar
                title="Teams"
                closeButton={false}
                controlsArea={
                  hasTeams ? (
                    <PrimaryButton data-test-id="teams-list-new-team-button" to={newTeamPath}>
                      Add new team
                    </PrimaryButton>
                  ) : null
                }
              />
              {notification ? <PageNotification type={notification.type}>{notification.message}</PageNotification> : null}
              {showEmptyState ? (
                <EmptyState
                  data-test-id="teams-list-empty-state"
                  imgSrc={noTeamsImg}
                  title={t("management:orgTeams.empty.title")}
                  subtitle={t("management:orgTeams.empty.subtitle")}
                  buttonText={t("management:orgTeams.empty.buttonText")}
                  to={newTeamPath}
                />
              ) : (
                <div>
                  <TeamList
                    skeleton={showSkeleton}
                    teams={teams}
                    teamType={TeamType.Team}
                    organizationName={org_name}
                    selectedTeamName={team_name}
                    condensed={condensed}
                    teamsUiStore={this.teamsUiStore}
                    teamDetailsDefaultTab={TeamDetailsTab[0]}
                  />
                  {!condensed ? (
                    <LeaveTeamDialog
                      team={teamToLeave}
                      organizationName={org_name}
                      onConfirmLeaveTeam={leaveTeam}
                      teamType={TeamType.Team}
                      closeOnConfirm
                    />
                  ) : null}
                  {!condensed ? (
                    <DeleteTeamDialog
                      team={teamToDelete}
                      organizationName={org_name}
                      onConfirmLeaveTeam={deleteTeam}
                      teamType={TeamType.Team}
                      closeOnConfirm
                    />
                  ) : null}
                </div>
              )}
              <PanelOutlet>{this.props.children}</PanelOutlet>
            </Page>
          );
        }
      }
    )
  )
);
