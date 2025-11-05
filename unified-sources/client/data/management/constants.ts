import { OS, ALL_APP_FILTER_ROLES } from "@lib/common-interfaces";
import { values } from "lodash";

export const VERSION = "/v0.1";

export const DATE_FOR_USERS_CREATED_AFTER_GA = "2017-11-15T19:30:00Z";

export const API = {
  USER_PROFILE: `${VERSION}/user_features`,
  USER_APPS: `${VERSION}/apps_features`,
  USER_APP: `${VERSION}/apps_features/:owner_name/:app_name`,
  DELETE_APP: `${VERSION}/apps/:owner_name/:app_name`,
  UPDATE_PASSWORD: `/user/:userId/update`, // Don't add version here since it's an internal endpoint.
  APP_INVITED_USER: `${VERSION}/apps/:owner_name/:app_name/invitations/:user_email`,
  APP_USERS: `${VERSION}/apps/:owner_name/:app_name/users`,
  REMOVE_APP_TESTER_FROM_DESTINATIONS: `${VERSION}/apps/:owner_name/:app_name/testers/:userId`,
  APP_TEAMS: `${VERSION}/apps/:owner_name/:app_name/teams`,
  GET_APP_INVITATIONS: `${VERSION}/apps/:owner_name/:app_name/invitations`,
  APP_USER: `${VERSION}/apps/:owner_name/:app_name/users/:user_email`,
  TRANSFER_APP_TO_ORG: `${VERSION}/apps/:owner_name/:app_name/transfer/:destination_owner_name`,
  APP_BRANCHES: `${VERSION}/apps/:owner_name/:app_name/branches`,
  BUILD_BRANCHES_CONFIG: `${VERSION}/apps/:owner_name/:app_name/branches/:branch/config`,
  // User settings
  USER_SETTING: `${VERSION}/user/settings/:setting_name`,

  // Invitations
  USER_INVITATIONS: `${VERSION}/invitations`,
  USER_INVITATION_ACCEPT: `${VERSION}/invitations/:invitation_id/accept`,
  USER_INVITATION_REJECT: `${VERSION}/invitations/:invitation_id/reject`,

  // Organizations
  USER_ORGANIZATIONS: `${VERSION}/orgs`,
  USER_ORGANIZATION: `${VERSION}/orgs/:org_name`,
  ORG_APPS: `${VERSION}/orgs/:org_name/apps`,
  ORG_USERS: `${VERSION}/orgs/:org_name/users`,
  ORG_USER: `${VERSION}/orgs/:org_name/users/:user_name`,
  ORG_INVITATIONS: `${VERSION}/orgs/:org_name/invitations`,
  ORG_INVITATIONS_ROLE_UPDATE: `${VERSION}/orgs/:org_name/invitations/:email`,
  RESEND_ORG_INVITATION: `${VERSION}/orgs/:org_name/invitations/:email/resend`,
  REVOKE_ORG_INVITATION: `${VERSION}/orgs/:org_name/invitations/:email/revoke`,

  // Teams
  TEAMS: `${VERSION}/orgs/:org_name/teams`,
  TEAM: `${VERSION}/orgs/:org_name/teams/:team_name`,
  TEAMS_USERS: `${VERSION}/orgs/:org_name/teams/:team_name/users`,
  TEAMS_USER: `${VERSION}/orgs/:org_name/teams/:team_name/users/:user_name`,
  TEAM_APPS: `${VERSION}/orgs/:org_name/teams/:team_name/apps`,
  TEAM_APP: `${VERSION}/orgs/:org_name/teams/:team_name/apps/:app_name`,

  // Webhooks
  WEBHOOKS: `${VERSION}/apps/:owner_name/:app_name/alerts_webhooks`,
  WEBHOOK: `${VERSION}/apps/:owner_name/:app_name/alerts_webhooks/:webhook_id`,
  PING_WEBHOOK: `${VERSION}/apps/:owner_name/:app_name/alerts_webhooks/:webhook_id/ping`,

  // Exports
  EXPORT_CONFIGURATIONS: `${VERSION}/apps/:owner_name/:app_name/export_configurations`,
  EXPORT_CONFIGURATION: `${VERSION}/apps/:owner_name/:app_name/export_configurations/:export_configuration_id`,
  EXPORT_CONFIGURATION_ENABLE: `${VERSION}/apps/:owner_name/:app_name/export_configurations/:export_configuration_id/enable`,
  EXPORT_CONFIGURATION_DISABLE: `${VERSION}/apps/:owner_name/:app_name/export_configurations/:export_configuration_id/disable`,

  // Data Retention
  DATA_RETENTION: `${VERSION}/apps/:owner_name/:app_name/errors/retention_settings`,

  // Azure Subscriptions
  USER_AZURE_SUBSCRIPTIONS: `${VERSION}/azure_subscriptions`,
  USER_AZURE_SUBSCRIPTION: `${VERSION}/azure_subscriptions/:subscription_id`,
  ORG_AZURE_SUBSCRIPTIONS: `${VERSION}/orgs/:org_name/azure_subscriptions`,
  ORG_AZURE_SUBSCRIPTION: `${VERSION}/orgs/:org_name/azure_subscriptions/:subscription_id`,
  APP_AZURE_SUBSCRIPTIONS: `${VERSION}/apps/:owner_name/:app_name/azure_subscriptions`,
  APP_AZURE_SUBSCRIPTION: `${VERSION}/apps/:owner_name/:app_name/azure_subscriptions/:subscription_id`,

  // Azure Tenants
  ORG_AZURE_TENANT: `${VERSION}/orgs/:org_name/aad_tenant`,

  // BugTracker
  BUGTRACKER: `${VERSION}/apps/:owner_name/:app_name/alerts_bugtracker`,
  BUGTRACKER_UPDATE_STATE: `${VERSION}/apps/:owner_name/:app_name/alerts_bugtracker/state`,
  BUGTRACKER_TOKENS: `${VERSION}/alerts_bugtracker/access_tokens`,
  BUGTRACKER_REPOS: `${VERSION}/apps/:owner_name/:app_name/alerts_bugtracker/repos`,
  BUGTRACKER_SERVICE_CONNECTION: `${VERSION}/user/serviceConnections`,

  // Devices
  GET_DEVICES_FOR_USER: `${VERSION}/user/devices`,
  DEVICE_FOR_USER: `${VERSION}/user/devices/:device_udid`,

  // org compliance settings
  ORG_COMPLIANCE_SETTINGS: `${VERSION}/orgs/:org_name/compliance_settings`,
  ORG_COMPLIANCE_SETTINGS_WITH_ID: `${VERSION}/orgs/:org_name/compliance_settings/:compliance_setting_id`,

  // Device management
  GET_DEVICE_MANAGEMENT_PROFILE: `${VERSION}/devices/register`,
};

