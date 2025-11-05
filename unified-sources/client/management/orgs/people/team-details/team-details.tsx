import * as React from "react";
import { RouteComponentProps } from "react-router";
import { observer, Provider } from "mobx-react";
import {
  Page,
  TopBar,
  Panelify,
  PanelInjectedProps,
  PanelOutlet,
  Tabs,
  Tab,
  TabSections,
  TabSection,
  ClickableIcon,
  IconName,
  PageNotification,
  MediaObject,
  Size,
  TextColor,
  Text,
} from "@root/shared";
import { capitalize, noop } from "lodash";
import { TeamMembers } from "./team-members/team-members";
import { TeamApps } from "./team-apps/team-apps";
import { userStore, organizationStore } from "@root/stores";
import { notFoundStore } from "@root/stores/not-found-store";
import { TeamMembersUIStore } from "./team-members/team-members-ui-store";
import { TeamAppsUIStore } from "./team-apps/team-apps-ui-store";
import { teamStore } from "@root/data/management";
import { TeamType } from "@root/data/management/stores/team-store";

const styles = require("./team-details.scss");

type TeamDetailsProps = PanelInjectedProps & RouteComponentProps<any, any>;
export enum TeamDetailsTab {
  Members,
  Apps,
}

@Panelify
@observer
export class TeamDetails extends React.Component<TeamDetailsProps, {}> {
  private teamMembersUiStore = new TeamMembersUIStore();
  private teamAppsUiStore = new TeamAppsUIStore();

  public UNSAFE_componentWillMount() {
    const { org_name } = this.props.params;
    this.teamMembersUiStore.fetchCollaborators(org_name);
  }

  public UNSAFE_componentWillReceiveProps(nextProps) {
    const { team_name, org_name, tab } = this.props.params;
    if (team_name !== nextProps.params["team_name"] || org_name !== nextProps.params["org_name"] || tab !== nextProps.params["tab"]) {
      this.teamMembersUiStore.hideNotifications();
      this.teamAppsUiStore.hideNotifications();
    }
  }

  public UNSAFE_componentWillUpdate(nextProps, nextState) {
    const { team_name, org_name } = nextProps.params;
    if (!teamStore.isFetchingCollection && !teamStore.get(org_name, team_name)) {
      notFoundStore.notify404();
      return;
    }
  }

  private get orgName() {
    return this.props.params.org_name;
  }

  private get teamName() {
    return this.props.params.team_name;
  }

  public render() {
    const { tab } = this.props.params;
    const { orgName, teamName } = this;
    const team = teamStore.get(orgName, teamName);

    // Helpers
    const currentUserMember = this.teamMembersUiStore.getMember(userStore.currentUser.name);
    const isCurrentUserMaintainer = currentUserMember && currentUserMember.isMaintainer(orgName, teamName);
    const isCurrentUserAnOrgAdmin = organizationStore.isCurrentUserAnAdmin(organizationStore.find(orgName));
    const allowedToManageTeam = isCurrentUserMaintainer || isCurrentUserAnOrgAdmin;

    // Tab helpers
    const membersTabId = TeamDetailsTab[TeamDetailsTab.Members].toLowerCase();
    const appsTabId = TeamDetailsTab[TeamDetailsTab.Apps].toLowerCase();
    const membersTabSectionId = `${membersTabId}-panel`;
    const appsTabSectionId = `${appsTabId}-panel`;

    // REMOVE THIS ONCE DISTRIBUTION TO TEAMS MIGRATION IS COMPLETE
    const split = this.props.location.pathname.split("/");
    const parentPath = split[4];
    const teamType = parentPath === "teams" ? TeamType.Team : TeamType.Distribution;

    return (
      <Page data-test-id="team-details">
        <TopBar
          data-test-id="team-details-topbar"
          title={team ? team.displayName : "Loading ..."}
          controlsArea={
            <div className={styles.controls}>
              <MediaObject textOnly>
                <Text size={Size.Small} color={TextColor.Secondary} className={styles.uppercase}>
                  Members
                </Text>
                <Text size={Size.Medium} ellipsize>
                  {team ? team.prettyMemberCount : "..."}
                </Text>
              </MediaObject>
              <MediaObject textOnly>
                <Text size={Size.Small} color={TextColor.Secondary} className={styles.uppercase}>
                  Apps
                </Text>
                <Text size={Size.Medium} ellipsize>
                  {team ? team.prettyAppCount : "..."}
                </Text>
              </MediaObject>
              {allowedToManageTeam ? (
                <ClickableIcon icon={IconName.Settings} to={`/orgs/${orgName}/people/${parentPath}/${teamName}/${tab}/manage`} />
              ) : null}
            </div>
          }
        />
        {this.renderNotification()}
        <Tabs selectedIndex={this.activeTab} onSelect={noop}>
          <Tab
            to={`/orgs/${orgName}/people/${parentPath}/${teamName}/${membersTabId}`}
            id={membersTabId}
            aria-controls={membersTabSectionId}
          >
            {TeamDetailsTab[TeamDetailsTab.Members]}
          </Tab>
          <Tab to={`/orgs/${orgName}/people/${parentPath}/${teamName}/${appsTabId}`} id={appsTabId} aria-controls={appsTabSectionId}>
            {TeamDetailsTab[TeamDetailsTab.Apps]}
          </Tab>
        </Tabs>
        <TabSections selectedIndex={this.activeTab}>
          <TabSection id={membersTabSectionId} aria-labelledby={membersTabId}>
            <Provider teamMembersUiStore={this.teamMembersUiStore}>
              <TeamMembers
                organizationName={orgName}
                teamName={teamName}
                isCurrentUserAnOrgAdmin={isCurrentUserAnOrgAdmin}
                allowedToManageTeam={allowedToManageTeam}
              />
            </Provider>
          </TabSection>
          <TabSection id={appsTabSectionId} aria-labelledby={appsTabId}>
            <Provider teamAppsUiStore={this.teamAppsUiStore}>
              <TeamApps organizationName={orgName} teamName={teamName} allowedToManageTeam={allowedToManageTeam} teamType={teamType} />
            </Provider>
          </TabSection>
        </TabSections>
        <PanelOutlet>{this.props.children}</PanelOutlet>
      </Page>
    );
  }

  get activeTab(): number {
    const { tab } = this.props.params;
    return TeamDetailsTab[capitalize(tab)] || TeamDetailsTab.Members;
  }

  private renderNotification = (): JSX.Element => {
    const notification = this.teamAppsUiStore.notification(this.orgName, this.teamName) || this.teamMembersUiStore.notification;
    if (notification) {
      return <PageNotification type={notification.type}>{notification.message}</PageNotification>;
    } else {
      return null as any;
    }
  };
}
