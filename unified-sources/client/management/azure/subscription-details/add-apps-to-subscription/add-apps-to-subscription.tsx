import * as React from "react";
import { observer } from "mobx-react";
import { RouteComponentProps } from "react-router";
import {
  Page,
  Modalify,
  PanelInjectedProps,
  PanelOutlet,
  SingleSelectActionList,
  SingleSelectActionItem,
  MediaObject,
  Text,
  TextColor,
  AppIcon,
  Size,
  GridCol as Col,
  Space,
  SearchBar,
  PrimaryButton,
  PageHeader,
  MessageBar,
  FooterArea,
} from "@root/shared";
import { AddAppsToSubscriptionUIStore } from "./add-apps-to-subscription-ui-store";
import { SubscriptionType } from "@root/data/management/models/azure-subscription";
import { userStore } from "@root/stores/user-store";
import { withTranslation, WithTranslation } from "react-i18next";

type AddAppsToSubscriptionProps = PanelInjectedProps & RouteComponentProps<any, any> & WithTranslation;

export const AddAppsToSubscription = Modalify(
  withTranslation(["management"])(
    observer(
      class AddAppsToSubscription extends React.Component<AddAppsToSubscriptionProps, {}> {
        private addAppsToSubscriptionUIStore!: AddAppsToSubscriptionUIStore;

        public UNSAFE_componentWillMount() {
          const { org_name } = this.props.params;
          const subscriptionType = org_name ? SubscriptionType.Organization : SubscriptionType.User;
          const ownerName = org_name || userStore.currentUser.name;
          this.addAppsToSubscriptionUIStore = new AddAppsToSubscriptionUIStore(subscriptionType, ownerName);
        }

        public render() {
          const { t } = this.props;
          const { subscriptionId } = this.props.params;
          const {
            apps,
            onSelectApp,
            selectedAppName,
            isAddingApp,
            addAppNotification,
            onSearchTextUpdate,
          } = this.addAppsToSubscriptionUIStore;
          return (
            <Page
              data-test-id="subscription-assign-page"
              supportsMobile
              header={<PageHeader title={t("management:assignAppsToSubscription.title")} />}
              footer={
                <FooterArea alignRight>
                  <PrimaryButton
                    progress={isAddingApp}
                    disabled={!selectedAppName}
                    onClick={this.handleAddApp(selectedAppName, subscriptionId)}
                  >
                    {isAddingApp ? t("management:assignAppsToSubscription.button.pending") : t("common:button.done")}
                  </PrimaryButton>
                </FooterArea>
              }
            >
              <>
                {addAppNotification ? <MessageBar type={addAppNotification.type}>{addAppNotification.message}</MessageBar> : null}
                <SearchBar data-test-id="search-input" onChange={onSearchTextUpdate} resultsCount={apps.length} />
                <SingleSelectActionList name="select-app" value={selectedAppName} onChange={onSelectApp}>
                  {apps.map((app) => {
                    return (
                      <SingleSelectActionItem value={app.name} key={app.id}>
                        <Col>
                          <MediaObject hSpace={Space.XSmall}>
                            <AppIcon size={30} app={app} />
                            <Text size={Size.Medium} ellipsize>
                              {app.display_name}
                            </Text>
                            <Text size={Size.Small} color={TextColor.Secondary}>
                              {t("management:apps.forOs", { app })}
                            </Text>
                          </MediaObject>
                        </Col>
                      </SingleSelectActionItem>
                    );
                  })}
                </SingleSelectActionList>
              </>
              <PanelOutlet>{this.props.children}</PanelOutlet>
            </Page>
          );
        }

        private handleAddApp = (appName: string, subscriptionId: string) => (event: React.MouseEvent<HTMLButtonElement>): void => {
          const { addApp } = this.addAppsToSubscriptionUIStore;
          addApp(appName, subscriptionId);
        };
      }
    )
  )
);
