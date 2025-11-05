import * as React from "react";
import { RouteComponentProps } from "react-router";
import { observer } from "mobx-react";
import {
  Modalify,
  Page,
  PageHeader,
  BottomBar,
  Formsy,
  PrimaryButton,
  OrganizationIcon,
  MediaObject,
  Gravatar,
  Text,
  Size,
  Radio,
  Space,
  InputSize,
  AppIcon,
  Paragraph,
  TextColor,
  MessageBar,
  Stretch,
} from "@root/shared";
import { IUser, IOrganization, IAppOwner } from "@lib/common-interfaces";
import { Grid, Col, Row, GridSpacing, RowCol } from "@root/shared/grid";
import { VALIDATION_ERRORS, VALIDATIONS } from "../../utils/formsy/validations";
import { SuggestedReleaseTypes } from "../../constants/constants";
import { OS, PLATFORM } from "@lib/common-interfaces/app";
import { notifyScreenReader } from "@root/stores/notification-store";
import { OwnerSelect } from "./owner-select";
import { PlatformRadioGroup } from "../../shared/platform-radio-group";
import { withTranslation, WithTranslation } from "react-i18next";
import { NewAppUIStore } from "./new-app-ui-store";
import { locationStore } from "@root/stores";
import { observable } from "mobx";
import { ResourceRequest } from "@root/data/lib";
import { userStore, organizationStore } from "@root/stores";
import { ImageUploader } from "@root/shared/image-uploader/image-uploader";
import { CustomSuggestionInput } from "../custom-suggestion-input/custom-suggestion-input";

const styles = require("./new-app.scss");

export interface NewAppComponentState {
  selectedOS?: string;
  selectedPlatform?: string;
  selectedOwner?: IOrganization | IUser;
}

type NewAppProps = RouteComponentProps<any, any> & WithTranslation;

