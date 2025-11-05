import * as React from "react";
import { observer } from "mobx-react";
import { RouteComponentProps } from "react-router";
import {
  Page,
  Panelify,
  PanelInjectedProps,
  PanelOutlet,
  Text,
  Size,
  TextColor,
  PrimaryButton,
  Menu,
  Trigger,
  ClickableIcon,
  IconName,
  Action,
  Table,
  Row,
  Column,
  SummaryCell,
  AppIcon,
  RowHeight,
  Cell,
  ButtonSize,
  ConfirmationDialog,
  Color,
  PageHeader,
  ButtonContainer,
  MessageBar,
} from "@root/shared";
import { IApp } from "@lib/common-interfaces";
import { locationStore } from "@root/stores/location-store";
import { SubscriptionType } from "@root/data/management/models/azure-subscription";
import { SubscriptionDetailsUIStore } from "./subscription-details-ui-store";
import { userStore } from "@root/stores/user-store";
import { withTranslation, WithTranslation } from "react-i18next";

const styles = require("./subscription-details.scss");
const classNames = require("classnames");

type SubscriptionDetailsProps = PanelInjectedProps & RouteComponentProps<any, any> & WithTranslation;

export const SubscriptionDetails = Panelify(
  withTranslation(["management"])(
    observer(
      class SubscriptionDetails extends React.Component<SubscriptionDetailsProps, {}> {
        private subscriptionDetailsUiStore!: SubscriptionDetailsUIStore;
        private columns: Column[] = [
          {
            title: this.props.t("management:subscriptionDetails.app"),
            width: 0.9,
          },
          {
            title: "",
            width: 0.1,
          },
        ];

        public UNSAFE_componentWillMount() {
          this.handlePropsChange(this.props, true);
        }

        public UNSAFE_componentWillReceiveProps(nextProps) {
          this.handlePropsChange(nextProps);
        }

        public handlePropsChange(props: SubscriptionDetailsProps, isMounting: boolean = false) {
          const { params } = props;
          const { org_name, subscriptionId } = params;
          const hasOrgName = !!org_name;
          if (isMounting || subscriptionId !== this.props.params["subscriptionId"] || org_name !== this.props.params["org_name"]) {
            const subscriptionType = hasOrgName ? SubscriptionType.Organization : SubscriptionType.User;
            const ownerName = hasOrgName ? org_name : userStore.currentUser.name;
            this.subscriptionDetailsUiStore = new SubscriptionDetailsUIStore(subscriptionType, ownerName, subscriptionId);
          }

          if (subscriptionId !== this.props.params["subscriptionId"]) {
            this.subscriptionDetailsUiStore.hideNotifications();
          }
        }

        public UNSAFE_componentWillUpdate(nextProps, nextState) {
          if (this.subscriptionDetailsUiStore.isFetchingSubscriptionFailed) {
            locationStore.goUp();
          }
        }

        public render() {
          const { params, t } = this.props;
          const { subscriptionId, org_name } = params;
          const {
            subscription,
            subscriptionApps: apps,
            isFetchingSubscriptions,
            appToRemove,
            isAppRemovalDialogVisible,
            cancelAppRemoval,
            deleteAppSubscription,
            deleteSubscription,
            startAppRemoval,
            removeSubscriptionDialogTitle,
            removeSubscriptionDialogDescription,
            hasNoApps,
            usedForBilling,
            isDeletingAppSubscription,
            isSubscriptionRemovalDialogVisible,
            startSubscriptionRemoval,
            cancelSubscriptionRemoval,
          } = this.subscriptionDetailsUiStore;
          const assignAppsRoute = org_name
            ? `/orgs/${org_name}/manage/azure/${subscriptionId}/assign`
            : `/settings/azure/${subscriptionId}/assign`;
          const hasSubscription = !isFetchingSubscriptions && subscription;

          return (
            <Page
              data-test-id="subscription-details-page"
              supportsMobile
              header={
                <PageHeader
                  title={hasSubscription ? subscription.name : `${t("common:state.loading")} ...`}
                  subtitle={hasSubscription ? subscription.id : `${t("common:state.loading")} ...`}
                >
                  <ButtonContainer>
                    <PrimaryButton disabled={isFetchingSubscriptions} to={assignAppsRoute}>
                      Assign to apps
                    </PrimaryButton>
                    <Menu>
                      <Trigger>
                        <ClickableIcon disabled={isFetchingSubscriptions} icon={IconName.More} />
                      </Trigger>
                      <Action
                        text={t("management:subscriptionDetails.viewInAzure")}
                        target="_blank"
                        href="https://portal.azure.com/#blade/Microsoft_Azure_Billing/SubscriptionsBlade"
                      />
                      <Action data-test-id="delete-subscription" text={t("common:button.delete")} onClick={startSubscriptionRemoval}>
                        <Text size={Size.Medium} color={TextColor.Danger}>
                          {t("common:button.delete")}
                        </Text>
                      </Action>
                    </Menu>
                  </ButtonContainer>
                </PageHeader>
              }
            >
              <>
                {this.renderNotification()}
                <div>
                  <Text
                    size={Size.Medium}
                    className={classNames({ [styles.hidden]: isFetchingSubscriptions || !hasNoApps })}
                    aria-hidden={apps.length === 0 ? false : true}
                    tabIndex={apps.length === 0 ? undefined : -1}
                  >
                    {t("management:subscriptionDetails.noApps")}
                  </Text>
                  {apps.length === 0 ? null : (
                    <Table
                      title={this.props.t("management:subscriptionDetails.assignedApps")}
                      className={classNames({ [styles.hidden]: hasNoApps })}
                      columns={this.columns}
                      eventualRowCount={apps.length || 4}
                      data={apps}
                      rowHeight={RowHeight.MultiLine}
                      headerCheckboxAriaLabel={this.props.t("management:subscriptionDetails.assignedApps")}
                      selectable={false}
                      aria-hidden={false}
                      renderRow={(app: IApp, props) => {
                        return (
                          <Row {...props} label={app.display_name}>
                            <SummaryCell
                              title={app.display_name}
                              subtitle={t("management:apps.forOs", { app })}
                              icon={<AppIcon app={app} size={30} />}
                            />
                            <Cell hideUntilRowHover className={styles["delete-wrapper"]}>
                              <ClickableIcon
                                key={app.id}
                                icon={IconName.Delete}
                                size={ButtonSize.XSmall}
                                onClick={startAppRemoval(app)}
                              />
                            </Cell>
                          </Row>
                        );
                      }}
                      renderPlaceholderRow={(props) => {
                        return (
                          <Row {...props}>
                            <SummaryCell skeleton title="title" subtitle="subtitle" icon={IconName.Default} />
                            <Cell skeleton />
                          </Row>
                        );
                      }}
                    />
                  )}
                  <ConfirmationDialog
                    visible={isAppRemovalDialogVisible}
                    title={t("management:subscriptionDetails.removeAppDialog.title", {
                      appName: appToRemove ? appToRemove.display_name : " ",
                    })}
                    description={t("management:subscriptionDetails.removeAppDialog.message", {
                      appName: appToRemove ? appToRemove.display_name : " ",
                    })}
                    confirmButton={
                      <PrimaryButton color={Color.Red} progress={isDeletingAppSubscription}>
                        {isDeletingAppSubscription ? t("management:subscriptionDetails.button.pending") : t("common:button.remove")}
                      </PrimaryButton>
                    }
                    onConfirm={deleteAppSubscription(appToRemove, subscriptionId)}
                    cancelButton={t("common:button.cancel")}
                    onCancel={cancelAppRemoval}
                  />
                  <ConfirmationDialog
                    data-test-id="remove-subscription-dialog"
                    visible={isSubscriptionRemovalDialogVisible}
                    title={removeSubscriptionDialogTitle}
                    description={removeSubscriptionDialogDescription}
                    danger={hasNoApps && !usedForBilling ? true : false}
                    confirmButton={hasNoApps && !usedForBilling ? t("common:button.remove") : t("common:button.ok")}
                    onConfirm={hasNoApps && !usedForBilling ? deleteSubscription(subscription) : cancelSubscriptionRemoval}
                    cancelButton={hasNoApps && !usedForBilling ? t("common:button.cancel") : (null as any)}
                    onCancel={cancelSubscriptionRemoval}
                  />
                </div>
              </>
              <PanelOutlet>{this.props.children}</PanelOutlet>
            </Page>
          );
        }

        private renderNotification(): JSX.Element | null {
          const { deleteAppSubscriptionNotification } = this.subscriptionDetailsUiStore;
          if (deleteAppSubscriptionNotification) {
            return <MessageBar type={deleteAppSubscriptionNotification.type}>{deleteAppSubscriptionNotification.message}</MessageBar>;
          } else {
            return null;
          }
        }
      }
    )
  )
);
