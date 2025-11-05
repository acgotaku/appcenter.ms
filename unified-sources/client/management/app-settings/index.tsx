import * as React from "react";
import { observer } from "mobx-react";
import { RouteComponentProps } from "react-router";
import {
  Panelify,
  PanelPosition,
  PanelOutlet,
  Page,
  MediaObject,
  AppIcon,
  Space,
  Stretch,
  InfoLabel,
  AvatarList,
  IconName,
  Trigger,
  ClickableIcon,
  Menu,
  ConfirmationDialog,
  Color,
  PrimaryButton,
  SecondaryButton,
  OrganizationIcon,
  Action,
  PageNotification,
  SecondaryNavigation,
  PageHeader,
  DesktopOnly,
  MobileOnly,
  Pill,
} from "@root/shared";
import { Grid, RowCol, GridSpacing } from "@root/shared/grid";
import { Title, Paragraph, Size, Text, TextColor } from "@root/shared/typography";
import { appStore, locationStore } from "@root/stores";
import { SettingsRouteCard } from "../shared/settings-route-card";
import { TransferAppDialog } from "./transfer-app-dialog";
import { AppSettingsUIStore } from "./app-settings-ui-store";
import { withTranslation, WithTranslation } from "react-i18next";

const styles = require("./index.scss");

