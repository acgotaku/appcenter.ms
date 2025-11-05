import * as React from "react";
import { RouteComponentProps } from "react-router";
import { observer } from "mobx-react";
import {
  Page,
  TopBar,
  Modalify,
  Grid,
  GridRow as Row,
  GridCol as Col,
  PageNotification,
  InputSize,
  Formsy,
  PrimaryButton,
  BottomBar,
  GridSpacing,
  LinkButton,
  MediaObject,
} from "@root/shared";
import { Team } from "@root/data/management/models";
import { TeamSettingsUIStore } from "./team-settings-ui-store";
import { DeleteTeamDialog } from "../../components/teams/dialogs/delete-team-dialog/delete-team-dialog";
import { VALIDATION_ERRORS, VALIDATIONS } from "../../../../utils/formsy/validations";
import { TeamType } from "@root/data/management/stores/team-store";

const styles = require("./team-settings.scss");

export interface TeamSettingsProps extends RouteComponentProps<any, any> {
  // Nothing to add here yet.
}

@Modalify
@observer
export class TeamSettings extends React.Component<TeamSettingsProps, {}> {
  private manageTeamForm;
  private teamSettingsUiStore!: TeamSettingsUIStore;

  public UNSAFE_componentWillMount() {
    this.handlePropsChange(this.props);
  }

  public UNSAFE_componentWillReceiveProps(nextProps) {
    const { params } = this.props;
    const { team_name } = params;
    if (nextProps.params["team_name"] !== team_name) {
      this.handlePropsChange(nextProps);
    }
  }

  public handlePropsChange = (props: TeamSettingsProps) => {
    const { params } = props;
    const { org_name, team_name } = params;

    // REMOVE THIS ONCE DISTRIBUTION TO TEAMS MIGRATION IS COMPLETE
    const split = props.location.pathname.split("/");
    const parentPath = split[4];
    const teamType = parentPath === "teams" ? TeamType.Team : TeamType.Distribution;

    this.teamSettingsUiStore = new TeamSettingsUIStore(org_name, team_name, teamType);
  };

  public render() {
    const { org_name } = this.props.params;
    const { isFetching, isUpdating, isDeleting, team, deleteTeam, confirmDeleteTeam } = this.teamSettingsUiStore;
    const noTeamFound = !isFetching && !isUpdating && !isDeleting && !team;
    const needsSkeleton = isFetching || noTeamFound;

    return (
      <Page>
        <TopBar title={needsSkeleton ? "Loading ..." : "Settings"}></TopBar>
        {this.renderNotification()}
        <Grid rowSpacing={GridSpacing.XLarge}>
          <Row>
            <Col width={12}>
              {needsSkeleton ? (
                <MediaObject textOnly skeleton>
                  <div />
                  <div />
                </MediaObject>
              ) : (
                <Formsy.Form ref={this.setFormRef} onValidSubmit={this.onSubmit}>
                  <Formsy.Input
                    label="Name:"
                    type="text"
                    name="displayName"
                    size={InputSize.Large}
                    defaultValue={team.displayName}
                    placeholder="Enter a team name"
                    autoCorrect="none"
                    autoCapitalize="none"
                    autoComplete="off"
                    spellCheck="false"
                    isRequired
                    requiredError="Name is required."
                    validations={VALIDATIONS.TEAM_DISPLAY_NAME}
                    validationErrors={VALIDATION_ERRORS.TEAM_DISPLAY_NAME}
                    disabled={isFetching}
                  />
                </Formsy.Form>
              )}
            </Col>
          </Row>
          <DeleteTeamDialog
            team={team}
            organizationName={org_name}
            onConfirmLeaveTeam={deleteTeam}
            progress={isDeleting}
            teamType={this.teamSettingsUiStore.teamType}
          />
        </Grid>
        <BottomBar className={styles.buttons}>
          <LinkButton danger onClick={confirmDeleteTeam} disabled={isFetching}>
            {`Delete ${this.teamSettingsUiStore.teamType}`}
          </LinkButton>
          <PrimaryButton onClick={this.onSaveSettings} progress={isUpdating} disabled={isFetching}>
            {isUpdating ? "Saving" : "Done"}
          </PrimaryButton>
        </BottomBar>
      </Page>
    );
  }

  private renderNotification = (): JSX.Element | undefined => {
    const { notification } = this.teamSettingsUiStore;
    if (notification) {
      return <PageNotification type={notification.type}>{notification.message}</PageNotification>;
    }
  };

  private onSubmit = (changes: Partial<Team>): void => {
    this.teamSettingsUiStore.updateTeam(changes);
  };

  private onSaveSettings = (event: React.MouseEvent<HTMLElement>): void => {
    this.manageTeamForm.submit();
  };

  private setFormRef = (ref: any): void => {
    this.manageTeamForm = ref;
  };
}
