import * as React from "react";
import { observer } from "mobx-react";
import { RouteComponentProps } from "react-router";
import { BreadcrumbBuilder, Page, Panelify, PanelOutlet, PageHeader, LinkButton } from "@root/shared";
import { SubscriptionCard } from "@root/management/billing/subscription-card/subscription-card";
import { organizationStore, locationStore } from "@root/stores";
import { WithTranslation, withTranslation } from "react-i18next";
import { ServiceTreeIDCard } from "@root/management/billing/service-tree-id-card/service-tree-id-card";
import { allAccountsBillingStore } from "@root/data/management";
import { find } from "lodash";

const styles = require("@root/management/billing/billing.scss");

export interface IOrgBillingProps {
  org_name: string;
}

type OrgBillingProps = RouteComponentProps<IOrgBillingProps, {}>;

export const OrgBilling = Panelify(
  withTranslation(["management"])(
    observer(
      class OrgBilling extends React.Component<OrgBillingProps & WithTranslation, {}> {
        public componentDidMount() {
          const { fetchSubscriptions } = allAccountsBillingStore;
          const organization = organizationStore.find(this.props.params["org_name"]);
          if (organization) {
            fetchSubscriptions(true, organization.name);
          }
        }

        public render() {
          const { params, children, t } = this.props;
          const { org_name: orgName } = params;
          const organization = organizationStore.find(orgName);
          const organizationName = organization?.display_name || organization?.name || "";
          const isSettingsPage = (window as any).initProps.isUserSettingsPage;
          const billingSubscription = find(organization?.azureSubscriptions!, { isBilling: true });

          return (
            <Page
              constrainedWidth
              supportsMobile
              header={
                <PageHeader
                  title={t("management:billingPlans.title")}
                  subtitle={t("management:billingPlans.subtitleForOrganization", { name: organizationName })}
                  closeButton={false}
                >
                  {!isSettingsPage && (
                    <LinkButton onClick={() => locationStore.pushToSettings("/billing")}>
                      {t("management:billingPlans.viewAll")}
                    </LinkButton>
                  )}
                </PageHeader>
              }
            >
              <>
                <BreadcrumbBuilder.Value title={isSettingsPage ? organizationName : t("management:billingPlans.title")} />
                {organization?.isOrgFirstParty ? (
                  <SubscriptionCard
                    editPath={
                      isSettingsPage
                        ? `/settings/billing/orgs/${orgName}/select-subscription`
                        : `/orgs/${orgName}/manage/billing/select-subscription`
                    }
                    subscription={billingSubscription}
                    className={styles.card}
                    editable
                  />
                ) : null}
                <ServiceTreeIDCard
                  serviceTreeID={organization?.organization_category?.service_tree_id ?? ""}
                  org_name={orgName}
                  visibleCategoryName
                />
                <PanelOutlet>{children}</PanelOutlet>
              </>
            </Page>
          );
        }
      }
    )
  )
);
