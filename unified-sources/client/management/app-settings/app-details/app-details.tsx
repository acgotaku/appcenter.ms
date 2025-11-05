import * as React from "react";
import { observer } from "mobx-react";
import { Link } from "react-router";
import { omitBy, isNil } from "lodash";
import {
  Panelify,
  Page,
  Formsy,
  InputSize,
  PrimaryButton,
  PageHeader,
  DesktopOnly,
  Card,
  MessageBar,
  NotificationType,
} from "@root/shared";
import { Grid, RowCol, Row, Col, GridSpacing } from "@root/shared/grid";
import { Text, Size, TextColor, Paragraph } from "@root/shared/typography";
import { appStore, organizationStore } from "@root/stores";
import { VALIDATION_ERRORS, VALIDATIONS } from "../../utils/formsy/validations";
import { withTranslation, WithTranslation, Trans } from "react-i18next";
import { ManageAppIcon } from "./manage-app-icon";
import { FooterArea } from "@root/shared/footer-area";
import { ImageUploader } from "@root/shared/image-uploader/image-uploader";
import { CustomSuggestionInput } from "@root/management/apps/custom-suggestion-input/custom-suggestion-input";
import { SuggestedReleaseTypes } from "../../constants/constants";
import { AppDetailsUIStore } from "./app-details-ui-store";

