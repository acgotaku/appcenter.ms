export const ApiVersion = "v0.1";

export const JustNowLabelInterval = 2;

import { Urls } from "@root/data/distribute/constants";
import { DistributionGroupWithMembers } from "@root/distribute/models/distribution-group-with-members";
export { Urls };

export function getDevicesExportDownloadUrl(
  ownerId: string,
  appId: string,
  distributionGroupName: string,
  unprovisionedOnly: boolean = false,
  udids?: string[]
): string {
  let url = Urls.GetDevicesCsvExportForDistributionGroupPath.replace(":owner_id", ownerId)
    .replace(":app_id", appId)
    .replace(":distribution_group_name", distributionGroupName);

  if (udids) {
    url = url + "?udids=" + udids.join(",");
  } else {
    url = url + "?unprovisioned_only=" + unprovisionedOnly.toString();
  }

  return `/download-stream?url=/${encodeURIComponent(url)}&file_name=${distributionGroupName}-devices.txt`;
}

export function getAssetPath(ownerName: string, appName: string): string {
  return `/${Urls.PostFileAsset.replace(":owner_name", ownerName).replace(":app_name", appName)}`;
}

export const Paths = {
  ManageAppPath: `manage`,
  ManageAppCollaborators: "/settings/collaborators",
};

export enum TabId {
  overview = 0,
  testers = 1,
  releases = 2,
  devices = 3,
}

export const Routes = {
  Releases: "/distribute/releases",
  ReleasesWizard: "/distribute/releases/new-release",
  ReleaseDetails: "/distribute/releases/:release_id",
  ReleaseDetailsEditWizard: "distribute/releases/:release_id/edit-release",
  ReleaseDetailsReDistributeGroupWizard: "/distribute/releases/:release_id/new-group-release",
  ReleaseDetailsReDistributeStoreWizard: "/distribute/releases/:release_id/new-store-release",
  DistributionGroups: "/distribute/distribution-groups",
  DistributionGroupsDistributeWizard: "/distribute/distribution-groups/new-release",
  ProvisioningStatus: "/distribute/distribution-groups/:group_name/:tab/progress",
  DistributionGroupDetails: "/distribute/distribution-groups/:group_name/:tab",
  DistributionGroupsDetailsDistributeWizard: "/distribute/distribution-groups/:group_name/:tab/new-release",
  DistributionGroupsDetailsSettings: "/distribute/distribution-groups/:group_name/:tab/settings",
  DistributionGroupsDetailsPublishDevicesWizard: "/distribute/distribution-groups/:group_name/:tab/device-registration",
  DistributionGroupsCreateGroupWizard: "/distribute/distribution-groups/new-group",
  DistributionGroupsDetailsConnectToApple: "/distribute/distribution-groups/:group_name/connect-to-apple",
  DistributionGroupReleaseDetails: "/distribute/distribution-groups/:group_name/releases/:release_id",
  DistributionGroupReleaseDetailsEditWizard: "/distribute/distribution-groups/:group_name/releases/:release_id/edit-release",
  DistributionGroupReleaseDetailsReDistributeGroupWizard:
    "/distribute/distribution-groups/:group_name/releases/:release_id/new-group-release",
  CodePush: "/distribute/code-push",
  CodePushDeployment: "/distribute/code-push/:deployment",
  CodePushManageDeployments: "/distribute/code-push/:deployment/edit",
  CodePushReleaseDetails: "/distribute/code-push/:deployment/:release_label",
  CodePushReleaseDetailsEdit: "/distribute/code-push/:deployment/:release_label/edit",
};

export const DefaultGroupId = "00000000-0000-0000-0000-000000000000";
export const DefaultGroupName = "Collaborators";

export const MicrosoftInternalGroupId = "11111111-1111-1111-1111-111111111111";
export const MicrosoftInternalGroupName = "Microsoft Internal";

export const MicrosoftInternalGroupWithMembers: DistributionGroupWithMembers = {
  id: MicrosoftInternalGroupId,
  name: MicrosoftInternalGroupName,
  display_name: MicrosoftInternalGroupName,
  users: [],
  aad_groups: [],
  total_user_count: 0,
  total_groups_count: 0,
  notified_user_count: 0,
};

