import { Origin } from "./origin";
import { BeaconName } from "./beacon-name";
import { ICategory } from "./category";

/**
 * Contract for App
 */
export interface IApp {
  id?: string;
  microsoft_internal?: boolean;
  app_secret?: string;
  azure_subscription?: { subscription_id: string; subscription_name: string; tenant_id: string };
  description?: string;
  release_type?: string;
  display_name?: string;
  feature_flags?: string[];
  repositories?: { repo_url?: string; repo_provider?: string }[];
  name?: string;
  icon_url?: string;
  icon_source?: string;
  os?: string;
  readonly owner?: IAppOwner;
  platform?: string;
  member_permissions?: AppRole[];
  user_permissions?: UserPermissions; //this is returned when you click on an app in the user's apps list
  origin?: Origin;
  created_at?: string;
  updated_at?: string;
  application_category?: ICategory;
  cutover_from_hockeyapp_at?: string;
  humanReadablePlatform?: string;
  isOrgApp?: boolean;
  isUserApp?: boolean;
  isOwnedByCurrentUser?: boolean;
  isCreatedInCodePush?: boolean;
  isCreatedInAppCenter?: boolean;
  isCreatedInTestCloud?: boolean;
  isSupportedUnderSxS?: boolean;
  isCodePushCapableButLimitedOtherSupport?: boolean;
  /**
   * Returns true if the app is supported by the given beacon.
   *
   * Compatibility is checked against the support matrix defined in
   * `SUPPORTED_OS_AND_PLATFORMS_FOR_SxS (common-interfaces/app.ts)`
   * in addition to special cases for beacons.
   */
  isSupportedForBeacon?: (beacon: BeaconName) => boolean;
  isAnUnconfiguredApp?: boolean;
  isAnIosAppWithUnknownPlatform?: boolean; // TODO: Remove this func in the future. It's created for the special cases for SxS apps.
  isAnAndroidAppWithUnknownPlatform?: boolean; // TODO: Remove this func in the future. It's created for the special cases for SxS apps.
  isWindowsApp?: boolean;
  isTizenApp?: boolean;
  isAppleApp?: boolean;
  isIosApp?: boolean;
  isAndroidApp?: boolean;
  isXamarinApp?: boolean;
  isAndroidJavaApp?: boolean;
  isMacOSApp?: boolean;
  isTvOSApp?: boolean;
  isCustomApp?: boolean;
  isReactNativeApp?: boolean;
  isCordovaApp?: boolean;
  isElectronApp?: boolean;
  isUwpApp?: boolean;
  ownerFriendlyName?: string;
}

/**
 * Contract for AppOwner
 */
export interface IAppOwner {
  id?: string;
  display_name: string;
  email: string;
  name: string;
  type: string;
  feature_flags?: string[];
}

/**
 * App types
 */
export type OS = "Android" | "iOS" | "Tizen" | "Windows" | "macOS" | "tvOS" | "Linux" | "Custom";
export const OS = {
  ANDROID: "Android" as OS,
  IOS: "iOS" as OS,
  TIZEN: "Tizen" as OS,
  WINDOWS: "Windows" as OS,
  MACOS: "macOS" as OS,
  TVOS: "tvOS" as OS,
  LINUX: "Linux" as OS,
  CUSTOM: "Custom" as OS,
};

/**
 * Platforms
 */
export type PLATFORM =
  | "Java"
  | "Objective-C-Swift"
  | "React-Native"
  | "UWP"
  | "Xamarin"
  | "Cordova"
  | "Unity"
  | "Electron"
  | "WPF"
  | "WinForms"
  | "Custom"
  | "Unknown";
export const PLATFORM: { [key: string]: PLATFORM } = {
  JAVA: "Java",
  OBJECTIVE_C_SWIFT: "Objective-C-Swift",
  REACT_NATIVE: "React-Native",
  UWP: "UWP",
  XAMARIN: "Xamarin",
  CORDOVA: "Cordova",
  UNITY: "Unity",
  ELECTRON: "Electron",
  WPF: "WPF",
  WINFORMS: "WinForms",
  CUSTOM: "Custom",
  UNKNOWN: "Unknown",
};
export const readablePlatform: { [k in PLATFORM]: string } = {
  Java: "Java",
  "Objective-C-Swift": "Objective-C or Swift",
  "React-Native": "React Native",
  UWP: "UWP",
  Xamarin: "Xamarin",
  Cordova: "Cordova",
  Unity: "Unity",
  Electron: "Electron",
  WPF: "WPF",
  WinForms: "WinForms",
  Custom: "Custom",
  Unknown: "an unsupported platform",
};

/**
 * App owner types
 */
export const APP_OWNER_TYPES = {
  USER: "user",
  ORG: "org",
};

/**
 * Collaborator roles
 * The roles for users that are in the 'Colloborator' group.
 * This type is used in places where 'tester' role shouldn't be
 * (i.e. showing a list of roles to choose from when we're adding a user to the 'Collaborator' group).
 */
export type CollaboratorRole = "manager" | "developer" | "viewer";
export const ALL_COLLABORATOR_ROLES = ["manager", "developer", "viewer"];

/**
 * App roles
 *
 * Apps returned by API can contain these roles in member_permissions property.
 * The 'tester' role is used only to identify Tester apps among others.
 * The 'tester' role is assigned to the users that are in a Distribution group, but not in the 'Collaborator' group
 */
