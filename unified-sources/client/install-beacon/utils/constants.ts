export const ApiVersion = "v0.1";

export const Urls = {
  GetPackagePath: `${ApiVersion}/apps/:owner_name/:app_name/releases/:package_id`,
  GetAppsPath: `${ApiVersion}/apps`,
  GetUpdateToken: `${ApiVersion}/in_app_update_token`,
  GetPrivateUpdateBuild: `${ApiVersion}/sdk/apps/:app_secret/releases/:package_hash`,
  GetPublicUpdateBuild: `${ApiVersion}/public/sdk/apps/:app_secret/distribution_groups/:distribution_group_id/releases/latest`,
  RegisterDevice: `${ApiVersion}/devices/register`,
  GetLatestReleaseForDistributionGroup: `${ApiVersion}/apps/:owner_name/:app_name/distribution_groups/:group_name/releases/latest`,
  PostInstallAnalytics: `${ApiVersion}/public/apps/:owner_name/:app_name/install_analytics`,
  GetPublicDistributionGroups: `${ApiVersion}/public/sdk/apps/:app_secret/releases/:release_hash/public_distribution_groups`,
  GetDistributionSettings: `${ApiVersion}/public/sdk/apps/:app_secret/distribution_settings`,
};

export const LocalStorageKeys = {
  InitialRegistration: "initial_registration",
  UpdateToken: "update_token",
  DistributionGroupId: "distribution_group_id",
  PackageHashes: "package_hashes",
  DisplayName: "display_name",
  IconUrl: "icon_url",
  Format: "{0}_{1}",

  Registered: "udid",
  Skip: "skip",
  DeviceRegistration: "device_registration",
};

export const InAppUpdateRedirectUrl = {
  PrivateUrlFormatIos: `{0}://?${LocalStorageKeys.UpdateToken}={1}&${LocalStorageKeys.DistributionGroupId}={2}&request_id={3}&udid={4}`,
  PrivateUrlFormatAndroid: `intent://updates/#Intent;scheme={0};package={1};S.${LocalStorageKeys.UpdateToken}={2};S.${LocalStorageKeys.DistributionGroupId}={3};S.request_id={4};S.udid={5};end`,
  PublicUrlFormatIos: `{0}://?${LocalStorageKeys.DistributionGroupId}={1}&request_id={2}`,
  PublicUrlFormatAndroid: `intent://updates/#Intent;scheme={0};package={1};S.${LocalStorageKeys.DistributionGroupId}={2};S.request_id={3};end`,
  FailedUrlFormatIos: `{0}://?update_setup_failed={1}&request_id={2}`,
  FailedUrlFormatAndroid: `intent://updates/#Intent;scheme={0};package={1};S.update_setup_failed={2};S.request_id={3};end`,
  EmptyUrlFormatIos: `{0}://?request_id={1}`,
  EmptyUrlFormatAndroid: `intent://updates/#Intent;scheme={0};package={1};S.request_id={2};end`,
  DefaultScheme: "mobile.center",
};

export const Routes = {
  AppList: "/apps",
  RegisterDevice: "/register-device",
  ReleaseDetails: "/releases/:id",
  Profile: "/profile",
  SignIn: "/sign-in",
};
