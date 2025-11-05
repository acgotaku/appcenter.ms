import * as React from "react";
import { RouteComponentProps } from "react-router";
import {
  Page,
  TopBar,
  Panelify,
  Formsy,
  PrimaryButton,
  LinkButton,
  Button,
  PageNotification,
  Color,
  Paragraph,
  Size,
  OrganizationIcon,
  Space,
  TextColor,
  MessageBar,
  NotificationType,
} from "@root/shared";
import { IOrganization } from "@lib/common-interfaces";
import { observer, Observer } from "mobx-react";
import { Grid, Row, Col, GridSpacing, RowCol } from "@root/shared/grid";
import { MessageDialog } from "../../../shared/message-dialog/message-dialog";
import { UpdateOrgStore } from "../../../stores/orgs/update-org-store";
import { DeleteOrgStore } from "../../../stores/orgs/delete-org-store";
import { organizationStore } from "@root/stores";
import { VALIDATION_ERRORS, VALIDATIONS } from "../../../utils/formsy/validations";
import { trim } from "lodash";
import { withTranslation, WithTranslation } from "react-i18next";
import { ImageUploader } from "@root/shared/image-uploader/image-uploader";
import { Organization } from "@root/data/shell/models/organization";

const styles = require("./settings.scss");

export interface SettingsProps extends RouteComponentProps<any, any> {
  // Nothing to add here yet.
}

