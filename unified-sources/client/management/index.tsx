import { Root } from "./root/root";
import { Apps } from "./apps/apps";
import { AppSettings } from "./app-settings";
import { AppDetails } from "./app-settings/app-details";
import { Collaborators as AppCollaborators } from "./app-settings/collaborators";
import { Notifications } from "./app-settings/notifications";
import { Services } from "./app-settings/services/services";
import { BugTrackerWizard } from "./app-settings/services/bugtracker/bugtracker-wizard";
import { ConfigureBugTracker } from "./app-settings/services/bugtracker/configure-bugtracker";
import { Webhooks } from "./app-settings/webhooks/webhooks";
import { WebhookWizard } from "./app-settings/webhooks/webhook-wizard";
import { ExportConfigurations } from "./app-settings/export/export-configurations";
import { ExportConfigurationWizard } from "./app-settings/export/export-configuration-wizard";
import { NewApp } from "./apps/new-app/new-app";
import { MigrateApp } from "./apps/migrate-app/migrate-app";
import { Settings } from "./settings/settings";
import { Overview } from "./overview/overview";
import { UserProfile } from "./settings/profile/user-profile";
import { UserInterfaceSettings } from "./settings/user-interface/user-interface-settings";
import { Organizations } from "./settings/organizations/organizations";
import { Accounts } from "./settings/accounts/accounts";
import { ConnectGitLabAccountModal } from "./settings/accounts/connect-gitlab-account-modal";
import { Devices } from "./settings/devices/devices";
import { DeviceDetails } from "./settings/devices/device-details";
import { UserNotificationSettings } from "./settings/notification-settings/user-notification-settings";
import { appStore, locationStore, organizationStore, userStore } from "../stores";
import { UserApiTokens } from "./settings/user-api-tokens/user-api-tokens";
import { AppApiTokens } from "./app-settings/app-api-tokens/app-api-tokens";
import { NewApiToken } from "./shared/api-tokens/new-api-token";
import { Orgs } from "./orgs/orgs";
import { NewOrg } from "./orgs/new-org/new-org";
import { Apps as OrgApps } from "./orgs/apps/apps";
import { People } from "./orgs/people/people";
import { Collaborators as OrgCollaborators } from "./orgs/people/collaborators/collaborators";
import { CollaboratorDetails } from "./orgs/people/collaborator-details/collaborator-details";
import { Teams } from "./orgs/people/teams/teams";
import { DistributionGroups } from "./orgs/people/distribution-groups/distribution-groups";
import { DistributionGroupDetails } from "./orgs/people/distribution-group-details/distribution-group-details";
import { NewDistributionGroup } from "./orgs/people/distribution-groups/new-distribution-group/new-distribution-group";
import { DistributionGroupSettings } from "./orgs/people/distribution-group-details/distribution-group-settings/distribution-group-settings";
import { NewTeam } from "./orgs/people/teams/new-team/new-team";
import { TeamDetails } from "./orgs/people/team-details/team-details";
import { TeamSettings } from "./orgs/people/team-details/team-settings/team-settings";
import { Manage as ManageOrg } from "./orgs/manage/manage";
import { OrgBilling } from "./orgs/manage/billing/org-billing";
import { ComplianceAndSecurity } from "./orgs/manage/compliance-security/compliance-security";
import { IntuneMAMConfigModal } from "./compliance-security/intune-mam-config-modal/intune-mam-config-modal";
import { AllAccountsBilling } from "./settings/billing/all-accounts-billing";
import { UserBilling } from "./settings/billing/user-billing";
import { SubscriptionSelectionModal } from "./billing/subscription-selection-modal/subscription-selection-modal";
import { Settings as OrgSettings } from "./orgs/manage/settings/settings";
import { Azure } from "./azure/azure";
import { ConnectTenant } from "./azure/connect-tenant";
import { SubscriptionDetails } from "./azure/subscription-details/subscription-details";
import { AddAppsToSubscription } from "./azure/subscription-details/add-apps-to-subscription/add-apps-to-subscription";
import { notFoundStore } from "@root/stores";
import { PlainRoute } from "@lib/common-interfaces";

import * as ReactRouter from "react-router";
import { CloseAccountWizard } from "@root/management/settings/profile/close-account/close-account-orgs";
import { RegisterDeviceStore } from "@root/stores/register-device-store";
import { ChangePasswordModal } from "./settings/profile/change-password/change-password-modal";
import { accountsUiStore } from "./settings/accounts/accounts-ui-store";

/**
 * Note: The root paths below do not have a "path" property. This is intentional.
 * The "Panels" and "Modals" infrastructure cannot do much with indexRoutes because
 * of how indexRoutes are handled internally by react-router.
 *
 * So, in order so that all our Settings components share a common parent component,
 * this route object is without a path. This lets us provide a nice shell to all our
 * Settings components and this DOES NOT add an extra path to the route.
 */

