import * as React from "react";
import { RouteComponentProps } from "react-router";
import { observer } from "mobx-react";
import {
  Page,
  TopBar,
  Modalify,
  PanelInjectedProps,
  PanelOutlet,
  Grid,
  GridRow as Row,
  GridCol as Col,
  InputSize,
  Formsy,
  PrimaryButton,
  BottomBar,
  GridSpacing,
  PageNotification,
} from "@root/shared";
import { VALIDATION_ERRORS, VALIDATIONS } from "../../../../utils/formsy/validations";
import { NewTeamUIStore } from "./new-team-ui-store";
import { TeamType } from "@root/data/management/stores/team-store";

const styles = require("./new-team.scss");

type NewTeamProps = PanelInjectedProps & RouteComponentProps<any, any>;

@Modalify
@observer
export class NewTeam extends React.Component<NewTeamProps, {}> {
  private newTeamForm;
  private newTeamUiStore: NewTeamUIStore;
  private teamType: TeamType;

  constructor(props: NewTeamProps) {
    super(props);
    this.newTeamUiStore = new NewTeamUIStore();

    // REMOVE THIS ONCE DISTRIBUTION TO TEAMS MIGRATION IS COMPLETE
    const split = this.props.location.pathname.split("/");
    const parentPath = split[4];
    this.teamType = parentPath === "teams" ? TeamType.Team : TeamType.Distribution;
  }

  public render() {
    const { conflictError, isCreating } = this.newTeamUiStore;
    const creatingStatus = isCreating ? "Creating" : "Create";
    return (
      <Page data-test-id="create-team-page">
        <TopBar title={`Add new ${this.teamType}`} />
        {this.renderNotification()}
        <Grid rowSpacing={GridSpacing.XLarge}>
          <Row>
            <Col width={12}>
              <Formsy.Form
                ref={this.setFormRef}
                onValidSubmit={this.onSubmit}
                validationErrors={conflictError ? { name: conflictError } : null}
              >
                <Formsy.Input
                  label="Name:"
                  type="text"
                  name="name"
                  size={InputSize.Large}
                  defaultValue={null}
                  placeholder={`Enter a ${this.teamType} name`}
                  autoCorrect="none"
                  autoCapitalize="none"
                  autoComplete="off"
                  spellCheck="false"
                  isRequired
                  requiredError="Name is required."
                  validations={VALIDATIONS.TEAM_DISPLAY_NAME}
                  validationErrors={VALIDATION_ERRORS.TEAM_DISPLAY_NAME}
                  onChange={this.clearConflictError}
                  data-test-id="new-team-input-name"
                />
                <PrimaryButton className={styles.hidden} type="submit" tabIndex={-1} />
              </Formsy.Form>
            </Col>
          </Row>
        </Grid>
        <PanelOutlet>{this.props.children}</PanelOutlet>
        <BottomBar alignRight>
          <PrimaryButton type="submit" onClick={this.onCreateTeamClick} progress={isCreating} data-test-id="new-team-submit">
            {`${creatingStatus} ${this.teamType}`}
          </PrimaryButton>
        </BottomBar>
      </Page>
    );
  }

  private onSubmit = (data: any): void => {
    const { org_name } = this.props.params;
    this.newTeamUiStore.create(org_name, data.name, this.teamType);
  };

  private onCreateTeamClick = (event: React.MouseEvent<HTMLElement>): void => {
    this.newTeamForm.submit();
  };

  private setFormRef = (ref: any): void => {
    this.newTeamForm = ref;
  };

  private clearConflictError = (): void => {
    this.newTeamUiStore.setShowConflictError(false);
  };

  private renderNotification = (): JSX.Element | null => {
    // Give priority to error notifications.
    const { notification } = this.newTeamUiStore;
    if (notification && notification.message) {
      return <PageNotification type={notification.type}>{notification.message}</PageNotification>;
    }

    return null;
  };
}