export const Settings = Panelify(
  withTranslation(["common", "management"])(
    observer(
      class Settings extends React.Component<SettingsProps & WithTranslation, {}> {
        private _updateOrgStore = new UpdateOrgStore(this.organization!);
        private _deleteOrgStore = new DeleteOrgStore();

        private get organization() {
          const { org_name } = this.props.params;
          return organizationStore.find(org_name);
        }

        public render() {
          const { t } = this.props;
          const { organization } = this;
          if (!organization) {
            return null;
          }

          const { isPending } = this._updateOrgStore;
          const notification = this._updateOrgStore.notification || this._deleteOrgStore.notification;
          const validationErrors = {
            name: this._updateOrgStore.conflictError,
          };
          const dialogButtonsClassName = styles["dialog-buttons"];
          let form: Formsy.Form;

          return (
            <Page data-test-id="manage-org-settings" constrainedWidth>
              <TopBar
                loading={this._updateOrgStore.isPending}
                title={t("title.settings")}
                controlsArea={
                  <div>
                    <LinkButton danger onClick={() => this._deleteButtonOnClick(organization)} data-test-id="delete-org">
                      {t("management:orgSettings.deleteDialog.action")}
                    </LinkButton>
                    <MessageDialog
                      data-test-id="manage-org-settings-delete-dialog"
                      visible={this._deleteOrgStore.isDeleteWarningVisible}
                      onRequestClose={() => this._deleteOrgStore.hideDeleteWarning()}
                      title={t("management:orgSettings.deleteDialog.title", { organization })}
                      message={t("management:orgSettings.deleteDialog.message")}
                      buttonsArea={
                        <div className={dialogButtonsClassName}>
                          <Button onClick={() => this._deleteOrgStore.hideDeleteWarning()}>{t("button.cancel")}</Button>
                          <PrimaryButton
                            data-test-id="delete-org-confirm"
                            progress={this._deleteOrgStore.isPending}
                            color={Color.Red}
                            onClick={() => this._deleteOrgStore.delete(organization)}
                          >
                            {this._deleteOrgStore.isPending
                              ? t("management:orgSettings.deleteDialog.button.pending")
                              : t("management:orgSettings.deleteDialog.button.action")}
                          </PrimaryButton>
                        </div>
                      }
                    />
                  </div>
                }
                closeButton={false}
              />
              {notification && notification.message ? (
                <PageNotification type={notification.type}>{notification.message}</PageNotification>
              ) : null}
              <div>
                <Formsy.Form
                  ref={(ref) => (ref ? (form = ref) : null)}
                  onValidSubmit={(data) => this._handleSubmit(organization, data)}
                  validationErrors={validationErrors}
                >
                  <Grid rowSpacing={GridSpacing.Page}>
                    <RowCol>
                      <MessageBar type={NotificationType.Error} compact visible={this._updateOrgStore.hasIconError}>
                        {t(this._updateOrgStore.iconErrorMessageKey!)}
                      </MessageBar>
                    </RowCol>
                    <Row>
                      <Col width={9}>
                        <Grid>
                          <RowCol>
                            <Observer>
                              {() => (
                                <Formsy.Input
                                  label={t("management:orgSettings.name.label")}
                                  name="displayName"
                                  value={this._updateOrgStore.name}
                                  onChange={(event) => this._updateOrgStore.setFields({ name: event.target.value })}
                                  disabled={false}
                                  type="text"
                                  placeholder={t("management:orgSettings.name.placeholder")}
                                  autoCorrect="none"
                                  autoCapitalize="none"
                                  autoComplete="off"
                                  spellCheck="false"
                                  isRequired
                                  requiredError={t("management:orgSettings.name.requiredError")}
                                  validations={VALIDATIONS.ORG_DISPLAY_NAME}
                                  validationErrors={VALIDATION_ERRORS.ORG_DISPLAY_NAME}
                                  data-test-id="name-input"
                                />
                              )}
                            </Observer>
                          </RowCol>
                          <RowCol>
                            <Observer>
                              {() => (
                                <Formsy.Input
                                  label={t("management:orgSettings.url.label")}
                                  name="name"
                                  type="text"
                                  autoCorrect="none"
                                  autoCapitalize="none"
                                  autoComplete="off"
                                  spellCheck="false"
                                  isRequired
                                  requiredError={t("management:orgSettings.url.requiredError")}
                                  leadingText={`${window.location.origin}/orgs/`}
                                  value={this._updateOrgStore.url}
                                  onChange={(event) => this._updateOrgStore.setFields({ url: event.target.value })}
                                  validations={VALIDATIONS.ORG_NAME}
                                  validationErrors={VALIDATION_ERRORS.ORG_URL}
                                  data-test-id="url-input"
                                />
                              )}
                            </Observer>
                          </RowCol>
                          <RowCol>
                            <Observer>
                              {() => (
                                <PrimaryButton data-test-id="update-details-button" type="submit" progress={isPending}>
                                  {isPending
                                    ? t("management:orgSettings.submitButton.pending")
                                    : t("management:orgSettings.submitButton.action")}
                                </PrimaryButton>
                              )}
                            </Observer>
                          </RowCol>
                        </Grid>
                      </Col>
                      <Col>
                        <Paragraph.asLabel spaceBelow={Space.XXSmall} size={Size.Medium} style={{ display: "block" }} htmlFor="TODO">
                          Icon:
                        </Paragraph.asLabel>
                        <ImageUploader
                          hasImage={!!organization.avatar_url}
                          onDelete={() => this._updateOrgStore.deleteIcon(organization)}
                          round
                          accept="image/png, image/jpeg"
                          onSelect={(file) => this._updateOrgStore.updateOrgIcon(organization, file)}
                          uploadProgress={this._updateOrgStore.uploadProgress}
                        >
                          <OrganizationIcon size={86} organization={organization} />
                        </ImageUploader>
                        <Paragraph
                          spaceAbove={Space.XXSmall}
                          color={this._updateOrgStore.iconValidationMessageKey ? TextColor.Danger : TextColor.Secondary}
                          size={Size.Small}
                        >
                          {t(this._updateOrgStore.iconValidationMessageKey || "management:common.icon.requirements")}
                        </Paragraph>
                      </Col>
                    </Row>
                  </Grid>
                </Formsy.Form>
                <MessageDialog
                  data-test-id="manage-org-settings-dialog"
                  visible={this._updateOrgStore.isWarningVisible}
                  onRequestClose={() => this._updateOrgStore.hideUpdateWarning()}
                  title={t("management:orgSettings.url.confirm.title")}
                  message={t("management:orgSettings.url.confirm.message")}
                  buttonsArea={
                    <div className={dialogButtonsClassName}>
                      <Button onClick={() => this._updateOrgStore.hideUpdateWarning()}>{t("button.cancel")}</Button>
                      <PrimaryButton
                        data-test-id="change-url-confirm-button"
                        onClick={() => this._onUpdateWarningAcknowledged(organization, (form as any).model)}
                      >
                        {t("management:orgSettings.url.confirm.action")}
                      </PrimaryButton>
                    </div>
                  }
                />
              </div>
            </Page>
          );
        }

        /**
         * Clear the notifications for this page.
         */
        private _clearNotifications(): void {
          this._updateOrgStore.resetState();
          this._deleteOrgStore.resetState();
        }

        /**
         * Handle the submit of the form.
         */
        private _handleSubmit(oldOrganization: Organization, newOrganizationData: any, overrideWarning?: boolean): void {
          const { displayName, name } = newOrganizationData;
          const newOrganization: IOrganization = { name, display_name: trim(displayName) };

          this._clearNotifications();

          // If user is changing the organization name, show the warning. Don't update right away!
          if (!overrideWarning && newOrganization.name !== oldOrganization.name) {
            this._updateOrgStore.showUpdateWarning();
            return;
          }

          this._updateOrgStore.update(oldOrganization, newOrganization);
        }

        /**
         * Handles the action when a user acknowledges that they want to change the organization name.
         */
        private _onUpdateWarningAcknowledged(oldOrganization: Organization, newOrganizationData: any): void {
          this._updateOrgStore.hideUpdateWarning();
          this._handleSubmit(oldOrganization, newOrganizationData, true);
        }

        /**
         * Handles the remove button click.
         */
        private _deleteButtonOnClick(organization: IOrganization): void {
          this._clearNotifications();
          this._deleteOrgStore.showDeleteWarning();
        }
      }
    )
  )
);