// Routes for Azure
const azureChildRoutes: PlainRoute = {
  path: "azure",
  component: Azure,
  childRoutes: [
    {
      path: ":subscriptionId",
      component: SubscriptionDetails,
      childRoutes: [
        {
          path: "assign",
          component: AddAppsToSubscription,
        },
      ],
    },
  ],
};

/**
 * The route object for the `apps` path.
 */
const appsRoute: PlainRoute = {
  component: Root,
  childRoutes: [
    {
      path: "apps",
      component: Apps,
      childRoutes: [
        {
          path: "create",
          component: NewApp,
        },
        {
          path: ":owner_name/:app_name/migrate",
          component: MigrateApp,
        },
        {
          path: "/orgs/create", // Absolute path so that we can create orgs and apps on the same page.
          component: NewOrg,
        },
      ],
    },
    {
      path: "orgs",
      component: Orgs,
      indexRoute: { onEnter: (nextState, replace: any) => replace(`/apps`) },
      childRoutes: [
        {
          path: ":org_name",
          indexRoute: { onEnter: (nextState, replace: any) => replace(`/orgs/${nextState.params["org_name"]}/applications`) },
          childRoutes: [
            {
              path: "applications", // The Apps that belong to an Organization.
              component: OrgApps,
              childRoutes: [
                {
                  path: "create",
                  component: NewApp,
                },
              ],
            },
            {
              path: "people",
              component: People,
              indexRoute: {
                onEnter: (nextState, replace: any) => replace(`/orgs/${nextState.params["org_name"]}/people/collaborators`),
              },
              childRoutes: [
                {
                  path: "collaborators",
                  component: OrgCollaborators,
                  childRoutes: [
                    {
                      path: ":username",
                      component: CollaboratorDetails,
                    },
                  ],
                },
                {
                  path: "teams",
                  component: Teams,
                  childRoutes: [
                    {
                      path: "create",
                      component: NewTeam,
                    },
                    {
                      path: ":team_name",
                      onEnter: (nextState: ReactRouter.RouterState, replace: any, cb?: Function) => {
                        const { org_name, team_name } = nextState.params;
                        replace(`/orgs/${org_name}/people/teams/${team_name}/members`);
                        cb!();
                      },
                    },
                    {
                      path: ":team_name/:tab",
                      component: TeamDetails,
                      childRoutes: [
                        {
                          path: "manage",
                          component: TeamSettings,
                        },
                      ],
                    },
                  ],
                },
                {
                  path: "distribution-groups",
                  component: DistributionGroups,
                  onEnter: (nextState, replace) => {
                    const org = organizationStore.find(nextState.params["org_name"]);
                    if (!org || !org.organization_category) {
                      replace(`/orgs/${nextState.params["org_name"]}/people/collaborators`);
                    }
                  },
                  childRoutes: [
                    {
                      path: "create",
                      component: NewDistributionGroup,
                    },
                    {
                      path: ":group_name",
                      onEnter: (nextState: ReactRouter.RouterState, replace: any, cb?: Function) => {
                        const { org_name, group_name } = nextState.params;
                        replace(`/orgs/${org_name}/people/distribution-groups/${group_name}/testers`);
                        cb!();
                      },
                    },
                    {
                      path: ":group_name/:tab",
                      component: DistributionGroupDetails,
                      childRoutes: [
                        {
                          path: "manage",
                          component: DistributionGroupSettings,
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              path: "manage",
              component: ManageOrg,
              indexRoute: { onEnter: (nextState, replace: any) => replace(`/orgs/${nextState.params["org_name"]}/manage/settings`) },
              childRoutes: [
                {
                  component: ComplianceAndSecurity,
                  path: "compliance",
                  indexRoute: {
                    onEnter: (nextState, replace: any) => {
                      replace(`/orgs/${nextState.params["org_name"]}/manage/settings`);
                    },
                  },
                  childRoutes: [
                    {
                      path: "config",
                      component: IntuneMAMConfigModal,
                    },
                    {
                      path: "config/:id",
                      component: IntuneMAMConfigModal,
                    },
                  ],
                },
                {
                  component: OrgSettings,
                  path: "settings",
                },
                {
                  path: "billing",
                  component: OrgBilling,
                  onEnter: (_, replace) => {
                    const org_name = _.params.org_name;
                    const org = organizationStore.find(org_name);
                    if (org && !org.isOrgFirstParty) {
                      replace(`/orgs/${org_name}/manage/settings`);
                    }
                    (window as any).initProps.isUserSettingsPage = false;
                  },
                  childRoutes: [
                    {
                      path: "select-subscription",
                      component: SubscriptionSelectionModal,
                      onEnter: (_, replace) => {
                        const org_name = _.params.org_name;
                        const org = organizationStore.find(org_name);
                        if (org && !org.isOrgFirstParty) {
                          replace(`/orgs/${org_name}/manage/settings`);
                        }
                      },
                    },
                  ],
                },
                {
                  ...azureChildRoutes,
                  childRoutes: [
                    {
                      path: "connect-tenant",
                      component: ConnectTenant,
                      onEnter: (nextState, replace) => {
                        if (!(window as any).initProps.aadTenantsData) {
                          replace(`/orgs/${nextState.params.org_name}/manage/azure`);
                        }
                      },
                    },
                    ...azureChildRoutes.childRoutes!,
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      path: "users",
      childRoutes: [
        {
          path: ":username",
          indexRoute: { onEnter: (nextState, replace: any) => replace(`/users/${nextState.params["username"]}/applications`) },
          childRoutes: [
            {
              path: "applications", // The Apps that belong to an Organization.
              component: OrgApps,
              childRoutes: [
                {
                  path: "create",
                  component: NewApp,
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

/**
 * The route object for the `settings` path.
 */
const settingsRoute: PlainRoute = {
  path: "settings",
  component: Root,
  indexRoute: {
    component: Settings,
  },
  childRoutes: [
    {
      component: Settings,
      childRoutes: [
        {
          path: "profile",
          component: UserProfile,
          childRoutes: [
            {
              path: "close-account",
              component: CloseAccountWizard,
            },
            {
              path: "password",
              component: ChangePasswordModal,
              onEnter: (_, replace) => {
                if (!userStore.currentUser.can_change_password) {
                  replace("/settings/profile");
                }
              },
            },
          ],
        },
        {
          path: "password",
          onEnter: (_, replace) => {
            // This page got removed and switched to a modal on the profile settings. Keep
            // this here to redirect old links.
            replace("/settings/profile");
          },
        },
        {
          path: "user-interface",
          component: UserInterfaceSettings,
        },
        {
          path: "billing",
          component: AllAccountsBilling,
          onEnter: (_, replace) => {
            if (!(userStore.currentUser.isFirstPartyUser || organizationStore.isCurrentUserAnAdminOfFirstPartyOrg())) {
              replace("/settings/profile");
            }
            (window as any).initProps.isUserSettingsPage = true;
          },
          childRoutes: [
            {
              path: "personal",
              component: UserBilling,
              onEnter: (_, replace) => {
                const currentUser = userStore.currentUser;
                if (currentUser && !currentUser.isFirstPartyUser) {
                  replace("/settings/profile");
                }
              },
              childRoutes: [
                {
                  path: "select-subscription",
                  component: SubscriptionSelectionModal,
                  onEnter: (_, replace) => {
                    const currentUser = userStore.currentUser;
                    if (currentUser && !currentUser.isFirstPartyUser) {
                      replace("/settings/profile");
                    }
                  },
                },
              ],
            },
            {
              path: "orgs/:org_name",
              component: OrgBilling,
              onEnter: (_, replace) => {
                const org_name = _.params.org_name;
                const org = organizationStore.find(org_name);
                if (org && !org.isOrgFirstParty) {
                  replace("/settings/profile");
                }
              },
              childRoutes: [
                {
                  path: "select-subscription",
                  component: SubscriptionSelectionModal,
                  onEnter: (_, replace) => {
                    const org_name = _.params.org_name;
                    const org = organizationStore.find(org_name);
                    if (org && !org.isOrgFirstParty) {
                      replace("/settings/profile");
                    }
                  },
                },
              ],
            },
          ],
        },
        {
          path: "accounts",
          component: Accounts,
          onEnter: (nextState, replace) => {
            if (!userStore.currentUser.isUserWhitelisted && !accountsUiStore.isAnyAccountOrCertificate) {
              return replace("/settings/profile");
            }
          },
          childRoutes: [
            {
              path: "gitlab/:id",
              component: ConnectGitLabAccountModal,
            },
          ],
        },
        {
          path: "apitokens",
          component: UserApiTokens,
          childRoutes: [
            {
              path: "create",
              component: NewApiToken,
            },
          ],
        },
        {
          path: "organizations",
          component: Organizations,
          childRoutes: [
            {
              path: "create",
              component: NewOrg,
            },
          ],
        },
        {
          path: "devices",
          component: Devices,
          onEnter: (nextState, replace) => {
            if (!userStore.currentUser.isUserWhitelisted) {
              return replace("/settings/profile");
            }
            const {
              location: { query },
            } = nextState;
            if (query && query.udid) {
              const registerDeviceStore = new RegisterDeviceStore();
              registerDeviceStore.finishDeviceRegistration(query.udid);
              replace(nextState.location.pathname);
            }
          },
          childRoutes: [
            {
              path: ":device_udid",
              component: DeviceDetails,
            },
          ],
        },
        {
          path: "notifications",
          component: UserNotificationSettings,
        },
        azureChildRoutes,
      ],
    },
  ],
};

const aadTenantLinkingRoute: PlainRoute = {
  component: ({ children }) => children,
  indexRoute: {
    onEnter: (nextState, replace) => {
      const aadTenantLinkingConfig = (window as any).initProps.aadTenantLinkingConfig;
      if (aadTenantLinkingConfig) {
        replace(aadTenantLinkingConfig.originalUrl);
      } else {
        notFoundStore.notify404();
      }
    },
  },
};

/**
 * The route object for the `overview` path
 */
const overviewRoute: PlainRoute = {
  component: Root,
  // Load the Overview component as the default page.
  indexRoute: {
    component: Overview,
    onEnter(_, replace) {
      // No overview page for custom app unless they are from HockeyApp and so fallback to distribute
      if (appStore.app && appStore.app.isCustomApp) {
        replace(locationStore.getUrlWithCurrentApp("/distribute"));
      }
    },
  },
  childRoutes: [
    {
      // no path because we want /manage to be the without any extra url component.
      component: Overview,
      childRoutes: [],
    },
    {
      path: "manage",
      onEnter(_, replace: any) {
        replace(locationStore.getUrlWithCurrentApp("/settings"));
      },
    },
  ],
};

const appSettingsRoute: PlainRoute = {
  path: "settings",
  component: Root,
  indexRoute: { component: AppSettings },
  childRoutes: [
    {
      component: AppSettings,
      childRoutes: [
        {
          path: "details",
          component: AppDetails,
          onEnter(_, replace: any) {
            if (!appStore.hasAnyCollaboratorRole(["manager", "developer"])) {
              replace(locationStore.getUrlWithCurrentApp("/settings"));
            }
          },
        },
        {
          path: "collaborators",
          component: AppCollaborators,
        },
        {
          path: "notifications",
          component: Notifications,
        },
        {
          path: "webhooks",
          component: Webhooks,
          childRoutes: [
            {
              path: "create",
              component: WebhookWizard,
            },
            {
              path: ":id",
              component: WebhookWizard,
            },
          ],
        },
        {
          path: "export",
          component: ExportConfigurations,
          childRoutes: [
            {
              path: "create",
              component: ExportConfigurationWizard,
            },
            {
              path: ":id",
              component: ExportConfigurationWizard,
            },
          ],
          onEnter: (nextState: ReactRouter.RouterState, replace: any) => {
            if (!appStore.hasAnyCollaboratorRole(["manager", "developer"])) {
              replace(locationStore.getUrlWithCurrentApp("/settings"));
            }
          },
        },
        {
          path: "apitokens",
          component: AppApiTokens,
          childRoutes: [
            {
              path: "create",
              component: NewApiToken,
            },
          ],
          onEnter: (nextState: ReactRouter.RouterState, replace: any) => {
            if (!appStore.hasAnyCollaboratorRole(["manager", "developer"])) {
              replace(locationStore.getUrlWithCurrentApp("/settings"));
            }
          },
        },
        {
          path: "services",
          component: Services,
          childRoutes: [
            {
              path: "bugtracker/add",
              component: BugTrackerWizard,
              childRoutes: [
                {
                  path: ":service_name",
                  component: BugTrackerWizard,
                  onEnter: (nextState, replace) => {
                    const validServiceNames = ["vsts", "github", "jira"];
                    if (!validServiceNames.includes(nextState.params["service_name"])) {
                      replace(nextState, locationStore.getUrlWithCurrentApp("settings/services"));
                    }
                  },
                },
              ],
              onEnter: (nextState: ReactRouter.RouterState, replace: any) => {
                if (!appStore.hasAnyCollaboratorRole(["manager", "developer"])) {
                  replace(locationStore.getUrlWithCurrentApp("/settings/services"));
                }
              },
            },
            {
              path: "bugtracker/configure",
              component: ConfigureBugTracker,
            },
          ],
        },
      ],
    },
  ],
};

/**
 * Export the beacon.
 * Note: This **has** to be exported so that shell knows about the beacon &
 * loads it when the `/dashboard` link is clicked.
 */
export default {
  apps: appsRoute,
  settings: settingsRoute,
  overview: overviewRoute,
  appSettings: appSettingsRoute,
  aadTenantLinking: aadTenantLinkingRoute,
};
