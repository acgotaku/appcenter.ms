import * as React from "react";
import { observer } from "mobx-react";
import { RouteComponentProps } from "react-router";
import { BreadcrumbBuilder, Page, Panelify, PanelOutlet, PageHeader } from "@root/shared";
import { SubscriptionCard } from "@root/management/billing/subscription-card/subscription-card";
import { userStore } from "@root/stores";
import { WithTranslation, withTranslation } from "react-i18next";
import { CategoryName } from "@lib/common-interfaces";
import { ServiceTreeIDCard } from "@root/management/billing/service-tree-id-card/service-tree-id-card";
import { allAccountsBillingStore } from "@root/data/management";
import { find } from "lodash";

const styles = require("@root/management/billing/billing.scss");

type UserBillingProps = RouteComponentProps<{}, {}>;

export const UserBilling = Panelify(
  withTranslation(["management"])(
    observer(
      class UserBilling extends React.Component<UserBillingProps & WithTranslation, {}> {
        public componentDidMount() {
          const { fetchSubscriptions } = allAccountsBillingStore;
          const user = userStore.currentUser;
          fetchSubscriptions(false, user.name);
        }

        public render() {
          const { t } = this.props;
          const isSettingsPage = (window as any).initProps.isUserSettingsPage;
          const currentUser = userStore.currentUser;
          const billingSubscription = find(currentUser?.azureSubscriptions!, { isBilling: true });

          return (
            <Page
              data-test-id="user-billing-page"
              constrainedWidth
              supportsMobile
              header={
                <PageHeader
                  title={t("management:billingPlans.title")}
                  subtitle={t("management:billingPlans.subtitleForAccount", { name: userStore.currentUserFriendlyName })}
                  closeButton={false}
                />
              }
            >
              <>
                <BreadcrumbBuilder.Value
                  title={
                    this.props.location.pathname.startsWith("/settings/billing/")
                      ? userStore.currentUserFriendlyName
                      : t("management:billingPlans.title")
                  }
                />
                {currentUser?.user_category?.category_name === CategoryName.FirstParty ? (
                  <SubscriptionCard
                    editPath={
                      isSettingsPage ? "/settings/billing/personal/select-subscription" : "/settings/billing/select-subscription"
                    }
                    subscription={billingSubscription}
                    className={styles.card}
                    editable
                  />
                ) : null}
                <ServiceTreeIDCard
                  serviceTreeID={currentUser?.user_category?.service_tree_id ?? ""}
                  user_id={currentUser?.id}
                  visibleCategoryName
                />
                <PanelOutlet>{this.props.children}</PanelOutlet>
              </>
            </Page>
          );
        }
      }
    )
  )
);
