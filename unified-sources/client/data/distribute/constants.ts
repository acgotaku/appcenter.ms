export const VERSION = "/v0.1";

export const API = {
  APP_DISTRIBUTION_GROUPS: `${VERSION}/apps/:owner_name/:app_name/distribution_groups_details`,
  ORG_DISTRIBUTION_GROUPS: `${VERSION}/orgs/:org_name/distribution_groups`,
  ORG_DISTRIBUTION_GROUPS_WITH_DETAILS: `${VERSION}/orgs/:org_name/distribution_groups_details`,
  ORG_DISTRIBUTION_GROUP: `${VERSION}/orgs/:org_name/distribution_groups/:group_name`,
  ORG_DISTRIBUTION_GROUP_TESTERS: `${VERSION}/orgs/:org_name/distribution_groups/:group_name/members`,
  ORG_DISTRIBUTION_GROUP_RESEND_INVITE: `${VERSION}/orgs/:org_name/distribution_groups/:group_name/resend_invite`,
  DELETE_ORG_DISTRIBUTION_GROUP_TESTERS: `${VERSION}/orgs/:org_name/distribution_groups/:group_name/members/bulk_delete`,
  ORG_DISTRIBUTION_GROUP_APPS: `${VERSION}/orgs/:org_name/distribution_groups/:group_name/apps`,
  ORG_DISTRIBUTION_GROUP_APP: `${VERSION}/orgs/:org_name/distribution_groups/:group_name/apps/:app_name`,
  DELETE_ORG_DISTRIBUTION_GROUP_APPS: `${VERSION}/orgs/:org_name/distribution_groups/:group_name/apps/bulk_delete`,

  // Testers
  ORG_TESTERS_ALL: `${VERSION}/orgs/:org_name/testers`,
  ORG_TESTERS_IN_GROUP: `${VERSION}/orgs/:org_name/distribution_groups/:group_name/members`,
  ORG_AAD_GROUPS_IN_GROUP: `${VERSION}/orgs/:org_name/distribution_groups/:group_name/groups`,
  DELETE_AAD_GROUP_FROM_SHARED_GROUP: `${VERSION}/orgs/:org_name/distribution_groups/:group_name/groups/bulk_delete`,
  DELETE_ORG_TESTERS_IN_GROUP: `${VERSION}/orgs/:org_name/distribution_groups/:group_name/members/bulk_delete`,

  DISTRIBUTION_STORES_SERVICE_STATUS: `${VERSION}/apps/:owner_name/:app_name/store_service_status`,
  GOOGLE_PLAY_CONNECTION_STATUS: `${VERSION}/apps/:owner_name/:app_name/distribution_stores/:package_name/validate_creation/:service_connection_id`,
  USER_INFO: `${VERSION}/userexistsviaemail`,
};

export const MicrosoftInternalGroupId = "11111111-1111-1111-1111-111111111111";
export const MicrosoftInternalGroupName = "Microsoft Internal";

export const DefaultGroupId = "00000000-0000-0000-0000-000000000000";

export const Origin = {
  MobileCenter: "mobile-center",
  AppCenter: "appcenter",
  HockeyApp: "hockeyapp",
};

export type Origin = keyof typeof Origin;

