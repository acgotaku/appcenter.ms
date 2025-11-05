import * as React from "react";
import { observer } from "mobx-react";
import {
  Panelify,
  Page,
  PageHeader,
  PanelInjectedProps,
  ActionList,
  IconName,
  ActionListAdd,
  PanelOutlet,
  ConfirmationDialog,
  PageNotification,
  Menu,
  Trigger,
  ClickableIcon,
  Action,
  EmptyState,
} from "@root/shared";
import { Grid, RowCol, GridSpacing } from "@root/shared/grid";
import { Title, Size, ParagraphProps, Paragraph, Text, TextColor } from "@root/shared/typography";
import { logger } from "@root/lib/telemetry";
import { ServiceActionItem } from "./service-action-item";
import { ServiceConnectionDialogForm } from "./service-connection-dialog-form";
import { RouteComponentProps } from "react-router";
import { ServicesUIStore } from "./services-ui-store";
import { ServicesStore } from "./services-store";
import { withTranslation, WithTranslation } from "react-i18next";
import { t } from "@root/lib/i18n";

const styles = require("./services.scss");

export const Services = Panelify(
  withTranslation(["common", "management"])(
    observer(
      class Services extends React.Component<PanelInjectedProps & RouteComponentProps<any, any> & WithTranslation, {}> {
        private servicesUiStore = new ServicesUIStore();

        public UNSAFE_componentWillMount() {
          let accessTokenId = null;
          const query = this.props.location.query;
          if (query && query.access_token_id) {
            accessTokenId = query.access_token_id;
          }
          this.servicesUiStore.fetchBugTrackers(accessTokenId!);
        }

        public render() {
          return (
            <Page
              white
              data-test-id="services-page"
              header={<PageHeader title={t("management:appServices.title")} loading={this.servicesUiStore.isFetchingBugTracker} />}
            >
              {this.servicesUiStore.notification ? (
                <PageNotification type={this.servicesUiStore.notification.type} children={this.servicesUiStore.notification.message} />
              ) : null}
              {!this.servicesUiStore.userCanEdit && this.servicesUiStore.servicesCount === 0 ? (
                <EmptyState
                  hideImage
                  className={styles["empty-state"]}
                  title={t("management:appServices.emptyTitle")}
                  subtitle={this.renderSubtitle}
                  hideButton={true}
                />
              ) : (
                <Grid rowSpacing={GridSpacing.Medium}>
                  <RowCol>
                    <Title size={Size.Small}>{t("management:appServices.bugTrackerTitle")}</Title>
                  </RowCol>
                  <RowCol>
                    {this.renderBugTracker()}
                    <ConfirmationDialog
                      data-test-id="bugtracker-disconnect-dialog"
                      danger
                      visible={this.servicesUiStore.disconnectBugTrackerWarningIsVisible}
                      onCancel={() => this.servicesUiStore.cancelDisconnectBugTracker()}
                      onConfirm={() => this.servicesUiStore.finishDisconnectBugTracker()}
                      title={t("management:appServices.bugTracker.disconnectDialog.title")}
                      description={t("management:appServices.bugTracker.disconnectDialog.message")}
                      cancelButton={t("button.cancel")}
                      confirmButton={t("management:appServices.disconnect")}
                    />
                  </RowCol>
                </Grid>
              )}
              <PanelOutlet>{this.props.children}</PanelOutlet>
            </Page>
          );
        }

        private renderSubtitle = (subtitleProps: ParagraphProps) => (
          <Paragraph {...subtitleProps}>
            <div>{t("management:appServices.emptyUnauthorizedSubtitle")}</div>
            <div>{t("management:appServices.emptyDescriptionSubtitle")}</div>
          </Paragraph>
        );

        public renderBugTracker() {
          const store = this.servicesUiStore;
          const connected = store.connectedBugTracker;
          const accounts = store.connectedBugTackerAccounts;
          const services = ServicesStore.bugTrackerServices;
          let items: any[] = [];
          let showAddItem = false;

          if (this.servicesUiStore.isFetchingBugTracker) {
            items = Array.from({ length: 3 }, (_, i) => (
              <ServiceActionItem skeleton icon={IconName.GitHub} key={i} value="" title="" subTitle="" />
            ));
          } else if (connected) {
            const { showUnauthorizedAction } = this.servicesUiStore;
            items = [
              <ServiceActionItem
                key={connected.account}
                icon={store.getIcon(connected.type!)}
                title={connected.account}
                subTitle={connected.repo}
                accessoryItem={
                  <div>
                    <Text
                      className={styles.state}
                      size={Size.Small}
                      color={showUnauthorizedAction ? TextColor.Error : TextColor.Success}
                      data-test-id={"bugtracker-connected-text"}
                    >
                      {t(`management:appServices.${showUnauthorizedAction ? "failedToConnect" : "connected"}`)}
                    </Text>
                    <Menu data-test-id="connected-bugtracker-more-menu">
                      <Trigger>
                        <ClickableIcon icon={IconName.More} />
                      </Trigger>
                      <Action
                        onClick={(event) => {
                          event.preventDefault();
                          store.configureBugTracker();
                        }}
                        text={store.userCanEdit ? t("management:appServices.configure") : t("management:appServices.details")}
                      />
                      {store.userCanEdit && showUnauthorizedAction ? (
                        <Action
                          text={t("management:appServices.reauthenticate")}
                          onClick={this.servicesUiStore.reauthenticateConnectedBugtracker}
                        />
                      ) : null}
                      {store.userCanEdit ? (
                        <Action
                          danger
                          onClick={(event) => {
                            event.preventDefault();
                            store.disconnectBugTracker();
                          }}
                          text={t("management:appServices.disconnect")}
                        />
                      ) : null}
                    </Menu>
                  </div>
                }
                noninteractive
              />,
            ];
          } else if (accounts && accounts.length > 0) {
            showAddItem = true;
            items = accounts.map((account) => (
              <ServiceActionItem
                key={account.accessTokenId}
                icon={store.getIcon(account.externalProviderName!)}
                title={store.getBugtrackerTitle(account.externalProviderName!)}
                subTitle={account.externalAccountName || account.externalUserEmail}
                onClick={() => store.pushWithAccountLink(account)}
              />
            ));
          } else {
            items = [
              <div>
                <ActionList>
                  {services.map((service) =>
                    service.isOAuth ? (
                      <ServiceActionItem
                        key={service.type}
                        icon={service.icon}
                        title={service.name}
                        href={service.url}
                        onClick={() => this.trackAttemptToConnectBugtracker(service.name)}
                      />
                    ) : (
                      <ServiceActionItem
                        key={service.type}
                        icon={service.icon}
                        title={service.name}
                        onClick={() => this.servicesUiStore.serviceConnectionDialogFormUIStore.setServiceAndShowForm(service)}
                      />
                    )
                  )}
                </ActionList>
              </div>,
            ];
          }
          return (
            <ActionList rowSpacing={GridSpacing.XLarge}>
              <ServiceConnectionDialogForm store={this.servicesUiStore.serviceConnectionDialogFormUIStore} />
              {items}
              {showAddItem ? (
                <ActionListAdd
                  onClick={this.servicesUiStore.addAccountOrService}
                  text={t("management:appServices.addAccountOrService")}
                  largeIcon
                  data-test-id="add-account-or-service-button"
                />
              ) : (
                <div />
              )}
            </ActionList>
          );
        }

        private trackAttemptToConnectBugtracker(serviceName: string) {
          logger.info("app-services-connecting-bugtracker", { service: serviceName });
          event!.stopPropagation();
        }
      }
    )
  )
);