export const AppSettings = Panelify(
  withTranslation(["common", "management"])(
    observer(
      class AppSettings extends React.Component<RouteComponentProps<any, any> & WithTranslation, {}> {
        private appSettingsUIStore!: AppSettingsUIStore;

        public UNSAFE_componentWillMount() {
          this.handlePropsChange(this.props, true);
        }

        public UNSAFE_componentWillReceiveProps(nextProps) {
          this.handlePropsChange(nextProps);
        }

        public handlePropsChange(props: RouteComponentProps<any, any>, isMounting: boolean = false) {
          const { params } = props;
          const { app_name, owner_name, owner_type } = params;
          if (isMounting || appStore.hasAppChanged(owner_type, owner_name, app_name)) {
            this.appSettingsUIStore = new AppSettingsUIStore();
          }
        }

        public componentWillUnmount() {
          this.appSettingsUIStore.resetDataStoreStates();
        }

        public render() {
          const { t } = this.props;
          const { app } = appStore;
          const {
            isPending,
            userCan,
            collaborators,
            peopleSubtitle,
            webhooksSubtitle,
            exportConfigurationsSubtitle,
            exportConfigurationsCounts,
            servicesSubtitle,
            shouldShowCollaboratorsSkeletons,
            notificationsSubtitle,
            secondaryNavItems,
            deleteApp,
            isDeletingApp,
            deleteAppDialogIsVisible,
            cancelDeletingApp,
            launchDeleteAppDialog,
            launchTransferAppDialog,
            teams,
            deleteNotification,
            apiTokenCount,
          } = this.appSettingsUIStore;

          return (
            <Page
              data-test-id="app-settings-page"
              constrainedWidth
              supportsMobile
              header={
                <PageHeader loading={isPending} title={t("management:appSettings.title")}>
                  {userCan.seeAppSecret || userCan.transferApp || userCan.deleteApp ? (
                    <Menu data-test-id="app-settings-menu">
                      <Trigger>
                        <ClickableIcon icon={IconName.MoreFilled} />
                      </Trigger>
                      {userCan.seeAppSecret ? (
                        <Action
                          text={t("management:appSettings.actions.copySecret")}
                          clipboardData={app.app_secret}
                          data-test-id="app-settings-copy-app-secret"
                        />
                      ) : null}
                      {userCan.transferApp ? (
                        <DesktopOnly>
                          {() => (
                            <Action
                              text={t("management:appSettings.actions.transfer")}
                              onClick={launchTransferAppDialog}
                              data-test-id="app-settings-transfer-app"
                            />
                          )}
                        </DesktopOnly>
                      ) : null}
                      {userCan.deleteApp ? (
                        <Action
                          danger
                          text={t("management:appSettings.actions.delete")}
                          onClick={launchDeleteAppDialog}
                          data-test-id="app-settings-delete-app"
                        />
                      ) : null}
                    </Menu>
                  ) : null}
                </PageHeader>
              }
            >
              {deleteNotification ? (
                <PageNotification type={deleteNotification.type}>{deleteNotification.message}</PageNotification>
              ) : null}
              <div>
                <Grid>
                  <RowCol visible={PanelPosition.Primary}>
                    <Grid rowSpacing={GridSpacing.Page}>
                      <RowCol>
                        <SettingsRouteCard
                          title={t("management:appDetails.title")}
                          to={locationStore.getUrlWithCurrentApp("settings/details")}
                          viewOnly={!userCan.editDetails}
                          editable
                          data-test-id="app-settings-app-details-card"
                        >
                          <Stretch>
                            <MediaObject
                              hSpace={Space.Medium}
                              className={app.release_type ? styles.detailsWithEnv : styles.details}
                              data-test-id="app-settings-details-media-info"
                            >
                              <AppIcon app={app} size={50} />
                              <Title size={Size.Small} ellipsize>
                                {app.display_name}
                              </Title>
                              <Text
                                size={Size.Medium}
                                color={TextColor.Secondary}
                                ellipsize
                                data-test-id="app-settings-details-description"
                              >
                                {t("byOwner", { appOwnerName: app.owner.display_name })}
                              </Text>
                            </MediaObject>
                            <DesktopOnly>
                              {() => (
                                <>
                                  <InfoLabel label={t("management:common.os")} value={app.os} />
                                  <InfoLabel label={t("management:common.platform")} value={app.humanReadablePlatform} />
                                  {app.release_type ? (
                                    <InfoLabel
                                      className={styles.release_type}
                                      label={t("management:common.appReleaseType")}
                                      value={app.release_type}
                                    />
                                  ) : null}
                                </>
                              )}
                            </DesktopOnly>
                            <MobileOnly>
                              {() => (
                                <Stretch>
                                  <Pill subtle={true} color={Color.Gray} className={styles.osPill}>
                                    {app.os}
                                  </Pill>
                                  {app.release_type ? (
                                    <Pill subtle={true} color={Color.Gray} className={styles.release_typePill}>
                                      {app.release_type}
                                    </Pill>
                                  ) : null}
                                </Stretch>
                              )}
                            </MobileOnly>
                          </Stretch>
                          {app.isAppFirstParty ? (
                            <Paragraph color={TextColor.Secondary} size={Size.Medium}>
                              <Text size={Size.Small} bold style={{ marginRight: "5px" }}>
                                {"App ID: "}
                              </Text>
                              <Text size={Size.Small}>{app.id}</Text>
                            </Paragraph>
                          ) : null}
                        </SettingsRouteCard>
                      </RowCol>

                      {userCan.seeCollaborators ? (
                        <RowCol>
                          <SettingsRouteCard
                            title={t("management:appCollaborators.title")}
                            subtitle={peopleSubtitle}
                            to={locationStore.getUrlWithCurrentApp("settings/collaborators")}
                            data-test-id="app-settings-app-collaborators-card"
                            editable={userCan.editDetails}
                          >
                            <div className={styles.avatars}>
                              {app.isOrgApp && !shouldShowCollaboratorsSkeletons ? (
                                <OrganizationIcon size={30} organization={app.owner} />
                              ) : null}
                              <AvatarList
                                size={30}
                                maxCount={20}
                                users={collaborators}
                                numOfTeams={teams.length}
                                skeleton={shouldShowCollaboratorsSkeletons}
                              />
                            </div>
                          </SettingsRouteCard>
                        </RowCol>
                      ) : null}

                      {userCan.seeServices ? (
                        <RowCol>
                          <SettingsRouteCard
                            title={t("management:appServices.title")}
                            subtitle={servicesSubtitle}
                            to={locationStore.getUrlWithCurrentApp("settings/services")}
                            data-test-id="app-settings-services-card"
                            editable={userCan.editServices}
                          />
                        </RowCol>
                      ) : null}

                      {userCan.seeWebhooks ? (
                        <RowCol>
                          <SettingsRouteCard
                            title={t("management:appWebhooks.title")}
                            subtitle={webhooksSubtitle}
                            to={locationStore.getUrlWithCurrentApp("settings/webhooks")}
                            data-test-id="app-settings-webhooks-card"
                            editable={userCan.editWebhooks}
                          />
                        </RowCol>
                      ) : null}

                      {userCan.seeExport ? (
                        <RowCol>
                          <SettingsRouteCard
                            data-test-id="app-settings-export-card"
                            title={t("management:appExport.title")}
                            to={locationStore.getUrlWithCurrentApp("settings/export")}
                            editable={userCan.editExportConfigurations}
                            subtitle={exportConfigurationsSubtitle}
                          >
                            {exportConfigurationsCounts ? (
                              <Grid rowSpacing={GridSpacing.Small}>
                                {exportConfigurationsCounts.map((count) => (
                                  <RowCol key={count.name} className={styles["exports-row-count"]}>
                                    {count.count} {t(`management:appExport.exportCounts.${count.name}`)}
                                  </RowCol>
                                ))}
                              </Grid>
                            ) : null}
                          </SettingsRouteCard>
                        </RowCol>
                      ) : null}

                      {userCan.changeNotifications ? (
                        <RowCol secondary={0}>
                          <SettingsRouteCard
                            title={t("management:notifications.title")}
                            subtitle={notificationsSubtitle}
                            to={locationStore.getUrlWithCurrentApp("settings/notifications")}
                            editable
                            data-test-id="app-settings-notifications-card"
                          />
                        </RowCol>
                      ) : null}

                      {userCan.seeAppApiTokens ? (
                        <RowCol secondary={0}>
                          <SettingsRouteCard
                            title={t("management:appApiTokens.title")}
                            subtitle={
                              apiTokenCount
                                ? t("management:appApiTokens.settings.hasTokens", { count: apiTokenCount })
                                : t("management:appApiTokens.settings.noTokens")
                            }
                            to={locationStore.getUrlWithCurrentApp("settings/apitokens")}
                            editable
                          />
                        </RowCol>
                      ) : null}
                    </Grid>
                  </RowCol>

                  <RowCol visible={PanelPosition.Secondary}>
                    <Grid rowSpacing={GridSpacing.Medium}>
                      <RowCol>
                        <Grid rowSpacing={GridSpacing.Medium}>
                          <RowCol center>
                            <AppIcon app={app} size={80} className={styles.appHeaderIcon} />
                          </RowCol>
                          <RowCol center>
                            <Text size={Size.Large} className={styles.appName} bold ellipsize>
                              {app.display_name}
                            </Text>
                          </RowCol>
                        </Grid>
                      </RowCol>
                      <RowCol>
                        <SecondaryNavigation items={secondaryNavItems} />
                      </RowCol>
                    </Grid>
                  </RowCol>
                </Grid>

                {userCan.transferApp ? <TransferAppDialog /> : null}
                {userCan.deleteApp ? (
                  <ConfirmationDialog
                    data-test-id="delete-app-confirmation-dialog"
                    className={styles["app-delete-dialog"]}
                    visible={deleteAppDialogIsVisible}
                    onRequestClose={cancelDeletingApp}
                    title={t("management:appSettings.deleteDialog.title", { app })}
                    description={t("management:appSettings.deleteDialog.description")}
                    confirmButton={
                      <PrimaryButton progress={isDeletingApp} color={Color.Red} data-test-id="confirm-button">
                        {t(`management:appSettings.deleteDialog.confirmButton.${isDeletingApp ? "pending" : "action"}`)}
                      </PrimaryButton>
                    }
                    onConfirm={deleteApp}
                    cancelButton={<SecondaryButton disabled={isDeletingApp}>{t("button.cancel")}</SecondaryButton>}
                    onCancel={cancelDeletingApp}
                  />
                ) : null}
              </div>
              <PanelOutlet>{this.props.children}</PanelOutlet>
            </Page>
          );
        }
      }
    )
  )
);
