import * as React from "react";
import {
  Panelify,
  PanelInjectedProps,
  Page,
  PageHeader,
  PanelOutlet,
  Grid,
  GridRow,
  GridCol,
  GridRowCol,
  GridSpacing,
  ActionList,
  ActionListAdd,
  IconName,
  autofetch,
  NotificationType,
  PageNotification,
  Space,
  Paragraph,
  Title,
  Size,
  TextColor,
  Menu,
  Action,
  Trigger,
  ClickableIcon,
  ConfirmationDialog,
  LinkActionItem,
} from "@root/shared";
import { RouteComponentProps } from "react-router";
import { observer } from "mobx-react";
import { locationStore } from "@root/stores";
import { ExportState, exportConfigurationStore } from "@root/data/management";
import { withTranslation, WithTranslation, Trans } from "react-i18next";
import { ExportUIStore } from "./export-ui-store";
import { ExportTypeIcon } from "./export-type-icon";
import { ExportConfigurationState } from "./export-configuration-state";

const banner = require("./assets/analytics-export-illustration.svg");

const styles = require("./export-configurations.scss");

/**
 * The main Export page.
 */
export const ExportConfigurations = Panelify(
  withTranslation(["common", "management"])(
    autofetch(exportConfigurationStore)(
      observer(
        class ExportConfigurations extends React.Component<PanelInjectedProps & RouteComponentProps<any, any> & WithTranslation, {}> {
          private exportUIStore = new ExportUIStore();

          public componentWillUnmount() {
            this.exportUIStore.clear();
          }

          public fetchData() {
            if (this.exportUIStore.stopFetching) {
              this.exportUIStore.clear();
            } else {
              this.exportUIStore.keepFetchingExportConfigurations();
            }
          }

          public render() {
            const { t } = this.props;

            return (
              <Page
                data-test-id="export-page"
                white
                header={<PageHeader title={t("management:appExport.title")} loading={this.exportUIStore.isLoading} />}
              >
                {this.exportUIStore.isFailed ? (
                  <PageNotification type={NotificationType.Error} children={t("management:appExport.serverError")} />
                ) : null}
                {this.renderContent()}
                <PanelOutlet>{this.props.children}</PanelOutlet>
              </Page>
            );
          }

          private renderContent() {
            const { t } = this.props;

            if (this.exportUIStore.isLoading || this.exportUIStore.isFailed) {
              return <div />;
            } else {
              return (
                <Grid rowSpacing={GridSpacing.Large}>
                  <GridRow middle columnSpacing={GridSpacing.XLarge}>
                    <GridCol>
                      <Title className={styles["title"]} size={Size.Medium} color={TextColor.Primary}>
                        {t("management:appExport.headerTitle")}
                      </Title>
                      <Paragraph size={Size.Medium} color={TextColor.Secondary}>
                        {t("management:appExport.headerSubtitle")}
                      </Paragraph>
                      <Paragraph size={Size.Medium} color={TextColor.Secondary} spaceAbove={Space.XSmall}>
                        <Trans i18nKey="management:appExport.learnMoreDetail">
                          <a href="https://docs.microsoft.com/en-us/mobile-center/analytics/export" target="_blank">
                            export
                          </a>
                        </Trans>
                      </Paragraph>
                    </GridCol>
                    <GridCol>
                      <img alt="" role="presentation" src={banner} />
                    </GridCol>
                  </GridRow>
                  <GridRowCol>
                    <ActionList>
                      {this.exportUIStore.exportConfigurations.map((configuration) => {
                        const enabled = configuration.state === ExportState.Enabled;
                        return (
                          <LinkActionItem
                            key={configuration.id}
                            between
                            to={locationStore.getUrlWithCurrentApp("/settings/export/:export_configuration_id", {
                              export_configuration_id: configuration.id!,
                            })}
                            disabled={!this.exportUIStore.canEditExportConfiguration}
                            noChevron
                          >
                            <GridCol className={styles["no-stretch"]}>
                              <ExportTypeIcon exportType={configuration.exportType!} />
                            </GridCol>
                            <GridCol>
                              <Paragraph size={Size.Medium} color={TextColor.Primary}>
                                {t(`management:exportDetails.exportType.${configuration.exportType}.name`)}
                              </Paragraph>
                              <Paragraph size={Size.Small} color={TextColor.Primary}>
                                {t(`management:appExport.exportTypeLabel.${configuration.custom ? "custom" : "standard"}`)}
                              </Paragraph>
                            </GridCol>
                            <GridCol className={styles["no-stretch"]}>
                              <ExportConfigurationState state={configuration.state!} />
                            </GridCol>
                            <GridCol className={styles["no-stretch"]} hideUntilRowHover>
                              <Menu>
                                <Trigger>
                                  <ClickableIcon icon={IconName.More} />
                                </Trigger>
                                {this.exportUIStore.canEditExportConfiguration && configuration.custom ? (
                                  <Action
                                    text={t("management:appExport.editExport")}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      this.editExportConfiguration(configuration.id!);
                                    }}
                                  />
                                ) : null}
                                {this.exportUIStore.canEditExportConfiguration &&
                                (configuration.state === ExportState.Enabled || configuration.state === ExportState.Disabled) ? (
                                  <Action
                                    text={t(`management:appExport.${enabled ? "disableExport" : "enableExport"}`)}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      this.setExportConfigurationState(configuration.id!, !enabled);
                                    }}
                                  />
                                ) : null}
                                {this.exportUIStore.canDeleteExportConfiguration ? (
                                  <Action
                                    className={styles["action-delete"]}
                                    text={t("management:appExport.deleteExport")}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      this.deleteExport(configuration.id!);
                                    }}
                                  />
                                ) : null}
                              </Menu>
                            </GridCol>
                          </LinkActionItem>
                        );
                      })}
                      {this.exportUIStore.canCreateExportConfiguration ? (
                        <ActionListAdd
                          data-test-id="new-export-button"
                          text={t("management:appExport.newExport")}
                          to={locationStore.getUrlWithCurrentApp("/settings/export/create")}
                        />
                      ) : null}
                    </ActionList>
                    <ConfirmationDialog
                      danger
                      visible={this.exportUIStore.deleteExportConfigurationWargningVisible}
                      onCancel={this.cancelDeleteExport}
                      onConfirm={this.confirmDeleteExport}
                      title={this.exportUIStore.deleteTitle}
                      description={this.exportUIStore.deleteMessage}
                      cancelButton={t("button.cancel")}
                      confirmButton={t("button.delete")}
                    />
                  </GridRowCol>
                </Grid>
              );
            }
          }

          private deleteExport = (id: string) => this.exportUIStore.deleteExportConfiguration(id);

          private editExportConfiguration = (id: string) =>
            locationStore.pushWithCurrentApp("/settings/export/:export_configuration_id", { export_configuration_id: id });

          private confirmDeleteExport = () => this.exportUIStore.confirmDeletingExportConfiguration();

          private cancelDeleteExport = () => this.exportUIStore.cancelDeletingExportConfiguration();

          private setExportConfigurationState = (id: string, enabled: boolean) =>
            this.exportUIStore.setExportConfigurationState(id, enabled);
        }
      )
    )
  )
);
