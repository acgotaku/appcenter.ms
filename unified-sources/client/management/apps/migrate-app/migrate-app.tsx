import * as React from "react";
import { RouteComponentProps } from "react-router";
import { observer } from "mobx-react";

import {
  Modalify,
  Page,
  TopBar,
  BottomBar,
  Formsy,
  PrimaryButton,
  PageNotification,
  MediaObject,
  Gravatar,
  Radio,
} from "@root/shared";
import {
  IApp,
  SUPPORTED_OS_FOR_CODEPUSH as codepushOperatingSystems,
  SUPPORTED_OS_FOR_HOCKEYAPP as hockeyappOperatingSystems,
  IPlatform,
} from "@lib/common-interfaces";
import { Grid, Col, Row, GridSpacing } from "@root/shared/grid";
import { MigrateAppStore } from "../../stores/apps/migrate-app-store";
import { VALIDATION_ERRORS, VALIDATIONS } from "../../utils/formsy/validations";
import { appStore } from "@root/stores";
import { getAvailablePlatforms } from "@root/lib/utils/app-platform";

const styles = require("./migrate-app.scss");

export interface MigrateAppComponentState {
  appDisplayName?: string;
  appDescription?: string;
  selectedOS?: string;
  selectedPlatform?: string;
  canMigrate: boolean;
}

@Modalify
@observer
export class MigrateAppComponent extends React.Component<RouteComponentProps<any, any>, MigrateAppComponentState> {
  private _migrateAppForm: any;
  private _migrateAppStore: MigrateAppStore;

  constructor(props: RouteComponentProps<any, any>) {
    super(props);

    this._migrateAppStore = new MigrateAppStore();
  }

  public UNSAFE_componentWillMount() {
    const app: IApp | undefined = appStore.findApp(this.props.params["owner_name"], this.props.params["app_name"]);
    const operatingSystems = app?.isCreatedInCodePush ? codepushOperatingSystems : hockeyappOperatingSystems;
    const selectedOS = operatingSystems.find((os) => os === app?.os);

    this.setState({
      appDisplayName: app?.display_name,
      appDescription: app?.description,
      selectedOS: selectedOS,
      selectedPlatform: undefined,
      canMigrate: false,
    });
  }

  public render() {
    const { appDisplayName, appDescription, selectedOS, selectedPlatform, canMigrate } = this.state;

    const app: IApp = appStore.findApp(this.props.params["owner_name"], this.props.params["app_name"])!;
    const operatingSystems = app.isCreatedInCodePush ? codepushOperatingSystems : hockeyappOperatingSystems;

    return (
      <Page>
        <TopBar title="Configure app" />

        {this._migrateAppStore.notification ? (
          <PageNotification type={this._migrateAppStore.notification.type}>
            {this._migrateAppStore.notification.message}
          </PageNotification>
        ) : null}

        <Formsy.Form
          key="migrateAppForm"
          ref={(ref: any) => {
            this._migrateAppForm = ref;
          }}
          onValidSubmit={(data) => {
            this._migrateAppStore.migrateApp(app, data);
          }}
          onValid={this.enableMigrateButton}
          onInvalid={this.disableMigrateButton}
        >
          <Grid bordered rowSpacing={GridSpacing.XLarge}>
            <Row>
              <Col width={12}>
                <Formsy.Input
                  label="Name:"
                  type="text"
                  name="display_name"
                  className={styles["name"]}
                  defaultValue={appDisplayName}
                  placeholder="Enter an app name"
                  autoCorrect="none"
                  autoCapitalize="none"
                  autoComplete="off"
                  spellCheck="false"
                  isRequired
                  readOnly
                  requiredError="Name is required."
                  validations={VALIDATIONS.APP_DISPLAY_NAME}
                  validationErrors={VALIDATION_ERRORS.APP_DISPLAY_NAME}
                />
                <Formsy.Input
                  className={styles["field"]}
                  type="text"
                  name="description"
                  defaultValue={appDescription}
                  placeholder="Enter a brief description (optional)"
                  autoCorrect="none"
                  autoCapitalize="none"
                  autoComplete="off"
                  spellCheck="false"
                  readOnly
                  validations={VALIDATIONS.APP_DESCRIPTION}
                  validationErrors={VALIDATION_ERRORS.APP_DESCRIPTION}
                />
              </Col>
            </Row>

            <Row middle>
              <Col width={3}>
                <label className={styles["label"]}>Owner: </label>
              </Col>
              <Col width={9}>
                <MediaObject>
                  {/* Note: The owner could be an org, and orgs don't have emails.
                  But for now, these apps to be migrated can't have an org as the owner. */}
                  <Gravatar size={20} email={app.owner?.email} />
                  {app.owner ? <span className={styles["owner-label"]}>{app.owner.display_name || app.owner.name}</span> : null}
                </MediaObject>
              </Col>
            </Row>

            <Row top>
              <Col width={3}>
                <label className={styles["padded-label"]} id="os-label">
                  OS:{" "}
                </label>
              </Col>
              <Col width={9}>
                <Formsy.RadioGroup
                  name="os"
                  value={selectedOS}
                  onChange={this._handleOSRadioGroupChange}
                  isRequired
                  aria-labelledby="os-label"
                >
                  {app.isCustomApp ? (
                    operatingSystems.map((os: string) => {
                      return (
                        <Radio key={os} value={os}>
                          {os}
                        </Radio>
                      );
                    })
                  ) : (
                    <Radio key={app.os} value={app.os || ""}>
                      {app.os}
                    </Radio>
                  )}
                </Formsy.RadioGroup>
              </Col>
            </Row>

            {selectedOS ? (
              <Row top>
                <Col width={3}>
                  <label className={styles["padded-label"]} id="platform-label">
                    Platform:{" "}
                  </label>
                </Col>
                <Col width={9}>
                  <Formsy.RadioGroup
                    name="platform"
                    value={selectedPlatform}
                    onChange={this._handlePlatformRadioGroupChange}
                    isRequired
                    aria-labelledby="platform-label"
                  >
                    {getAvailablePlatforms(selectedOS).map((platform: IPlatform, index: number) => {
                      return (
                        <Radio key={index} value={platform.value}>
                          {platform.displayName}
                        </Radio>
                      );
                    })}
                  </Formsy.RadioGroup>
                </Col>
              </Row>
            ) : null}
          </Grid>
        </Formsy.Form>
        <BottomBar alignRight>
          <PrimaryButton
            progress={this._migrateAppStore.isPending}
            disabled={!canMigrate}
            onClick={() => this._migrateAppForm.submit()}
          >
            {this._migrateAppStore.isPending ? "Configuring" : "Configure"}
          </PrimaryButton>
        </BottomBar>
      </Page>
    );
  }

  public enableMigrateButton = () => {
    this.setState({ canMigrate: true });
  };

  public disableMigrateButton = () => {
    this.setState({ canMigrate: false });
  };

  private _handleOSRadioGroupChange = (value: string): void => {
    this.setState({ selectedOS: value });
  };

  private _handlePlatformRadioGroupChange = (value: string): void => {
    this.setState({ selectedPlatform: value });
  };
}

export { MigrateAppComponent as MigrateApp };