// This seems wrong but it was moved from client/distribute/utils/constants.ts this way.
const versionWithoutSlashForSomeReason = "v0.1";
export const Urls = {
  ReleaseDetailsUpdatePath: `${versionWithoutSlashForSomeReason}/apps/:owner_name/:app_name/releases/:release_id`,
  ReleaseDestinationGroupsDetailsUpdatePath: `${versionWithoutSlashForSomeReason}/apps/:owner_name/:app_name/releases/:release_id/groups/:destination_id`,
  ReleasePath: `${versionWithoutSlashForSomeReason}/apps/:owner_name/:app_name/releases/:release_id`,
  GetReleasesPath: `${versionWithoutSlashForSomeReason}/apps/:owner_id/:app_id/releases`,
  GetRecentReleasesPath: `${versionWithoutSlashForSomeReason}/apps/:owner_id/:app_id/recent_releases`,
  PostUploadReleasePath: `${versionWithoutSlashForSomeReason}/apps/:owner_id/:app_id/uploads/releases`,
  UploadReleaseWithIdPath: `${versionWithoutSlashForSomeReason}/apps/:owner_id/:app_id/uploads/releases/:upload_id`,
  PostExternalReleasePath: `${versionWithoutSlashForSomeReason}/apps/:owner_name/:app_name/releases`,
  GetUsersPath: `${versionWithoutSlashForSomeReason}/apps/:owner_id/:app_id/users`,
  GetTestersPath: `${versionWithoutSlashForSomeReason}/apps/:owner_id/:app_id/testers`,
  GetReleasesForDistributionGroupPath: `${versionWithoutSlashForSomeReason}/apps/:owner_id/:app_id/distribution_groups/:distribution_group_name/releases`,
  GetDevicesForDistributionGroupPath: `${versionWithoutSlashForSomeReason}/apps/:owner_id/:app_id/distribution_groups/:distribution_group_name/devices`,
  GetDevicesCsvExportForDistributionGroupPath: `${versionWithoutSlashForSomeReason}/apps/:owner_id/:app_id/distribution_groups/:distribution_group_name/devices/download_devices_list`,
  GetLatestReleaseForDistributionGroupPath: `${versionWithoutSlashForSomeReason}/apps/:owner_id/:app_id/distribution_groups/:distribution_group_name/releases/latest`,
  DistributionGroupMembers: `${versionWithoutSlashForSomeReason}/apps/:owner_name/:app_name/distribution_groups/:distribution_group_name/members`,
  DistributionGroupMembersResendInvite: `${versionWithoutSlashForSomeReason}/apps/:owner_name/:app_name/distribution_groups/:distribution_group_name/resend_invite`,
  DistributionGroupAadGroups: `${versionWithoutSlashForSomeReason}/apps/:owner_name/:app_name/distribution_groups/:distribution_group_name/groups`,
  DistributionGroupNotificationsLatestRelease: `${versionWithoutSlashForSomeReason}/apps/:owner_name/:app_name/distribution_groups/:distribution_group_name/notifications/latest_release`,
  BulkDeleteDistributionGroupMembers: `${versionWithoutSlashForSomeReason}/apps/:owner_name/:app_name/distribution_groups/:distribution_group_name/members/bulk_delete`,
  BulkDeleteDistributionGroupAadGroups: `${versionWithoutSlashForSomeReason}/apps/:owner_name/:app_name/distribution_groups/:distribution_group_name/groups/bulk_delete`,
  PostCreateDistributionGroup: `${versionWithoutSlashForSomeReason}/apps/:owner_name/:app_name/distribution_groups`,
  GetDistributionGroupsPath: `${versionWithoutSlashForSomeReason}/apps/:owner_name/:app_name/distribution_groups_details`,
  DistributionGroupPath: `${versionWithoutSlashForSomeReason}/apps/:owner_name/:app_name/distribution_groups/:distribution_group_name`,
  ReleaseFromDistributionGroup: `${versionWithoutSlashForSomeReason}/apps/:owner_name/:app_name/distribution_groups/:distribution_group_name/releases/:release_id`,
  GetBranchesPath: `${versionWithoutSlashForSomeReason}/apps/:owner_name/:app_name/branches`,
  GetBuildsinBranchPath: `${versionWithoutSlashForSomeReason}/apps/:owner_name/:app_name/branches/:branch_name/builds`,
  GetCommitsPath: `${versionWithoutSlashForSomeReason}/apps/:owner_name/:app_name/commits/batch`,
  PostDistributeFromBuildPath: `${versionWithoutSlashForSomeReason}/apps/:owner_name/:app_name/builds/:build_id/distribute`,
  GetCodePushDeploymentsPath: `${versionWithoutSlashForSomeReason}/apps/:owner_name/:app_name/deployments`,
  GetCodePushDeploymentPath: `${versionWithoutSlashForSomeReason}/apps/:owner_name/:app_name/deployments/:deployment_name`,
  GetCodePushDeploymentReleasesPath: `${versionWithoutSlashForSomeReason}/apps/:owner_name/:app_name/deployments/:deployment_name/releases`,
  GetCodePushDeploymentReleaseDetailsPath: `${versionWithoutSlashForSomeReason}/apps/:owner_name/:app_name/deployments/:deployment_name/releases/:release_label`,
  GetCodePushDeploymentReleaseMetricsPath: `${versionWithoutSlashForSomeReason}/apps/:owner_name/:app_name/deployments/:deployment_name/metrics`,
  CodePushDeploymentPromotePath: `${versionWithoutSlashForSomeReason}/apps/:owner_name/:app_name/deployments/:deployment_name/promote_release/:destination_deployment_name`,
  PostPublishDevices: `${versionWithoutSlashForSomeReason}/apps/:owner_name/:app_name/distribution_groups/:distribution_group_name/publish_devices`,
  PostGetDevicesLeft: `${versionWithoutSlashForSomeReason}/apps/:owner_name/:app_name/distribution_groups/:distribution_group_name/devices_per_type`,
  PostGetAvailabilityOfDevices: `${versionWithoutSlashForSomeReason}/apps/:owner_name/:app_name/distribution_groups/:distribution_group_name/availability_of_devices`,
  PostPublishAndResignDevices: `${versionWithoutSlashForSomeReason}/apps/:owner_name/:app_name/releases/:release_id/update_devices`,
  GetUnprovisionedDevicesInRelease: `${versionWithoutSlashForSomeReason}/apps/:owner_name/:app_name/distribution_groups/:distribution_group_name/devices?release_id=:release_id`,
  GetReleaseCounts: `${versionWithoutSlashForSomeReason}/apps/:owner_name/:app_name/analytics/distribution/release_counts`,
  PostFileAsset: `${versionWithoutSlashForSomeReason}/apps/:owner_name/:app_name/file_asset`,
  PostValidateFilePassword: `${versionWithoutSlashForSomeReason}/apps/:owner_name/:app_name/files/:file_id/validate`,
  PostDestinationGroups: `${versionWithoutSlashForSomeReason}/apps/:owner_name/:app_name/releases/:release_id/groups`,
  PostDestinationStores: `${versionWithoutSlashForSomeReason}/apps/:owner_name/:app_name/releases/:release_id/stores`,
  PostDestinationTesters: `${versionWithoutSlashForSomeReason}/apps/:owner_name/:app_name/releases/:release_id/testers`,
};
