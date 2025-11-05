import * as React from "react";
import { RouteComponentProps } from "react-router";
import { observer } from "mobx-react";
import {
  Panelify,
  PanelInjectedProps,
  PanelOutlet,
  Page,
  PageHeader,
  SecondaryNavigation,
  PanelPosition,
  Stretch,
  MediaObject,
  Space,
  Gravatar,
  UserInitialsAvatar,
} from "@root/shared";
import { Grid, RowCol, GridSpacing } from "@root/shared/grid";
import { Text, TextColor, Size, Paragraph } from "@root/shared/typography";
import { UserAvatarInfo } from "./user-avatar-info/user-avatar-info";
import { organizationStore, userStore } from "@root/stores";
import { withTranslation, WithTranslation } from "react-i18next";
import { SettingsUIStore } from "./settings-ui-store";
import { SettingsRouteCard } from "../shared/settings-route-card";
import { getOsFromUserAgent } from "@root/lib/utils/user-agent";
import { OS } from "@root/install-beacon/models/os";
import { allAccountsBillingStore } from "@root/data/management";
import { PreviewBillingCard } from "../billing/preview-billing-card/preview-billing-card";

export const Settings = Panelify(
  withTranslation(["common", "management"])(
    observer(
      class Settings extends React.Component<RouteComponentProps<any, any> & PanelInjectedProps & WithTranslation, {}> {
        private uiStore: SettingsUIStore;

        constructor(props) {
          super(props);
          this.uiStore = new SettingsUIStore();
        }

        componentDidUpdate(prevProps: PanelInjectedProps) {
          // Avoid refetching on every billing navigation
          if (prevProps !== this.props && this.props.location.pathname.indexOf("/billing") === -1) {
            const { fetchSubscriptions } = allAccountsBillingStore;
            const { currentUser: user } = userStore;
            fetchSubscriptions(false, user.name);
          }
        }

        private get orgSummary(): string | undefined {
          const { t } = this.props;
          const { organizationsCount, orgInvitationsCount } = this.uiStore;
          if (organizationsCount && orgInvitationsCount) {
            return t("management:userOrgSettings.summary.both", {
              orgs: t("management:userOrgSettings.summary.organizations", { count: organizationsCount }),
              invitations: t("management:userOrgSettings.summary.invitations", { count: orgInvitationsCount }),
            });
          } else if (organizationsCount) {
            return t("management:userOrgSettings.summary.organizations", { count: organizationsCount });
          } else if (orgInvitationsCount) {
            return t("management:userOrgSettings.summary.invitations", { count: orgInvitationsCount });
          }

          return undefined;
        }

        render() {
          const { children, t } = this.props;
          const {
            secondaryNavItems,
            isLoading,
            apiTokenCount,
            devicesCount,
            notificationsEnabled,
            subscriptionsCount,
            appleAccountsCount,
            gitlabAccountsCount,
            certificatesCount,
            isAnyAccountOrCertificate,
            theme,
          } = this.uiStore;
          const { currentUser: user } = userStore;
          const billingSubscription = user.azureSubscriptions.find((sub) => sub.isBilling);

          return (
            <Page
              data-test-id="user-settings-navigation"
              constrainedWidth
              supportsMobile
              header={<PageHeader title={t("management:userSettings.title")} loading={isLoading} />}
            >
              <Grid>
                <RowCol visible={PanelPosition.Primary}>
                  <Grid rowSpacing={GridSpacing.Page}>
                    <RowCol>
                      <SettingsRouteCard title={t("management:userProfileSettings.title")} to={"/settings/profile"} editable>
                        <Stretch>
                          <MediaObject hSpace={Space.Medium}>
                            <Gravatar
                              email={user.email}
                              size={50}
                              fallback={<UserInitialsAvatar initialsName={user.display_name} size={50} />}
                            />
                            <Text size={Size.Large} ellipsize>
                              {user.display_name}
                            </Text>
                            <Text size={Size.Medium} color={TextColor.Secondary} ellipsize>
                              {user.name}
                            </Text>
                          </MediaObject>
                        </Stretch>
                      </SettingsRouteCard>
                    </RowCol>
                    <RowCol>
                      <SettingsRouteCard
                        title={t("management:userInterface.title")}
                        subtitle={t(`management:userInterfaceSettings.themes.${theme}`)}
                        to="/settings/user-interface"
                        editable
                      />
                    </RowCol>
                    {user.isFirstPartyUser || organizationStore.isCurrentUserAnAdminOfFirstPartyOrg() ? (
                      <RowCol>
                        <SettingsRouteCard title={t("management:billingPlans.title")} subtitle={""} to="/settings/billing" editable>
                          {user.isFirstPartyUser ? (
                            <PreviewBillingCard
                              subscription={billingSubscription}
                              serviceTreeID={user.user_category?.service_tree_id || ""}
                            />
                          ) : null}
                        </SettingsRouteCard>
                      </RowCol>
                    ) : null}
                    <RowCol>
                      <SettingsRouteCard
                        title={t("management:userOrgSettings.title")}
                        subtitle={isLoading ? (null as any) : this.orgSummary}
                        to="/settings/organizations"
                        editable
                      />
                    </RowCol>
                    {!(OS.isIos(getOsFromUserAgent().name!) || OS.isAndroid(getOsFromUserAgent().name!)) ? (
                      isAnyAccountOrCertificate || user.isUserWhitelisted ? (
                        <RowCol>
                          <SettingsRouteCard title={t("management:accounts.title")} to="/settings/accounts" editable>
                            {!isLoading ? (
                              <>
                                <Paragraph size={Size.Medium} color={TextColor.Secondary}>
                                  {appleAccountsCount
                                    ? t("management:accounts.settings.accounts.apple.some", { count: appleAccountsCount })
                                    : t("management:accounts.settings.accounts.apple.none")}
                                </Paragraph>
                                <Paragraph size={Size.Medium} color={TextColor.Secondary}>
                                  {certificatesCount
                                    ? t("management:accounts.settings.certificates.apple.some", { count: certificatesCount })
                                    : t("management:accounts.settings.certificates.apple.none")}
                                </Paragraph>
                                {gitlabAccountsCount ? (
                                  <Paragraph size={Size.Medium} color={TextColor.Secondary}>
                                    {t("management:accounts.settings.accounts.gitlab.some", { count: gitlabAccountsCount })}
                                  </Paragraph>
                                ) : null}
                              </>
                            ) : (
                              <>
                                <Paragraph size={Size.Medium}>&nbsp;</Paragraph>
                                <Paragraph size={Size.Medium}>&nbsp;</Paragraph>
                              </>
                            )}
                          </SettingsRouteCard>
                        </RowCol>
                      ) : null
                    ) : null}
                    {user.isUserWhitelisted ? (
                      <RowCol>
                        <SettingsRouteCard
                          title={t("management:devices.title")}
                          subtitle={
                            isLoading
                              ? undefined
                              : devicesCount
                              ? t("management:devices.settings.hasDevices", { count: devicesCount })
                              : t("management:devices.settings.noDevices")
                          }
                          to="/settings/devices"
                          editable
                        />
                      </RowCol>
                    ) : null}
                    <RowCol>
                      <SettingsRouteCard
                        title={t("management:userApiTokens.title")}
                        subtitle={
                          isLoading
                            ? undefined
                            : apiTokenCount
                            ? t("management:userApiTokens.settings.hasTokens", { count: apiTokenCount })
                            : t("management:userApiTokens.settings.noTokens")
                        }
                        to="/settings/apitokens"
                        editable
                      />
                    </RowCol>
                    <RowCol>
                      <SettingsRouteCard
                        title={t("management:notifications.title")}
                        subtitle={
                          isLoading ? undefined : notificationsEnabled ? t("common:state.enabled") : t("common:state.disabled")
                        }
                        to="/settings/notifications"
                        editable
                      />
                    </RowCol>
                    <RowCol>
                      <SettingsRouteCard
                        title={t("management:azureSettings.title")}
                        subtitle={
                          isLoading
                            ? undefined
                            : subscriptionsCount
                            ? t("management:azureSettings.settings.hasSubscriptions", { count: subscriptionsCount })
                            : t("management:azureSettings.settings.noSubscriptions")
                        }
                        to="/settings/azure"
                        editable
                      />
                    </RowCol>
                  </Grid>
                </RowCol>
                <RowCol visible={PanelPosition.Secondary}>
                  <Grid rowSpacing={GridSpacing.Medium}>
                    <RowCol>
                      <UserAvatarInfo user={userStore.currentUser} />
                    </RowCol>
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