export const OWNER_TYPE = {
  ORGANIZATION: "org",
  USER: "user",
};

export const ERROR_CODES = {
  LAST_ADMIN: "LastOrganizationAdmin",
  FORBIDDEN: "Forbidden",
  MUST_BE_APP_OWNER_TO_TRANSFER: "RequiresAppOwnerToTransfer",
  MUST_BE_ORG_ADMIN_TO_TRANSFER: "RequiresOrgAdminToTransfer",
};

// App filters
export type AppFilterQueryParams = "os" | "role" | "origin" | "release_type";
export const AppFilterQueryParams = {
  OS: "os" as AppFilterQueryParams,
  Role: "role" as AppFilterQueryParams,
  Origin: "origin" as AppFilterQueryParams,
  ReleaseType: "release_type" as AppFilterQueryParams,
};
export const ValidAppOSFilters = values<string>(OS);
export const isValidAppOSFilter = (value) => ValidAppOSFilters.find((os) => value === os);

export const isValidAppRoleFilter = (value) => ALL_APP_FILTER_ROLES.find((role) => value === role);

export const isValidReleaseType = (value?: string): value is string =>
  !!value && value !== "All" && value[0].toUpperCase() === value[0] && !value.includes(" ");

// App environment default values
export const SuggestedReleaseTypes = ["Alpha", "Beta", "Enterprise", "Production", "Store"];

// App list view types
export enum AppListType {
  List,
  Grid,
}

// Billing
// Free test tiers
export const TestTrialId = "billingPlanTestTrial";
export const TestFreeUntilGAId = "billingPlanTestFreeUntilGA";
export const TestFreeTierId = "billingPlanTestFree";

// Paid test tiers
export const TestPlanPaidId = "billingPlanTestPaid";
export const TestPlanEnterpriseId = "billingPlanTestEnterprise";

// Free build tiers
export const BuildFreeTierId = "billingPlanBuildFree";
export const BuildFreeUntilGAId = "billingPlanBuildFreeUntilGA";
// Paid build tiers
export const BuildPlanPaidId = "billingPlanBuildPaid";

// Billing path
export const TestBillingPeriodPath = "billingPlans.testService";

// Build, Test, & Push build plan paths
export const TestBillingPlanPath = "billingPlans.testService.currentBillingPeriod.byAccount";
export const BuildBillingPlanPath = "billingPlans.buildService.currentBillingPeriod.byAccount";

// Usage paths
export const TestUsagePath = "usage.testService.currentUsagePeriod.byAccount";
export const BuildUsagePath = "usage.buildService.currentUsagePeriod.byAccount";

// Webhook configuration docs urls
export const MsTeamsWebhookDocURL =
  "https://docs.microsoft.com/en-us/microsoftteams/platform/concepts/connectors#setting-up-a-custom-incoming-webhook";
export const SlackWebhookDocURL = "https://slack.com/apps/A0F7XDUAZ-incoming-webhooks";

export const defaultColumnWidth = {
  nameColumn: 6,
  nameColumnHideOwner: 9,
  platformColumn: 3,
};

export const roleColumnWidth = {
  nameColumn: 5,
  nameColumnHideOwner: 8,
  platformColumn: 2,
};

export const releaseTypeColumnWidth = {
  nameColumn: 4,
  nameColumnHideOwner: 7,
  platformColumn: 1,
};
