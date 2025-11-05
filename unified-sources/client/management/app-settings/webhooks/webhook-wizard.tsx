import * as React from "react";
import {
  Page,
  Modalify,
  Color,
  PrimaryButton,
  IconName,
  BottomBar,
  InputSize,
  Formsy,
  Autofocus,
  PageNotification,
  Title,
  Checkbox,
  Toggle,
  Size,
  Stretch,
  Button,
  ConfirmationDialog,
  ButtonContainer,
  Paragraph,
  Space,
  PageHeader,
} from "@root/shared";
import { Grid, RowCol, GridSpacing, Row, Col } from "@root/shared/grid";
import { RouteComponentProps } from "react-router";
import { observer } from "mobx-react";
import { WebhookWizardUIStore } from "./webhook-wizard-ui-store";
import { withTranslation, WithTranslation } from "react-i18next";
import { appStore } from "@root/stores";

const styles = require("./webhook-wizard.scss");

/**
 * The page to create and edit webhooks.
 */
export const WebhookWizard = Modalify(
  withTranslation(["common", "management"])(
    observer(
      class WebhookWizard extends React.Component<RouteComponentProps<any, any> & WithTranslation, {}> {
        private webhookWizardUiStore = new WebhookWizardUIStore();

        public UNSAFE_componentWillMount() {
          this.resetStore(this.props.routeParams["id"]);
        }

        public UNSAFE_componentWillUpdate(nextProps: any, nextState: any) {
          if (nextProps.routeParams["id"] !== this.props.routeParams["id"]) {
            this.resetStore(nextProps.routeParams["id"]);
          }
        }

        private resetStore(webhookId: string) {
          this.webhookWizardUiStore.reset();
          if (webhookId) {
            this.webhookWizardUiStore.fetch(webhookId);
          }
        }

        public render() {
          const store = this.webhookWizardUiStore;
          const { t } = this.props;
          const title = (() => {
            if (store.isFetching) {
              return "";
            } else if (store.isEdit) {
              if (store.canEditWebhook) {
                return t("management:webhookDetails.editWebhook");
              } else {
                return store.webhook.name;
              }
            } else {
              return t("management:webhookDetails.newTitle");
            }
          })();

          // Render the page.
          return (
            <Page
              data-test-id="webhook-wizard-page"
              header={<PageHeader title={title} loading={store.isSaving || store.isFetching} />}
            >
              {store.notification && store.isErrorCheckEnabled ? (
                <PageNotification type={store.notification.type} children={store.notification.message} />
              ) : null}

              <div>
                {store.isFetching ? (
                  <div />
                ) : (
                  <Formsy.Form key="createForm">
                    <Grid rowSpacing={GridSpacing.Large} bordered>
                      <RowCol>
                        <Grid rowSpacing={GridSpacing.Small}>
                          {store.isEdit && store.canEditWebhook ? (
                            <RowCol className={styles.enableWebhook}>
                              <Stretch>
                                <Title id="toggle-webhook" size={Size.Small}>
                                  {t("management:webhookDetails.enableSetting")}
                                </Title>
                                <Toggle
                                  data-test-id="toggle-webhook"
                                  aria-labelledby="toggle-webhook"
                                  checked={store.webhook.enabled}
                                  onChange={(e: any) => store.setEnabled(e.target.checked)}
                                >
                                  {store.webhook.enabled ? t("state.on") : t("state.off")}
                                </Toggle>
                              </Stretch>
                            </RowCol>
                          ) : null}
                          <RowCol>
                            <Autofocus focus={store.isFetched}>
                              <Formsy.Input
                                data-test-id="new-webhook-input-name"
                                name="name"
                                size={InputSize.Large}
                                label={`${t("management:webhookDetails.name.label")}:`}
                                value={store.webhook.name || ""}
                                disabled={!store.webhook.enabled || !store.canEditWebhook}
                                placeholder={t("management:webhookDetails.name.placeholder")}
                                onChange={(e: any) => store.setName(e.target.value)}
                                isRequired
                                validations={WebhookWizardUIStore.nameValidations}
                                validationErrors={WebhookWizardUIStore.nameValidationErrors}
                              />
                            </Autofocus>
                          </RowCol>
                          <RowCol>
                            <Formsy.TextArea
                              data-test-id="new-webhook-input-url"
                              name="url"
                              rows="4"
                              label={`${t("management:webhookDetails.url.label")}:`}
                              value={store.webhook.url || ""}
                              disabled={!store.webhook.enabled || !store.canEditWebhook}
                              placeholder={t("management:webhookDetails.url.placeholder")}
                              onChange={(e: any) => store.setUrl(e.target.value)}
                              validations={WebhookWizardUIStore.urlValidations}
                              validationErrors={WebhookWizardUIStore.urlValidationErrors}
                            />
                          </RowCol>
                        </Grid>
                      </RowCol>

                      <RowCol>
                        <Grid rowSpacing={GridSpacing.Large}>
                          <RowCol>
                            <Title spaceBelow={Space.XSmall} size={Size.Small}>
                              {t("management:webhookDetails.trigger")}
                            </Title>
                          </RowCol>
                          {appStore.app.isAppWhitelisted ? (
                            <Row>
                              <Col width={5}>
                                <Paragraph bold size={Size.Medium}>
                                  {t("management:notifications.distribution")}
                                </Paragraph>
                              </Col>
                              <Col width={7} className={styles.triggers}>
                                <Checkbox
                                  data-test-id="distribution-checkbox"
                                  checked={store.callOnNewAppRelease}
                                  disabled={!store.webhook.enabled || !store.canEditWebhook}
                                  onChange={(e: any) => store.setCallOnNewAppRelease(e.target.checked)}
                                >
                                  {t("management:notifications.newVersion")}
                                </Checkbox>
                              </Col>
                            </Row>
                          ) : null}
                          <Row>
                            <Col width={5}>
                              <Paragraph bold size={Size.Medium}>
                                {t("management:notifications.crashes")}
                              </Paragraph>
                            </Col>
                            <Col width={7} className={styles.triggers}>
                              <Checkbox
                                data-test-id="crashes-checkbox"
                                checked={store.callOnNewCrashGroup}
                                disabled={!store.webhook.enabled || !store.canEditWebhook}
                                onChange={(e: any) => store.setCallOnNewCrashGroup(e.target.checked)}
                              >
                                {t("management:notifications.newCrashGroup")}
                              </Checkbox>
                            </Col>
                          </Row>
                        </Grid>
                      </RowCol>
                    </Grid>
                  </Formsy.Form>
                )}
              </div>

              <BottomBar className={styles["bottom-bar"]}>
                {store.isEdit && store.canRemoveWebhook ? (
                  <div>
                    <Button data-test-id="delete-button" className={styles["delete-button"]} onClick={() => store.removeWebhook()}>
                      {t("management:webhookDetails.deleteButton")}
                    </Button>
                    <ConfirmationDialog
                      danger
                      data-test-id="webhookdetails-delete-dialog"
                      visible={store.removeWebhookWarningIsVisible}
                      onCancel={() => store.cancelRemovingWebhook()}
                      onConfirm={() => store.finishRemovingWebhook()}
                      title={t("management:webhookDetails.deleteDialog.title", { webhook: store.webhook })}
                      description={t("management:webhookDetails.deleteDialog.message")}
                      cancelButton={t("button.cancel")}
                      confirmButton={t("button.delete")}
                    />
                  </div>
                ) : (
                  <div />
                )}
                <ButtonContainer>
                  {store.isEdit && store.canTestWebhook ? (
                    <Button
                      data-test-id="test-button"
                      onClick={() => store.createOrUpdateWebhook(true)}
                      progress={store.isTesting}
                      disabled={store.isSaving || !store.isValidWebhook}
                    >
                      {store.isTesting
                        ? t("management:webhookDetails.testButton.pending")
                        : t("management:webhookDetails.testButton.action")}
                    </Button>
                  ) : null}
                  {store.canEditWebhook ? (
                    <PrimaryButton
                      data-test-id="webhook-submit"
                      icon={store.isSaving ? IconName.Loading : (null as any)}
                      color={Color.Blue}
                      disabled={store.isSaving || !store.isValidWebhook}
                      onClick={() => store.createOrUpdateWebhook()}
                    >
                      {store.isEdit
                        ? t("management:webhookDetails.submitButton.existing")
                        : t("management:webhookDetails.submitButton.new")}
                    </PrimaryButton>
                  ) : null}
                </ButtonContainer>
              </BottomBar>
            </Page>
          );
        }
      }
    )
  )
);