export type AppRole = CollaboratorRole | "tester";

/**
 * App filter roles
 *
 * These roles are used to filter apps on My Apps page.
 */
export type AppFilterRole = "collaborator" | "tester";
export const ALL_APP_FILTER_ROLES = ["collaborator", "tester"];

type UserPermissions = {
  user_id: string;
  permissions: AppRole[];
};

export interface IPlatform {
  displayName: string;
  value: PLATFORM;
  supportedOSs: string[];
}

export interface IPlatforms {
  [index: string]: IPlatform;
}

export const PLATFORMS: IPlatforms = {
  JAVA: {
    displayName: "Java / Kotlin",
    value: PLATFORM.JAVA,
    supportedOSs: [OS.ANDROID],
  },
  OBJECTIVE_C_SWIFT: {
    displayName: "Objective-C / Swift",
    value: PLATFORM.OBJECTIVE_C_SWIFT,
    supportedOSs: [OS.IOS, OS.MACOS, OS.TVOS],
  },
  REACT_NATIVE: {
    displayName: "React Native",
    value: PLATFORM.REACT_NATIVE,
    supportedOSs: [OS.ANDROID, OS.IOS],
  },
  CORDOVA: {
    displayName: "Cordova",
    value: PLATFORM.CORDOVA,
    supportedOSs: [OS.ANDROID, OS.IOS],
  },
  UWP: {
    displayName: "UWP",
    value: PLATFORM.UWP,
    supportedOSs: [OS.WINDOWS],
  },
  WPF: {
    displayName: "WPF",
    value: PLATFORM.WPF,
    supportedOSs: [OS.WINDOWS],
  },
  WINFORMS: {
    displayName: "WinForms",
    value: PLATFORM.WINFORMS,
    supportedOSs: [OS.WINDOWS],
  },
  XAMARIN: {
    displayName: "Xamarin",
    value: PLATFORM.XAMARIN,
    supportedOSs: [OS.ANDROID, OS.IOS, OS.TIZEN, OS.MACOS],
  },
  UNITY: {
    displayName: "Unity",
    value: PLATFORM.UNITY,
    supportedOSs: [OS.ANDROID, OS.IOS, OS.WINDOWS],
  },
  ELECTRON: {
    displayName: "Electron",
    value: PLATFORM.ELECTRON,
    supportedOSs: [OS.MACOS, OS.WINDOWS, OS.LINUX],
  },
  CUSTOM: {
    displayName: "Custom",
    value: PLATFORM.CUSTOM,
    supportedOSs: [OS.CUSTOM],
  },
  UNKNOWN: {
    displayName: "Unknown",
    value: PLATFORM.UNKNOWN,
    supportedOSs: [],
  },
};

// Supported os/platform combinations in App Center for HA apps
export const SUPPORTED_OS_AND_PLATFORMS_FOR_SxS = {
  [OS.IOS]: [PLATFORM.OBJECTIVE_C_SWIFT, PLATFORM.XAMARIN, PLATFORM.REACT_NATIVE, PLATFORM.UNKNOWN],
  [OS.ANDROID]: [PLATFORM.JAVA, PLATFORM.XAMARIN, PLATFORM.REACT_NATIVE, PLATFORM.UNKNOWN],
  [OS.WINDOWS]: [PLATFORM.UWP, PLATFORM.UNKNOWN, PLATFORM.WINFORMS, PLATFORM.WPF],
};

// All os/platform combinations used in migrate-app panel for HA apps
export const ALL_OS_AND_PLATFORMS_FOR_SxS = {
  [OS.IOS]: [PLATFORMS.OBJECTIVE_C_SWIFT, PLATFORMS.XAMARIN, PLATFORMS.REACT_NATIVE, PLATFORMS.CORDOVA, PLATFORMS.UNITY],
  [OS.ANDROID]: [PLATFORMS.JAVA, PLATFORMS.XAMARIN, PLATFORMS.REACT_NATIVE, PLATFORMS.CORDOVA, PLATFORMS.UNITY],
  [OS.WINDOWS]: [PLATFORMS.UWP, PLATFORMS.ELECTRON, PLATFORMS.UNITY, PLATFORMS.WINFORMS, PLATFORMS.WPF],
  [OS.MACOS]: [PLATFORMS.OBJECTIVE_C_SWIFT, PLATFORMS.ELECTRON],
  [OS.LINUX]: [PLATFORMS.ELECTRON],
};

// All supported platforms for code push
export const SUPPORTED_PLATFORMS_FOR_CODEPUSH = {
  [OS.IOS]: [PLATFORMS.REACT_NATIVE, PLATFORMS.CORDOVA],
  [OS.ANDROID]: [PLATFORMS.REACT_NATIVE, PLATFORMS.CORDOVA],
  [OS.WINDOWS]: [PLATFORMS.REACT_NATIVE, PLATFORMS.CORDOVA],
  [OS.MACOS]: [PLATFORMS.ELECTRON],
  [OS.LINUX]: [PLATFORMS.ELECTRON],
};

export const SUPPORTED_OS_FOR_CODEPUSH = [OS.IOS, OS.ANDROID, OS.WINDOWS, OS.MACOS, OS.LINUX];
export const SUPPORTED_OS_FOR_HOCKEYAPP = [OS.IOS, OS.ANDROID, OS.WINDOWS, OS.MACOS, OS.TVOS, OS.CUSTOM];
