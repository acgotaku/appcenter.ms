export const VERSION = "/v0.1";

export const PARAM_KEYS = {
  APP_NAME: "app_name",
  OWNER_NAME: "owner_name",
  OWNER_TYPE: "owner_type",
  USER_NAME: "user_name",
  ORG_NAME: "org_name",
  INVITE_TOKEN: "token",
};

export const API = {
  USER_PROFILE: `${VERSION}/user`,
  APP_BY_OWNER_AND_NAME: `${VERSION}/apps/:owner_name/:app_name`,
  ACCEPT_APP_INVITATION: `${VERSION}/user/invitations/apps/:token/accept`,
  REJECT_APP_INVITATION: `${VERSION}/user/invitations/apps/:token/reject`,
  PENDING_INVITATIONS: `${VERSION}/apps/:owner_name/:app_name/invitations`,
  CHECK_USERNAME_AVAILABILITY: `${VERSION}/public/user/:user_name/availability`,
  UPDATE_DISTRIBUTION_GROUP_USER_WITH_TOKEN: `${VERSION}/distribution_group_users/token/:token`,
  ACCEPT_ORG_INVITATION: `${VERSION}/user/invitations/orgs/:token/accept`,
  REJECT_ORG_INVITATION: `${VERSION}/user/invitations/orgs/:token/reject`,
  ORGANIZATION_DETAILS_CATEGORY: `${VERSION}/private/orgs/:organizationId/category`,
  USER_DETAILS_CATEGORY: `${VERSION}/private/users/:userId/category`,
  FIRST_PARTY_NOTIFICATION: `/stores/service_status_notification`,
};