export const NewApp = Modalify(
  withTranslation(["management", "common"])(
    observer(
      class NewApp extends React.Component<NewAppProps> {
        private _newAppForm: any;
        private newAppUiStore: NewAppUIStore;

        constructor(props: NewAppProps) {
          super(props);
          // Check to see if we are trying to create an app within an organization.
          const orgName = this.props.params["org_name"];
          const organization = organizationStore.find(orgName);

          this.newAppUiStore = new NewAppUIStore({
            defaultValues: {
              oses: observable.array([OS.IOS]),
              platform: NewAppUIStore.getAvailablePlatforms([OS.IOS])[0].value,
              owner: organization || userStore.currentUser,
            },
          });
        }

        private onSubmit = () => {
          const { t } = this.props;
          ResourceRequest.all(this.newAppUiStore.create()).onSuccess((apps) => {
            locationStore.pushWithApp("/", apps![0]!);
            notifyScreenReader({ message: t("management:app.addedNew", { name: apps![0]!.display_name }), delay: 1500 });
          });
        };

        public render() {
          const { t, params } = this.props;
          const { username } = params;
          const { isCreating, appForm, updateForm, deleteIcon, updateIcon, iconSrc, iconValidationMessageKey } = this.newAppUiStore;
          const creatingForPersonalOrg = !!username && userStore.currentUser.name === username;
          const currentOrganizationName = this.props.params["org_name"];
          const owners: Pick<IAppOwner, "name" | "display_name" | "email">[] = currentOrganizationName
            ? []
            : [userStore.currentUser].concat(organizationStore.organizations.slice() as any);

          return (
            <Page supportsMobile data-test-id="create-new-app-page" header={<PageHeader title={t("management:app.addNew")} />}>
              <Formsy.Form
                key="newAppForm"
                ref={(ref: any) => {
                  this._newAppForm = ref;
                }}
                onValidSubmit={this.onSubmit}
              >
                <Grid bordered rowSpacing={GridSpacing.Page}>
                  <RowCol>
                    <Grid rowSpacing={GridSpacing.Medium}>
                      {this.renderNotifications()}
                      <Row>
                        <Col width={10}>
                          <Formsy.Input
                            label={`${t("management:common.appName")}:`}
                            type="text"
                            name="display_name"
                            value={appForm.displayName}
                            onChange={(event) => updateForm("displayName", event.target.value)}
                            placeholder={t("management:app.name")}
                            autoCorrect="none"
                            autoCapitalize="none"
                            autoComplete="off"
                            spellCheck="false"
                            isRequired
                            requiredError="Name is required."
                            validations={VALIDATIONS.APP_DISPLAY_NAME}
                            validationErrors={VALIDATION_ERRORS.APP_DISPLAY_NAME}
                            size={InputSize.Large}
                            data-test-id="new-app-input-name"
                          />
                        </Col>
                        <Col width={2}>
                          <label className={styles.label}>{t("management:common.icon.label")}:</label>
                          <ImageUploader
                            hasImage={!!iconSrc}
                            onDelete={deleteIcon}
                            accept="image/png, image/jpeg"
                            onSelect={(file) => updateIcon(file)}
                            roundedSquare
                            label={t("management:common.icon.label")}
                          >
                            <AppIcon value={appForm.displayName.trim()} src={iconSrc} size={50} />
                          </ImageUploader>
                        </Col>
                      </Row>
                      <RowCol className={styles.iconHint} visible={!!iconValidationMessageKey}>
                        <Paragraph color={TextColor.Danger} size={Size.Small}>
                          {t(iconValidationMessageKey)}
                        </Paragraph>
                      </RowCol>
                      <Row>
                        <Col width={7}>
                          <CustomSuggestionInput
                            items={SuggestedReleaseTypes}
                            value={appForm.release_type || ""}
                            onChange={(value: string) => updateForm("release_type", value)}
                          />
                        </Col>
                        <Col width={5}>
                          <Stretch vertical>
                            {
                              // There should be atleast 1 organization in addition to the default owner i.e. the current user.
                              !creatingForPersonalOrg && !currentOrganizationName && owners.length > 1 ? (
                                <OwnerSelect
                                  label={`${t("management:common.appOwner")}:`}
                                  owners={owners}
                                  value={appForm.owner!}
                                  onChange={(owner) => updateForm("owner", owner)}
                                  currentUser={userStore.currentUser}
                                />
                              ) : (
                                <div className={styles.owner}>
                                  <label className={styles["label"]}>{`${t("management:common.appOwner")}:`}</label>
                                  <MediaObject className={styles.ownerItem} hSpace={Space.XSmall}>
                                    {currentOrganizationName && currentOrganizationName !== userStore.currentUser.name ? (
                                      <OrganizationIcon size={24} organization={appForm.owner!} />
                                    ) : (
                                      <Gravatar size={24} email={appForm.owner!.email} />
                                    )}
                                    <Text ellipsize size={Size.Medium}>
                                      {appForm.owner!.display_name || appForm.owner!.name}
                                    </Text>
                                  </MediaObject>
                                </div>
                              )
                            }
                          </Stretch>
                        </Col>
                      </Row>
                    </Grid>
                  </RowCol>

                  <RowCol>
                    <Grid rowSpacing={GridSpacing.Page}>
                      <RowCol middle>
                        <Grid rowSpacing={GridSpacing.None}>
                          <Row top>
                            <Col width={3}>
                              <label className={styles["padded-label"]} id="os-label">
                                {t("management:common.os")}:
                              </label>
                            </Col>
                            <Col width={9} className={styles.os}>
                              <Formsy.RadioGroup
                                aria-labelledby="os-label"
                                name="os"
                                value={appForm.oses[0]}
                                onChange={(os) => updateForm("oses", observable.array([os]))}
                                isRequired
                                requiredError="OS is required."
                                data-test-id="new-app-os-radiogroup"
                              >
                                <Radio value={OS.IOS}>{OS.IOS}</Radio>
                                <Radio value={OS.ANDROID}>{OS.ANDROID}</Radio>
                                <Radio value={OS.WINDOWS}>{OS.WINDOWS}</Radio>
                                <Radio value={OS.MACOS}>{OS.MACOS}</Radio>
                                <Radio value={OS.TVOS}>{OS.TVOS}</Radio>
                                <Radio value={OS.CUSTOM}>{OS.CUSTOM}</Radio>
                              </Formsy.RadioGroup>
                            </Col>
                          </Row>
                        </Grid>
                      </RowCol>
                      {appForm.platform !== PLATFORM.CUSTOM ? (
                        <Row top>
                          <Col width={3}>
                            <label className={styles["padded-label"]} id="platform-label">
                              {t("management:common.platform")}:
                            </label>
                          </Col>
                          <Col width={9}>
                            <PlatformRadioGroup
                              aria-labelledby="platform-label"
                              name="platform"
                              os={appForm.oses[0]}
                              value={appForm.platform}
                              onChange={(platform) => updateForm("platform", platform)}
                              isRequired
                              requiredError="Platform is required."
                              data-test-id="new-app-platform-radiogroup"
                            />
                          </Col>
                        </Row>
                      ) : null}
                    </Grid>
                  </RowCol>
                </Grid>
              </Formsy.Form>
              <BottomBar className={styles.buttons}>
                <PrimaryButton
                  progress={isCreating}
                  className={isCreating ? styles.creatingApp : styles.createApp}
                  data-test-id="new-app-submit"
                  onClick={() => this._newAppForm.submit()}
                >
                  {isCreating ? t("management:app.addingNew") : t("management:app.addNew")}
                </PrimaryButton>
              </BottomBar>
            </Page>
          );
        }

        private renderNotifications() {
          const { notification } = this.newAppUiStore;

          if (notification && notification.message) {
            return (
              <RowCol>
                <MessageBar container="Well" type={notification.type}>
                  {notification.message}
                </MessageBar>
              </RowCol>
            );
          } else {
            return null;
          }
        }
      }
    )
  )
);
