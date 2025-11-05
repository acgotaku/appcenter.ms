import * as React from "react";
import { observer } from "mobx-react";
import { RouteComponentProps } from "react-router";
import { WithTranslation, withTranslation } from "react-i18next";
import {
  BreadcrumbBuilder,
  Page,
  Panelify,
  PageHeader,
  PanelPosition,
  Title,
  Size,
  Space,
  SecondaryNavigation,
  PanelOutlet,
  Tooltip,
  Trigger,
  Icon,
  IconName,
  MediaObject,
  Text,
  TextColor,
  Autofocus,
} from "@root/shared";
import { Grid, RowCol, GridSpacing } from "@root/shared/grid";
import { SettingsRouteCard } from "@root/management/shared/settings-route-card";
import { organizationStore, userStore } from "@root/stores";
import * as styles from "./all-accounts-billing.scss";
import { allAccountsBillingStore } from "@root/data/management";
import { find } from "lodash";
import { PreviewBillingCard } from "@root/management/billing/preview-billing-card/preview-billing-card";

type AllAccountsBillingProps = RouteComponentProps<{}, {}>;

export const AllAccountsBilling = Panelify(
  withTranslation(["management"])(
    observer(
      class AllAccountsBilling extends React.Component<AllAccountsBillingProps & WithTranslation, {}> {
        private organizations = organizationStore.firstPartyOrganizations.filter((org) => organizationStore.isCurrentUserAnAdmin(org));
        componentDidMount(): void {
          const { fetchSubscriptions } = allAccountsBillingStore;
          const user = userStore.currentUser;
          if (user.isFirstPartyUser) {
            fetchSubscriptions(false, user.name);
          }
          this.organizations.forEach((org) => {
            fetchSubscriptions(true, org.name);
          });
        }

        public render() {
          const user = userStore.currentUser;
          const billingSubscription = user.azureSubscriptions.find((sub) => sub.isBilling);
          const secondaryNavItems = (user.isFirstPartyUser
            ? [
                {
                  route: "/settings/billing/personal",
                  title: userStore.currentUserFriendlyName,
                },
              ]
            : []
          ).concat(
            this.organizations.map((org) => ({
              route: `/settings/billing/orgs/${org.name}`,
              title: org.display_name || org.name,
            }))
          );
          const { children, t } = this.props;

          return (
            <Page
              data-test-id="all-accounts-billing-page"
              constrainedWidth
              supportsMobile
              header={
                <PageHeader title={t("management:billingPlans.title")} loading={false}>
                  <Tooltip
                    tooltipDescription={`${t("management:billingPlans.whatIsListedTooltip.button")} tooltip`}
                    title={t("management:billingPlans.whatIsListedTooltip.title")}
                    overlayClassName={styles.tooltip}
                  >
                    <Trigger>
                      <MediaObject hSpace={Space.XSmall}>
                        <Icon focusable="false" icon={IconName.Info} color={TextColor.Secondary} />
                        <Text size={Size.Medium} color={TextColor.Secondary}>
                          {t("management:billingPlans.whatIsListedTooltip.button")}
                        </Text>
                      </MediaObject>
                    </Trigger>
                    {t("management:billingPlans.whatIsListedTooltip.text")}
                  </Tooltip>
                </PageHeader>
              }
            >
              <BreadcrumbBuilder.Value title={t("management:billingPlans.title")} />
              <Grid>
                <RowCol visible={PanelPosition.Primary}>
                  <Grid rowSpacing={GridSpacing.Large}>
                    {user.isFirstPartyUser ? (
                      <RowCol key={`personal-${user.id}`} aria-label={user.display_name || user.name}>
                        <Title bold={false} size={Size.Medium} spaceBelow={Space.XSmall}>
                          {user.display_name || user.name}
                        </Title>
                        <SettingsRouteCard title={"Billing"} to={`/settings/billing/personal`} editable>
                          <PreviewBillingCard
                            subscription={billingSubscription}
                            serviceTreeID={user.user_category?.service_tree_id || ""}
                          />
                        </SettingsRouteCard>
                      </RowCol>
                    ) : null}
                    {this.organizations &&
                      this.organizations.map((org, index) => {
                        const subscription = find(org.azureSubscriptions!, { isBilling: true });
                        return (
                          <RowCol key={`organization-${org.id}`} aria-label={org.display_name || org.name}>
                            <Title bold={false} size={Size.Medium} spaceBelow={Space.XSmall}>
                              {org.display_name || org.name}
                            </Title>
                            <Autofocus focus={index === 0}>
                              <SettingsRouteCard title={"Billing"} to={`/settings/billing/orgs/${org.name}`} editable>
                                <PreviewBillingCard
                                  subscription={subscription}
                                  serviceTreeID={org.organization_category?.service_tree_id || ""}
                                />
                              </SettingsRouteCard>
                            </Autofocus>
                          </RowCol>
                        );
                      })}
                  </Grid>
                </RowCol>
                <RowCol visible={PanelPosition.Secondary}>
                  <Grid rowSpacing={GridSpacing.Medium}>
                    <RowCol>
                      <SecondaryNavigation items={secondaryNavItems} />
                    </RowCol>
                  </Grid>
                </RowCol>
              </Grid>
              <PanelOutlet>{children}</PanelOutlet>
            </Page>
          );
        }
      }
    )
  )
);