export const StoreRoutes = {
  DistributionStores: "/distribute/distribution-stores",
  DistributionStoreDetails: "/distribute/distribution-stores/:store_name/releases",
  DistributionStoresCreateStoreWizard: "/distribute/distribution-stores/new-store",
  DistributionStoreDetailsDistributeWizard: "/distribute/distribution-stores/:store_name/releases/new-release",
  DistributionStoreReleaseDetails: "/distribute/distribution-stores/:store_name/releases/:release_id",
  DistributionStoreReleaseDetailsReDistributeStoreWizard:
    "/distribute/distribution-stores/:store_name/releases/:release_id/new-store-release",
  DistributionStoreDetailsSettings: "/distribute/distribution-stores/:store_name/releases/settings",
  DistributionStoresWithTypeWizard: "{0}?type={1}",
};
export const StoreUrls = {
  AllStores: `${ApiVersion}/apps/:owner_name/:app_name/all_stores`,
  DistributionStores: `${ApiVersion}/apps/:owner_name/:app_name/distribution_stores`,
  DistributionStorePath: `${ApiVersion}/apps/:owner_name/:app_name/distribution_stores/:distribution_store_name`,
  GetRecentReleasesPath: `${ApiVersion}/apps/:owner_id/:app_id/distribution_stores/recent_releases`,
  GetDistributionStoreReleases: `${ApiVersion}/apps/:owner_id/:app_id/distribution_stores/:distribution_store_name/releases`,
  GetDistributionStoreLatestRelease: `${ApiVersion}/apps/:owner_id/:app_id/distribution_stores/:distribution_store_name/latest_release`,
  DistributionStoreRelease: `${ApiVersion}/apps/:owner_name/:app_name/distribution_stores/:distribution_store_name/releases/:package_id`,
  GetReleaseError: `${ApiVersion}/apps/:owner_name/:app_name/distribution_stores/:distribution_store_name/releases/:release_id/publish_error_details`,
  GetStoreReleasePublishLogs: `${ApiVersion}/apps/:owner_name/:app_name/distribution_stores/:distribution_store_name/releases/:release_id/publish_logs`,
  GetIntuneStoreConnect: `/auth/intune?app_id={0}&original_url={1}&get_token=true`,
  GetIntuneCategories: `${ApiVersion}/apps/:owner_name/:app_name/store_secrets/:secret_id/categories`,
  GetIntuneUserGroups: `${ApiVersion}/apps/:owner_name/:app_name/store_secrets/:secret_id/user_groups`,
  CreateStoreBySecretId: `${ApiVersion}/apps/:owner_name/:app_name/store_secrets/:secret_id/create_store`,
  GetAllAppleTeams: `${ApiVersion}/apple/itunes/get_all_teams`,
  GetAllAppleApps: `${ApiVersion}/apple/itunes/get_all_apps`,
  AppleAppLevelInfo: `${ApiVersion}/apps/:owner_name/:app_name/apple_mapping`,
};

export const AUTO_PROVISIONING_CONFIG_API = {
  GET_AUTO_PROVISIONING_CONFIG: `${ApiVersion} /apps/:owner_name/:app_name/destinations/:destination_name/provisioning_config`,
  POST_AUTO_PROVISIONING_CONFIG: `${ApiVersion}/apps/:owner_name/:app_name/destinations/:destination_name/provisioning_config`,
  PATCH_AUTO_PROVISIONING_CONFIG: `${ApiVersion}/apps/:owner_name/:app_name/destinations/:destination_name/provisioning_config`,
  DELETE_AUTO_PROVISIONING_CONFIG: `${ApiVersion}/apps/:owner_name/:app_name/destinations/:destination_name/provisioning_config`,
};

export const ReleaseNotesLength = {
  AppleMinLength: 10,
  AppleMaxLength: 4000,
  IntuneMinLength: 0,
  IntuneMaxLength: 1024,
  GoogleMinLength: 0,
  GoogleMaxLength: 500,
  GlobalMaxLength: 5000,
};

export const AddCredentialType = {
  AddNewAccount: "addnewaccount",
  AddNewCertificate: "addnewcertificate",
};

export const AppleDowntime = {
  StartDate: new Date("23 Dec 2020 08:00:00 GMT"),
  EndDate: new Date("28 Dec 2020 08:00:00 GMT"),
};

export const FeatureFlags = {
  ConnectApi: "connectApi",
};
