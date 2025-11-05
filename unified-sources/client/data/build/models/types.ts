import { IUser } from "@lib/common-interfaces";
import { ApiExternalStoreRequest } from "@root/api/clients/stores/api";
// TODO: This will come from private npm package published from 'the-bridge'

/**
 * General types
 */

export type IAHPlatform = "xcode";

/**
 * Branch types
 */

/**
 * Describes a branch common to all source hosts
 */
export interface IAHGitBranch {
  name: string;
  commit: IAHCommit;
}

export interface IAHRepoConfig {
  type: string;
  state: string;
  repo_url?: string;
  id?: string;
  installation_id?: string;
  repo_id?: string;
  user_email?: string;
  external_user_id?: string;
  service_connection_id?: string;
}

export interface RepositoryMapping {
  id: string;
  app_id: string;
  user_id: string;
  repo_url: string;
}

/**
 * Branch properties common to all platforms
 */
export interface IAHBranchProperties {
  branch?: IAHGitBranch;
  enabled?: boolean;
  trigger?: IAHBranchConfigurationTrigger;
}

// "continous" is here only for backwards-compatibility, the correct variant is "continuous"
export type IAHBranchConfigurationTrigger = "manual" | "continous" | "continuous";

/**
 * The status of the branch
 */
export interface IAHBranchStatus extends IAHBranchProperties {
  configured: boolean;
  lastBuild?: IAHBuild;
  properties?: IAHBranchStatusProperties;
}

export interface IAHBranchUpdate {
  branch: IAHGitBranch;
  commitDetails: IAHCommit;
  lastBuild?: IAHBuild;
}

export interface IAHDistributionUpdate {
  uploadId: string;
  status: string;
  details?: any;
}

export type IAHBranchStatusProperties = IXcodeBranchProperties | IAndroidBranchProperties;

/**
 * The configuration of the branch
 */
export interface IAHBranchConfiguration extends IAHBranchProperties {
  id?: number;
  testsEnabled?: boolean;
  badgeIsEnabled?: boolean;
  signed?: boolean;
  toolsets: IAHBranchConfigurationToolsets;
  environmentVariables: IAHEnvironmentVariable[];
  artifactVersioning?: IAHBuildArtifactVersioningConfiguration;
}

export interface IAHExportBranchConfig extends IAHBranchProperties {
  yaml?: string;
}

export interface IAHEnvironmentVariable {
  name: string;
  value: string;
  isSecret?: boolean;
}

export interface ICustomVariable {
  index: number;
  variable: IAHEnvironmentVariable;
  saved: boolean;
}

export interface IAHBranchConfigurationToolsets {
  distribution?: IDistributionConfigurationProperties;
  xcode?: IXcodeBranchConfigurationProperties;
  javascript?: IJavaScriptBranchConfigurationProperties;
  xamarin?: IXamarinBranchConfigurationProperties;
  android?: IAndroidBranchConfigurationProperties;
  testcloud?: ITestCloudBranchConfigurationProperties;
  uwp?: IUwpBranchConfigurationProperties;
  buildscripts?: IBuildScriptsBranchConfigurationProperties;
}

export interface IBuildScriptsMap {
  [projectPath: string]: IBuildScripts;
}

export type IBuildScriptsBranchConfigurationProperties = IBuildScriptsMap;

export interface IBuildScripts {
  postClone?: string;
  preBuild?: string;
  postBuild?: string;
}

/**
 * Build types
 */

export interface IAHBuild {
  id: number;
  buildNumber: string;
  queueTime: string;
  startTime?: string;
  finishTime?: string;
  lastChangedDate?: string;
  status: string;
  result: string;
  reason: string;
  sourceBranch: string;
  sourceVersion: string;
  tags?: IAHBuildTag[];
  properties?: IAHBuildProperties;
}

/**
 * Git Lite commit types
 */

export interface IAHCommit {
  sha: string;
  url?: string;
  commit?: {
    message: string;
    author: {
      date: string;
      name: string;
      email: string;
    };
  };
  author?: {
    avatar_url: string;
  };
}

/**
 * Repository types
 */

export interface IAHSourceRepositoryLite {
  id: string;
  name: string;
  description: string | null;
  private: boolean;
  owner: {
    id: string;
    login: string;
    name?: string;
    avatar_url: string;
    gravatar_url?: string;
  };
  clone_url: string;
  external_user_id?: string;
  service_connection_id?: string;
  has_valid_permissions?: boolean;
}

/**
 * Build logs
 */

export interface IAHBuildLog {
  count: number;
  value: string[];
}

export interface IDistributionConfigurationProperties {
  distributionGroupId?: string;
  destinationId?: string;
  destinationType?: AutoDistributionDestinationType;
  destinationSubtype?: string;
  destinations?: string[];
  isSilent?: boolean;
  releaseNotes?: string;
}

export type IJavaScriptBranchConfigurationProperties = {
  packageJsonPath?: string;
} & IJavaScriptBranchProperties;