export const AppDetails = Panelify(
  withTranslation("management")(
    observer(
      class AppDetails extends React.Component<WithTranslation, {}> {
        private appDetailsUIStore = new AppDetailsUIStore();

        public state = {
          name: appStore.app.display_name,
          description: appStore.app.description,
          release_type: appStore.app.release_type,
        };

        private updateApp = () => {
          const update: { display_name?: string; description?: string; release_type?: string } = omitBy(
            {
              display_name: this.state.name,
              description: this.state.description,
            },
            isNil
          );
          update.release_type = this.state.release_type || "";
          this.appDetailsUIStore.updateApp(appStore.app, update);
        };

        public render() {
          const { app } = appStore;
          const {
            isUpdating,
            updateNotification,
            updateIcon,
            deleteIcon,
            iconValidationMessageKey,
            uploadProgress,
          } = this.appDetailsUIStore;
          const { t } = this.props;

          return (
            <Page
              data-test-id="app-details-page"
              white
              constrainedWidth
              supportsMobile
              header={<PageHeader title={t("management:appDetails.title")} />}
            >
              <Grid>
                {updateNotification ? (
                  <RowCol>
                    <MessageBar type={updateNotification.type} compact>
                      {updateNotification.message}
                    </MessageBar>
                  </RowCol>
                ) : null}
                {this.appDetailsUIStore.hasIconError ? (
                  <RowCol>
                    <MessageBar container="Well" type={NotificationType.Error} compact>
                      {t(this.appDetailsUIStore.iconErrorMessageKey!)}
                    </MessageBar>
                  </RowCol>
                ) : null}
                <RowCol>
                  <Formsy.Form onValidSubmit={this.updateApp}>
                    <Card
                      footer={
                        <FooterArea>
                          <PrimaryButton type="submit" progress={isUpdating} data-test-id="app-details-save-button">
                            {isUpdating ? t("management:appDetails.button.pending") : t("management:appDetails.button.action")}
                          </PrimaryButton>
                        </FooterArea>
                      }
                    >
                      <Grid bordered rowSpacing={GridSpacing.Large}>
                        <Row between>
                          <Col width={9}>
                            <Grid rowSpacing={GridSpacing.Medium}>
                              <RowCol>
                                <Formsy.Input
                                  label={`${t("management:common.appName")}:`}
                                  name="name"
                                  type="text"
                                  id="name"
                                  size={InputSize.Large}
                                  autoCorrect="none"
                                  autoComplete="off"
                                  spellCheck="false"
                                  isRequired
                                  requiredError="Name is required."
                                  validations={VALIDATIONS.APP_DISPLAY_NAME}
                                  validationErrors={VALIDATION_ERRORS.APP_DISPLAY_NAME}
                                  value={this.state.name || ""}
                                  onChange={(e) => this.setState({ name: e.target.value })}
                                  data-test-id="app-details-name-input"
                                />
                              </RowCol>
                              <RowCol>
                                <CustomSuggestionInput
                                  items={SuggestedReleaseTypes}
                                  value={this.state.release_type || ""}
                                  onChange={(value: string) => this.setState({ release_type: value })}
                                />
                              </RowCol>
                            </Grid>
                          </Col>
                          <DesktopOnly>
                            {() => (
                              <Col>
                                <Grid rowSpacing={GridSpacing.XXSmall}>
                                  <RowCol>
                                    <Paragraph.asLabel size={Size.Medium}>{t("management:appDetails.icon")}:</Paragraph.asLabel>
                                  </RowCol>
                                  <RowCol>
                                    <ImageUploader
                                      hasImage={!!app.icon_url && app.icon_source === "uploaded"}
                                      onDelete={() => deleteIcon(app)}
                                      accept="image/png, image/jpeg"
                                      onSelect={(file) => updateIcon(app, file)}
                                      uploadProgress={uploadProgress}
                                      roundedSquare
                                      data-test-id="app-details-image-uploader"
                                    >
                                      <ManageAppIcon app={app} />
                                    </ImageUploader>
                                  </RowCol>
                                  <RowCol>
                                    <Paragraph
                                      color={iconValidationMessageKey ? TextColor.Danger : TextColor.Secondary}
                                      size={Size.Small}
                                      data-test-id="app-details-image-description"
                                    >
                                      {t(iconValidationMessageKey || "management:common.icon.requirements")}
                                    </Paragraph>
                                  </RowCol>
                                </Grid>
                              </Col>
                            )}
                          </DesktopOnly>
                        </Row>

                        <RowCol>
                          <Grid rowSpacing={GridSpacing.XSmall}>
                            <Row baseline>
                              <Col width={3}>{t("management:common.os")}:</Col>
                              <Col width={9}>
                                <Text size={Size.Medium}>{app.os}</Text>
                              </Col>
                            </Row>
                            <Row baseline>
                              <Col width={3}>{t("management:common.platform")}:</Col>
                              <Col width={9}>
                                <Text size={Size.Medium}>{app.humanReadablePlatform}</Text>
                              </Col>
                            </Row>
                          </Grid>
                        </RowCol>
                        <DesktopOnly>
                          {() => (
                            <RowCol>
                              <Grid rowSpacing={GridSpacing.XSmall}>
                                <Row baseline>
                                  <Col width={3}>{t("management:common.azureSubscription")}:</Col>
                                  <Col width={9}>
                                    <Text size={Size.Medium}>
                                      {(app.azure_subscription && app.azure_subscription.subscription_name) ||
                                        t("management:appDetails.azureSubscriptionDefaultValue")}
                                    </Text>
                                  </Col>
                                </Row>
                                {!app.azure_subscription &&
                                (app.isOwnedByCurrentUser ||
                                  organizationStore.isCurrentUserAnAdmin(organizationStore.find(appStore.app.owner.name))) ? (
                                  <Row>
                                    <Col width={3} />
                                    <Col width={9}>
                                      <Text size={Size.Small} color={TextColor.Secondary}>
                                        <Trans
                                          i18nKey={
                                            app.isOrgApp
                                              ? "management:appDetails.assignSubscriptionFromOrganizationSettings"
                                              : "management:appDetails.assignSubscriptionFromAccountSettings"
                                          }
                                        >
                                          <Link
                                            to={app.isOrgApp ? `/orgs/${app.owner.name}/manage/azure` : `/settings/azure`}
                                            data-test-id="app-details-azure-settings-link"
                                          >
                                            a
                                          </Link>
                                        </Trans>
                                      </Text>
                                    </Col>
                                  </Row>
                                ) : null}
                              </Grid>
                            </RowCol>
                          )}
                        </DesktopOnly>
                      </Grid>
                    </Card>
                  </Formsy.Form>
                </RowCol>
              </Grid>
            </Page>
          );
        }
      }
    )
  )
);
