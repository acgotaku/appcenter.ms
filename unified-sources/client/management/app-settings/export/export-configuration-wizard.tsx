import * as React from "react";
import {
  Page,
  Modalify,
  PageHeader,
  BottomBar,
  ButtonContainer,
  Button,
  PrimaryButton,
  LinkButton,
  BackButton,
  Icon,
  IconName,
  IconSize,
  Color,
  PageNotification,
  Input,
  Grid,
  GridRow,
  GridCol,
  GridRowCol,
  GridSpacing,
  Toggle,
  ConfirmationDialog,
  Paragraph,
  Size,
  TextColor,
  NotificationType,
  ButtonSize,
  Space,
} from "@root/shared";
import { RouteComponentProps } from "react-router";
import { observer } from "mobx-react";
import { withTranslation, WithTranslation, Trans } from "react-i18next";
import { ExportWizardUIStore } from "./export-wizard-ui-store";
import { ExportType, ExportState } from "@root/data/management";
import { values } from "lodash";
import { ExportTypeIcon } from "./export-type-icon";

const classNames = require("classnames");
const styles = require("./export-configuration-wizard.scss");

/**
 * The page to create and edit export configurations.
 */
export const ExportConfigurationWizard = Modalify(
  withTranslation(["common", "management"])(
    observer(
      class ExportConfigurationWizard extends React.Component<RouteComponentProps<any, any> & WithTranslation, {}> {
        private exportWizardUIStore = new ExportWizardUIStore();

        public UNSAFE_componentWillMount() {
          this.resetStore(this.props.routeParams["id"]);
        }

        public UNSAFE_componentWillUpdate(nextProps: any, nextState: any) {
          if (nextProps.routeParams["id"] !== this.props.routeParams["id"]) {
            this.resetStore(nextProps.routeParams["id"]);
          }
        }

        private resetStore(exportConfigurationId: string) {
          this.exportWizardUIStore.reset();
          if (exportConfigurationId) {
            this.exportWizardUIStore.fetch(exportConfigurationId);
          }
        }

        public render() {
          const { t } = this.props;
          return (
            <Page
              data-test-id="export-wizard-page"
              header={
                <PageHeader
                  title={this.exportWizardUIStore.title}
                  loading={this.exportWizardUIStore.isFetching || this.exportWizardUIStore.isSaving}
                >
                  {this.renderTop()}
                </PageHeader>
              }
            >
              {this.exportWizardUIStore.displayWarning ? (
                <PageNotification children={t("management:appExport.nonAppOwnerWarning")} type={NotificationType.Warning} />
              ) : this.exportWizardUIStore.displayInfo ? (
                <PageNotification children={t("management:appExport.nonOrgOwnerInfo")} type={NotificationType.Info} />
              ) : (
                <div />
              )}
              <div>{this.renderContent()}</div>
              {this.renderBottom()}
            </Page>
          );
        }

        private renderContent() {
          const { t } = this.props;
          const enabled = this.exportWizardUIStore.exportConfiguration.state === ExportState.Enabled;
          const toggable =
            this.exportWizardUIStore.exportConfiguration.state === ExportState.Enabled ||
            this.exportWizardUIStore.exportConfiguration.state === ExportState.Disabled;

          if (this.exportWizardUIStore.exportConfiguration) {
            if (this.exportWizardUIStore.isEdit) {
              return this.exportWizardUIStore.isFetching ? (
                <div />
              ) : (
                <Grid>
                  <GridRow middle>
                    <GridCol width={4}>
                      <Paragraph size={Size.Medium}>{t("management:exportDetails.edit.exportType")}</Paragraph>
                    </GridCol>
                    <GridCol width={8} className={styles["col-right"]}>
                      <Paragraph size={Size.Medium}>
                        {t(
                          `management:exportDetails.type.${
                            this.exportWizardUIStore.exportConfiguration.custom ? "custom" : "standard"
                          }`
                        )}
                      </Paragraph>
                    </GridCol>
                  </GridRow>

                  {this.exportWizardUIStore.isCustom ? (
                    <GridRow>
                      <GridCol width={4} className={styles["col-middle"]}>
                        <Paragraph size={Size.Medium}>
                          {t(`management:exportDetails.edit.secret.${this.exportWizardUIStore.exportConfiguration.exportType}`)}
                        </Paragraph>
                      </GridCol>
                      <GridCol width={8}>
                        <Input
                          name="secret"
                          spellCheck={false}
                          placeholder={this.exportWizardUIStore.secretPlaceholder}
                          value={this.exportWizardUIStore.secret || ""}
                          onChange={this.setSecret}
                        />
                        {this.renderSecretError()}
                      </GridCol>
                    </GridRow>
                  ) : null}

                  {!this.exportWizardUIStore.isCustom && this.exportWizardUIStore.subscription ? (
                    <GridRow middle>
                      <GridCol width={4}>
                        <Paragraph size={Size.Medium}>{t("management:exportDetails.edit.subscription")}</Paragraph>
                      </GridCol>
                      <GridCol width={8} className={styles["col-right"]}>
                        <Paragraph size={Size.Medium}>{this.exportWizardUIStore.subscription.subscription_name}</Paragraph>
                        <Paragraph size={Size.Small} color={TextColor.Secondary}>
                          {this.exportWizardUIStore.subscription.subscription_id}
                        </Paragraph>
                      </GridCol>
                    </GridRow>
                  ) : null}

                  <GridRow>
                    <GridCol width={4} className={styles["col-middle-small"]}>
                      <Paragraph size={Size.Medium}>{t("management:exportDetails.edit.enabled")}</Paragraph>
                    </GridCol>
                    <GridCol width={8} className={styles["col-right"]}>
                      <Toggle disabled={!toggable} className={styles["toggle"]} checked={enabled} onChange={this.toggleExport}>
                        {enabled ? "On" : "Off"}
                      </Toggle>
                      {this.exportWizardUIStore.exportConfiguration.stateInfo ? (
                        <Paragraph size={Size.Small} color={TextColor.Error} className={styles["error-message"]}>
                          {this.exportWizardUIStore.exportConfiguration.stateInfo}
                        </Paragraph>
                      ) : null}
                    </GridCol>
                  </GridRow>
                </Grid>
              );
            } else {
              if (this.exportWizardUIStore.custom) {
                return (
                  <Grid rowSpacing={GridSpacing.Large}>
                    <GridRowCol>
                      <Grid rowSpacing={GridSpacing.XSmall}>
                        <GridRowCol>
                          <Paragraph size={Size.Large}>{t("management:exportDetails.create.customizeLabel")}</Paragraph>
                        </GridRowCol>
                        <GridRowCol>
                          <Paragraph size={Size.Medium}>{t("management:exportDetails.create.customizeDescription")}</Paragraph>
                          <Paragraph className={styles["customize-link"]} size={Size.Medium}>
                            <a href="https://portal.azure.com" target="_blank">
                              {t("management:exportDetails.create.customizeLink")}
                            </a>
                          </Paragraph>
                        </GridRowCol>
                      </Grid>
                    </GridRowCol>

                    <GridRowCol>
                      <Grid rowSpacing={GridSpacing.XSmall}>
                        <GridRowCol>
                          <Paragraph size={Size.Large}>{t("management:exportDetails.create.secretLabel")}</Paragraph>
                        </GridRowCol>
                        <GridRow>
                          <GridCol width={4} className={styles["col-middle"]}>
                            <Paragraph size={Size.Medium}>
                              {t(`management:exportDetails.edit.secret.${this.exportWizardUIStore.exportType}`)}
                            </Paragraph>
                          </GridCol>
                          <GridCol width={8}>
                            <Input
                              name="secret"
                              spellCheck={false}
                              placeholder={this.exportWizardUIStore.secretPlaceholder}
                              value={this.exportWizardUIStore.secret || ""}
                              onChange={this.setSecret}
                            />
                            {this.renderSecretError()}
                          </GridCol>
                        </GridRow>
                      </Grid>
                    </GridRowCol>
                  </Grid>
                );
              } else {
                return (
                  <Grid>
                    <Paragraph size={Size.Medium} spaceAbove={Space.XXSmall}>
                      {t("management:exportDetails.exportTo")}
                    </Paragraph>
                    <GridRow role="list" middle columnSpacing={GridSpacing.XSmall}>
                      {values<ExportType>(ExportType).map((exportType) => {
                        return (
                          <GridCol role="listitem" key={exportType}>
                            {this.renderExportConfigurationButton(exportType)}
                          </GridCol>
                        );
                      })}
                      <GridCol role="presentation"></GridCol>
                    </GridRow>
                  </Grid>
                );
              }
            }
          }

          return null;
        }

        private renderSecretError() {
          const message = this.exportWizardUIStore.failureMessage;
          if (message) {
            return (
              <Paragraph className={styles["error-message"]} size={Size.Small} color={TextColor.Error}>
                {message}
              </Paragraph>
            );
          }
          return null;
        }

        private renderExportConfigurationButton(exportType: ExportType) {
          const { t } = this.props;
          const selected = exportType === this.exportWizardUIStore.exportType;
          const disabled = !this.exportWizardUIStore.canCreateExportConfiguration(exportType);
          const className = classNames(
            styles["export-type-button"],
            selected && styles["export-type-button-selected"],
            disabled && styles["export-type-button-disabled"]
          );

          return (
            <Button
              data-test-id="export-type"
              className={className}
              disabled={disabled}
              onClick={() => this.exportWizardUIStore.setExportType(exportType)}
            >
              <ExportTypeIcon className={styles["export-type-icon"]} exportType={exportType} big />
              <div className={styles["export-type-title"]}>{t(`management:exportDetails.exportType.${exportType}.name`)}</div>
              <div className={styles["export-type-subtitle"]}>
                <span className={styles["subtitle"]}>{t(`management:exportDetails.exportType.${exportType}.subtitle`)}</span>
                <span className={styles["already-used"]}>{t(`management:exportDetails.exportTypeAlreadyUsed`)}</span>
              </div>
            </Button>
          );
        }

        private renderBottom() {
          const { t } = this.props;
          const showDeleteButton = this.exportWizardUIStore.isEdit && this.exportWizardUIStore.canDeleteExportConfiguration;
          return (
            <BottomBar className={styles["bottom-bar"]}>
              {showDeleteButton ? (
                <div>
                  <LinkButton
                    onClick={this.deleteExport}
                    disabled={this.exportWizardUIStore.isSaving || this.exportWizardUIStore.isFetching}
                    danger
                  >
                    {t("management:exportDetails.deleteButton")}
                  </LinkButton>
                  <ConfirmationDialog
                    danger
                    visible={this.exportWizardUIStore.deleteExportConfigurationWargningVisible}
                    onCancel={this.cancelDeleteExport}
                    onConfirm={this.confirmDeleteExport}
                    title={this.exportWizardUIStore.deleteTitle}
                    description={this.exportWizardUIStore.deleteMessage}
                    cancelButton={t("button.cancel")}
                    confirmButton={t("button.delete")}
                  />
                </div>
              ) : null}

              {this.exportWizardUIStore.custom && !this.exportWizardUIStore.isEdit ? (
                <div>
                  <BackButton onClick={this.disableCustomize}>{t("management:exportDetails.backButton")}</BackButton>
                </div>
              ) : null}

              {!this.exportWizardUIStore.custom && !showDeleteButton ? <div /> : null}

              <ButtonContainer>
                {!this.exportWizardUIStore.isEdit && !this.exportWizardUIStore.custom ? (
                  <Button
                    disabled={this.exportWizardUIStore.isSaving || !this.exportWizardUIStore.isValidExportConfiguration}
                    onClick={this.enableCustomize}
                  >
                    {t("management:exportDetails.customizeButton")}
                  </Button>
                ) : null}

                {!this.exportWizardUIStore.isEdit || this.exportWizardUIStore.custom || this.exportWizardUIStore.isCustom ? (
                  <PrimaryButton
                    data-test-id="submit-button"
                    progress={this.exportWizardUIStore.isSaving}
                    disabled={
                      this.exportWizardUIStore.isSaving ||
                      !this.exportWizardUIStore.isValidExportConfiguration ||
                      (this.exportWizardUIStore.isEdit && !this.exportWizardUIStore.isChanged) ||
                      this.exportWizardUIStore.displayWarning ||
                      this.exportWizardUIStore.displayInfo ||
                      this.exportWizardUIStore.secretInvalid
                    }
                    onClick={
                      this.exportWizardUIStore.isEdit
                        ? this.createOrUpdateExportConfiguration
                        : this.exportWizardUIStore.custom
                        ? this.createCustomExportConfiguration
                        : this.exportWizardUIStore.hasAzureSubscription
                        ? this.createStandardExportConfiguration
                        : this.addAzureSubscription
                    }
                  >
                    {this.exportWizardUIStore.isEdit
                      ? this.exportWizardUIStore.isSaving
                        ? t("management:exportDetails.submitButton.saving")
                        : t("management:exportDetails.submitButton.existing")
                      : this.exportWizardUIStore.custom
                      ? this.exportWizardUIStore.isSaving
                        ? t("management:exportDetails.submitButton.creating.custom")
                        : t("management:exportDetails.submitButton.custom")
                      : this.exportWizardUIStore.isSaving
                      ? t("management:exportDetails.submitButton.creating.standard")
                      : t("management:exportDetails.submitButton.standard")}
                  </PrimaryButton>
                ) : null}

                <ConfirmationDialog
                  data-test-id="add-export-dialog"
                  visible={this.exportWizardUIStore.increaseAzureUsageWargningVisible}
                  onCancel={this.cancelCreateExportConfiguration}
                  onConfirm={this.createOrUpdateExportConfiguration}
                  title={this.exportWizardUIStore.createExportConfigurationTitle}
                  description={
                    <Paragraph size={Size.Medium} color={TextColor.Secondary}>
                      <Trans i18nKey="management:exportDetails.increaseDialog.message">
                        <a href={this.exportWizardUIStore.pricingUrl} target="_blank">
                          pricing
                        </a>
                      </Trans>
                    </Paragraph>
                  }
                  cancelButton={t("button.cancel")}
                  confirmButton={t(`management:exportDetails.increaseDialog.${this.exportWizardUIStore.custom ? "increase" : "add"}`)}
                />

                <ConfirmationDialog
                  data-test-id="add-subscription-dialog"
                  visible={this.exportWizardUIStore.addAzureSubscriptionWargningVisible}
                  onCancel={this.cancelAddAzureSubscription}
                  onConfirm={this.confirmAddAzureSubscription}
                  title={t("management:exportDetails.addSubscriptionDialog.title")}
                  description={t(
                    `management:exportDetails.addSubscriptionDialog.${
                      this.exportWizardUIStore.isOrgApp ? "messageOrganization" : "messageAccount"
                    }`
                  )}
                  cancelButton={t("button.cancel")}
                  confirmButton={t("management:exportDetails.addSubscriptionDialog.add")}
                />
              </ButtonContainer>
            </BottomBar>
          );
        }

        private renderTop() {
          const { t } = this.props;
          return this.exportWizardUIStore.azureLink ? (
            <PrimaryButton
              size={ButtonSize.Small}
              icon={<Icon icon={IconName.Azure} size={IconSize.Small} color={Color.Blue} />}
              href={this.exportWizardUIStore.azureLink}
              target="_blank"
              color={Color.LightGray}
            >
              {t(`management:exportDetails.topButton`)}
            </PrimaryButton>
          ) : (
            <div />
          );
        }

        private addAzureSubscription = () => this.exportWizardUIStore.addAzureSubscription();

        private confirmAddAzureSubscription = () => this.exportWizardUIStore.confirmAddAzureSubscription();

        private cancelAddAzureSubscription = () => this.exportWizardUIStore.cancelAddAzureSubscription();

        private createStandardExportConfiguration = () => this.exportWizardUIStore.createStandardExportConfiguration();

        private createCustomExportConfiguration = () => this.exportWizardUIStore.createCustomExportConfiguration();

        private cancelCreateExportConfiguration = () => this.exportWizardUIStore.cancelCreateExportConfiguration();

        private enableCustomize = () => this.exportWizardUIStore.enableCustomize();

        private disableCustomize = () => this.exportWizardUIStore.disableCustomize();

        private createOrUpdateExportConfiguration = () => this.exportWizardUIStore.createOrUpdateExportConfiguration();

        private setSecret = (e) => this.exportWizardUIStore.setSecret(e.target.value);

        private toggleExport = (e) => this.exportWizardUIStore.setState(e.target.checked);

        private deleteExport = () => this.exportWizardUIStore.deleteExportConfiguration();

        private confirmDeleteExport = () => this.exportWizardUIStore.confirmDeletingExportConfiguration();

        private cancelDeleteExport = () => this.exportWizardUIStore.cancelDeletingExportConfiguration();
      }
    )
  )
);