export interface IJavaScriptBranchProperties {
  runTests?: boolean;
  reactNativeVersion?: string;
  nodeVersion?: string;
}

export interface IJavaScriptSolution {
  nvmrcPath: string;
  packageJsonPath: string;
  reactNativeVersion?: string;
}

export interface IXcodeVersion {
  name: string;
  current: boolean;
}

export interface INodeVersion {
  name: string;
  current: boolean;
}

export interface IApplicationToolsets {
  xamarin?: IXamarinSDKBundle[];
  xcode?: IXcodeVersion[];
  node?: INodeVersion[];
}

export interface IXcodeBranchProperties {
  scheme?: string;
  xcodeVersion: string;
  // Provisioning Profile info for the main iOS app.
  provisioningProfileFilename?: string;
  provisioningProfileFileId?: string;
  provisioningProfileUploadId?: string;
  // Provisioning Profile info for any app extensions in the app.
  appExtensionProvisioningProfileFiles?: IProvisioningProfileFile[];
  certificateFilename?: string;
  certificatePassword?: string;
  certificateFileId?: string;
  certificateUploadId?: string;
  automaticSigning?: boolean;
}

export type IXcodeBranchConfigurationProperties = {
  projectOrWorkspacePath?: string;
  podfilePath?: string;
  cartfilePath?: string;
  provisioningProfileEncoded?: string;
  certificateEncoded?: string;
  certificatePassword?: string;
  xcodeProjectSha?: string;
  archiveConfiguration?: string;
  targetToArchive?: string;
  forceLegacyBuildSystem?: boolean;
} & IXcodeBranchProperties;

export type IProvisioningProfileFile = {
  fileName?: string;
  fileId?: string;
  uploadId?: string;
  targetBundleIdentifier?: string;
};

export interface IAndroidBranchProperties {
  keystorePassword?: string;
  keyAlias?: string;
  keyPassword?: string;
}

export type IAndroidBranchConfigurationProperties = {
  gradleWrapperPath?: string;
  module?: string;
  buildVariant?: string;
  buildBundle?: boolean;
  isRoot?: boolean;
  keystoreFilename?: string;
  keystoreEncoded?: string;
  automaticSigning?: boolean;
  runTests?: boolean;
  runLint?: boolean;
} & IAndroidBranchProperties;

export interface IToolsetProjects {
  xcode?: {
    xcodeSchemeContainers: IXcodeSchemeContainer[];
  };

  javascript?: {
    packageJsonPaths: string[];
    javascriptSolutions?: IJavaScriptSolution[];
  };

  xamarin?: {
    xamarinSolutions: IMsBuildSolution[];
  };

  uwp?: {
    uwpSolutions: IMsBuildSolution[];
  };

  android?: {
    gradleWrapperPath?: string;
    androidModules: IAndroidModule[];
  };

  testcloud?: {
    projects: ITestProjectProperties[];
  };

  buildscripts?: IBuildScriptsMap;
}

interface IMsBuildProperties {
  configuration: string;
  platform: string;
}

interface IXamarinMsBuildProperties extends IMsBuildProperties {
  androidUseSharedRuntime: boolean;
  androidPackageFormat?: "apk" | "aab";
}

export interface IMsBuildSolution {
  path: string;
  configurations: string[];
  configurationsWithPlatform?: IMSBuildConfigurationMap;
  platforms?: string[];
  defaultConfiguration?: string;
  defaultPlatform?: string;
  // This will be a union type once we add properties to other frameworks.
  properties?: IXamarinMsBuildProperties[];
  nugetConfigPath?: string;
  appExtensionTargets?: IosAppExtensionInfo[];
}

export interface IMSBuildConfiguration {
  name: string;
  platforms: IOSTargetPlatform[];
}

export type IOSTargetPlatform = "iPhone" | "iPhoneSimulator";

export type IMSBuildConfigurationMap = { [name: string]: IMSBuildConfiguration };

export type TestFrameworkType = "Appium" | "Calabash" | "Espresso" | "UITest" | "XCUITest" | "Generated";

export type IAppiumConfigurationProperties = {
  path: string;
};

export type IUITestConfigurationProperties = {
  path: string;
  configuration: string;
};

export type IGeneratedTestConfigurationProperties = {};

export type ITestCloudBranchConfigurationProperties = {
  deviceSelection: string;

  frameworkType: TestFrameworkType;
  frameworkProperties: IAppiumConfigurationProperties | IUITestConfigurationProperties | IGeneratedTestConfigurationProperties;
};

export type IUITestProjectProperties = {
  configurations: string[];
};

export type IAppiumProjectProperties = {};

export type ITestProjectProperties = {
  path: string;
  frameworkType: TestFrameworkType;
  frameworkProperties?: IUITestProjectProperties | IAppiumProjectProperties;
};

export interface IMonoVersion {
  name: string;
  current: boolean;
}

export interface IXamarinSDKBundle {
  monoVersion: string;
  sdkBundle: string;
  symlink: string;
  current: boolean;
  stable: boolean;
  xcodeVersions: string[];
}

export type IXamarinBranchConfigurationProperties = {
  slnPath: string;
  isSimBuild: boolean;
  args?: string;
  configuration: string;
  monoVersion?: string;
  sdkBundle?: string;
  symlink?: string;
  buildBundle?: boolean;
};

export type IUwpBranchConfigurationProperties = {
  slnPath: string;
  configuration: string;
  platforms: IBuildPlatform[];
  nugetConfigPath?: string;
  packageCertificateBase64String?: string;
  packageCertificateFileName?: string;
  packageCertificatePassword?: string;
};

export interface IAHBuildArtifactVersioningConfiguration {
  buildNumberFormat?: IAHBuildNumberFormat;
}

export type IAHBuildNumberFormat = "buildId" | "timestamp";

export type IBuildPlatform = "ARM" | "x86" | "x64";

export interface IXcodeSchemeContainer {
  path: string;
  sharedSchemes: IXcodeScheme[];
  podfilePath?: string;
  cartfilePath?: string;
  xcodeProjectSha?: string;
  appExtensionTargets?: IosAppExtensionInfo[];
}

export interface IosAppExtensionInfo {
  targetBundleIdentifier: string;
  name: string;
}

export interface IXcodeArchiveProject {
  archiveTargetId?: string;
  projectName?: string;
  projectPath?: string;
}

export interface IXcodeScheme {
  name: string;
  hasTestAction: boolean;
  archiveConfiguration?: string;
  archiveProject?: IXcodeArchiveProject;
}

export interface IAndroidSigningConfig {
  hasStoreFile: boolean;
}

export interface IAndroidBuildConfiguration {
  name: string;
  signingConfig: IAndroidSigningConfig | null;
}

export interface IAndroidModule {
  name: string;
  path?: string;
  gradleWrapperPath?: string;
  productFlavors?: string[];
  // `buildVariants` field must not be used explicitly. Use `buildConfigurations` instead.
  buildVariants?: string[];
  buildConfigurations?: IAndroidBuildConfiguration[];
  isRoot?: boolean;
  hasBundle?: boolean;
}

export type IAHBuildTag =
  | "signed"
  | "tests"
  | "xcode"
  | "javascript"
  | "xamarin"
  | "android"
  | "android-app-bundle"
  | "simulator"
  | "testcloud"
  | "mapping";

export interface IAHBuildProperties {
  [key: string]: { $type: string; $value: string };
}
export interface IVSTSProject {
  id: string;
  name: string;
  description?: string;
  url: string;
  state: string;
}

export interface IVSTSAccount {
  accountId: string;
  accountUri: string;
  accountName: string;
  properties?: any;
}

export interface IVSTSProfile {
  displayName: string;
  publicAlias: string;
  emailAddress: string;
  coreRevision: number;
  timeStamp: string;
  id: string;
  revision: number;
}

export type IVSTSAccountExtended = IVSTSAccount & { projects: IVSTSProject[]; user: IVSTSProfile };

export interface EnvironmentVariablesBlackList {
  prefixes: string[];
  variables: string[];
}

export enum StoreType {
  GooglePlay = "GooglePlay",
  Intune = "Intune",
  AppleStore = "Apple",
  None = "None",
}

export enum StoreTrack {
  Production = "production",
  Alpha = "alpha",
  Beta = "beta",
  TestFlightInternal = "testflight-internal",
  TestFlightExternal = "testflight-external",
}

export interface IntuneDetails {
  app_category: AppCategory;
  target_audience: TargetAudience;
}

export interface AppCategory {
  id: string;
  name: string;
}

export interface TargetAudience {
  id: string;
  name: string;
}

export interface IntuneCategories {
  value: IntuneCategory[];
}

export interface IntuneCategory {
  id: string;
  displayName: string;
}

export interface IDestination {
  id?: string;
  name: string;
}

export interface IDistributionStore extends IDestination {
  type: ApiExternalStoreRequest.ApiTypeEnum;
  track?: string;
  intune_details?: IntuneDetails;
  service_connection_id?: string;
  external?: boolean;
}

export interface IAHDistributionGroup extends IDestination {
  display_name?: string;
  users?: IUser[];
  aad_groups?: IUser[];
  total_user_count?: number;
  total_groups_count?: number;
}

export interface Tester extends IDestination {
  user: IUser;
}

export enum ReleaseDestinationType {
  Group = "group",
  Store = "store",
  Tester = "tester",
}

export interface ReleaseDestinationWithType {
  id: string;
  name?: string;
  type: ReleaseDestinationType;
}

export interface DistributionResponse {
  upload_id: string;
  status: string;
}

export enum AutoDistributionDestinationType {
  Groups = "groups",
  Store = "store",
}

export interface AndroidBundleStore {
  buildBundleEnabled: boolean;
  buildBundleNotSupported?: boolean;
  setBuildBundle: (value: boolean) => void;
}
