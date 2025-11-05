import { computed, observable, set, action } from "mobx";
import {
  Origin,
  BeaconName,
  IApp,
  IAppOwner,
  AppRole,
  SUPPORTED_OS_AND_PLATFORMS_FOR_SxS,
  OS,
  PLATFORM,
  readablePlatform,
  APP_OWNER_TYPES,
  PLATFORMS,
  CollaboratorRole,
  ICategory,
  CategoryName,
} from "@lib/common-interfaces";
import { Model } from "../../lib";
import { SerializedAzureSubscription } from "@root/data/management/models/azure-subscription";
import { userStore } from "@root/stores/user-store";
import { appSupport } from "../utils/app-support";
import { organizationStore } from "@root/stores/organization-store";
import { Organization } from "./organization";
import { User } from "@root/data/shell/models/user";
import { teamAppStore, TeamAppAssociation } from "@root/data/management/stores/team-app-store";
import { capitalize } from "lodash";

export class App extends Model<IApp> implements IApp {
  /* Set up in controller */
  @observable public id!: string;
  @observable public app_secret?: string;
  @observable public azure_subscription?: SerializedAzureSubscription;
  @observable public description?: string;
  @observable public release_type?: string;
  @observable public display_name?: string;
  @observable public feature_flags?: string[];
  @observable public repositories?: { repo_url: string; repo_provider: string }[];
  @observable public name?: string;
  @observable public icon_url?: string;
  @observable public icon_source?: string;
  @observable public os!: OS;
  @observable public readonly owner!: IAppOwner | Readonly<User> | Readonly<Organization>;
  @observable public platform!: PLATFORM;
  @observable public member_permissions?: AppRole[];
  @observable public origin?: Origin;
  @observable public created_at?: string;
  @observable public updated_at?: string;
  @observable public microsoft_internal?: boolean;
  @observable public cutover_from_hockeyapp_at?: string;
  @observable public application_category?: ICategory;

  constructor(app?: IApp) {
    const { owner = null, ...rest } = app || {};
    super(rest || {});
    if (owner) {
      this.setOwner(owner);
    }
  }

  @computed
  public get internalId() {
    return App.internalAppId(this.owner.name, this.name);
  }

  @action
  public setOwner(owner: IAppOwner) {
    // Casts to any so as to preserve `owner` being readonly externally,
    // only setting through this method.
    if (owner.type === APP_OWNER_TYPES.ORG) {
      (this as any).owner = organizationStore.find(owner.name) || owner;
    } else if (!!userStore.currentUser.id && owner.id === userStore.currentUser.id) {
      (this as any).owner = userStore.currentUser;
    } else {
      (this as any).owner = owner;
    }
  }

  @action
  public setMemberPermissions(permissions: AppRole[]): void {
    set(this, { member_permissions: permissions });
  }

  public static internalAppId(ownerName: string, appName?: string) {
    return `${ownerName}|${appName}`.toLowerCase();
  }

  @computed
  get humanReadablePlatform(): string {
    const platform = Object.values(PLATFORMS).find((item) => item.value === this.platform);
    return platform && platform.displayName ? platform.displayName : this.platform;
  }

  @computed
  get isOrgApp(): boolean {
    return this.owner && this.owner.type === APP_OWNER_TYPES.ORG;
  }

  @computed
  get isUserApp(): boolean {
    return this.owner && this.owner.type === APP_OWNER_TYPES.USER;
  }

  @computed
  get isOwnedByCurrentUser(): boolean {
    return this.owner.name === userStore.currentUser.name;
  }

  @computed
  get isCreatedInCodePush(): boolean {
    return this.origin === Origin.CodePush;
  }

  @computed
  get isCreatedInAppCenter(): boolean {
    return this.origin === Origin.MobileCenter || this.origin === Origin.AppCenter;
  }

  @computed
  get isCreatedInTestCloud(): boolean {
    return this.origin === Origin.TestCloud;
  }

  @computed
  get isMicrosoftInternal(): boolean {
    return !!this.microsoft_internal;
  }

  @computed
  get isSupportedUnderSxS(): boolean {
    const os = SUPPORTED_OS_AND_PLATFORMS_FOR_SxS[this.os];

    if (!os) {
      return false;
    }
    return os.includes(this.platform);
  }

  @computed
  get isTizenApp(): boolean {
    return this.os === OS.TIZEN;
  }

  @computed
  get isWindowsApp(): boolean {
    return this.os === OS.WINDOWS;
  }

  @computed
  get isLinuxApp(): boolean {
    return this.os === OS.LINUX;
  }

  @computed
  get isUwpApp(): boolean {
    return this.platform === PLATFORM.UWP;
  }

  @computed
  get isWPFApp(): boolean {
    return this.platform === PLATFORM.WPF;
  }

  @computed
  get isWinFormsApp(): boolean {
    return this.platform === PLATFORM.WINFORMS;
  }

  @computed
  get isReactNativeApp(): boolean {
    return this.platform === PLATFORM.REACT_NATIVE;
  }

  @computed
  get isCordovaApp(): boolean {
    return this.platform === PLATFORM.CORDOVA;
  }

  @computed
  get isUnityApp(): boolean {
    return this.platform === PLATFORM.UNITY;
  }

  @computed
  get isIosOrAndroidUnityApp(): boolean {
    return this.isUnityIosApp || this.isUnityAndroidApp;
  }

  @computed
  get isElectronApp(): boolean {
    return this.platform === PLATFORM.ELECTRON;
  }

  @computed
  get isUnityAndroidApp(): boolean {
    return this.os === OS.ANDROID && this.platform === PLATFORM.UNITY;
  }

  @computed
  get isUnityIosApp(): boolean {
    return this.os === OS.IOS && this.platform === PLATFORM.UNITY;
  }

  @computed
  get isAppleApp(): boolean {
    return this.os === OS.IOS || this.os === OS.MACOS || this.os === OS.TVOS;
  }

  @computed
  get isIosApp(): boolean {
    return this.os === OS.IOS;
  }

  @computed
  get isIosReactNativeApp(): boolean {
    return this.os === OS.IOS && this.platform === PLATFORM.REACT_NATIVE;
  }

  @computed
  get isAndroidApp(): boolean {
    return this.os === OS.ANDROID;
  }

  @computed
  get isAndroidJavaApp(): boolean {
    return this.os === OS.ANDROID && this.platform === PLATFORM.JAVA;
  }

  @computed
  get isAndroidReactNativeApp(): boolean {
    return this.os === OS.ANDROID && this.platform === PLATFORM.REACT_NATIVE;
  }

  @computed
  get isMacOSApp(): boolean {
    return this.os === OS.MACOS;
  }

  @computed
  get isTvOSApp(): boolean {
    return this.os === OS.TVOS;
  }

  @computed
  get isXamarinApp(): boolean {
    return this.platform === PLATFORMS.XAMARIN.value;
  }

  @computed
  get isCustomApp(): boolean {
    return this.os === OS.CUSTOM;
  }

  @computed
  get isProguardCapable(): boolean {
    return (
      this.os === OS.ANDROID &&
      (this.platform === PLATFORM.JAVA ||
        this.platform === PLATFORM.REACT_NATIVE ||
        this.platform === PLATFORM.CORDOVA ||
        this.platform === PLATFORM.UNITY)
    );
  }

  /**
   * Returns true if the app is supported because CodePush supports it, but otherwise App Center doesn't have
   * explict support for the platform/os combo. This is currently true for React Native Windows apps
   * (which have neither a App Center SDK nor App Center build support currently).
   */
  @computed
  get isCodePushCapableButLimitedOtherSupport(): boolean {
    return this.platform === PLATFORM.REACT_NATIVE && this.os === OS.WINDOWS;
  }

  @computed
  get isAnUnconfiguredApp(): boolean {
    return this.platform === PLATFORM.UNKNOWN;
  }

  @computed
  get isAnIosAppWithUnknownPlatform(): boolean {
    return this.os === OS.IOS && this.platform === PLATFORM.UNKNOWN;
  }

  @computed
  get isAnAndroidAppWithUnknownPlatform(): boolean {
    return this.os === OS.ANDROID && this.platform === PLATFORM.UNKNOWN;
  }

  @computed
  get isSupported(): boolean {
    if (this.isTizenApp) {
      return true;
    } else {
      // TODO: for now enable all apps created under MC, CodePush or XTC
      // Later, we might need to created a finer support matrix for the CodePush origin once the dust settles on the specs.
      return this.isCreatedInAppCenter || this.isCreatedInCodePush || this.isCreatedInTestCloud;
    }
  }

  @computed
  get ownerFriendlyName(): string {
    return this.owner.display_name || this.owner.name;
  }

  @computed
  get friendlyName() {
    return this.display_name || this.name;
  }

  @computed
  get friendlyPlatform() {
    return readablePlatform[this.platform];
  }

  @computed
  get isAppWhitelisted(): boolean {
    return (
      !!this.application_category &&
      [CategoryName.FirstParty, CategoryName.ThirdParty].includes(this.application_category.category_name)
    );
  }

  @computed
  get isAppFirstParty(): boolean {
    return !!this.application_category && this.application_category.category_name === CategoryName.FirstParty;
  }

  @computed
  get appCategory(): ICategory | undefined {
    return this.application_category;
  }

  public isSupportedForBeacon(beaconName: BeaconName | null | undefined): boolean {
    return appSupport.isSupported(this, beaconName);
  }

  public getTeamAssociation(organizationName: string, teamName: string): TeamAppAssociation | undefined {
    return teamAppStore.get([organizationName, teamName].join("/"), this.internalId);
  }

  public getTeamRole(organizationName: string, teamName: string): CollaboratorRole | undefined {
    const teamAssociation = this.getTeamAssociation(organizationName, teamName);
    if (teamAssociation) {
      return teamAssociation.permissions;
    }
  }

  public getHumanReadableTeamRole(organizationName: string, teamName: string): string {
    return capitalize(this.getTeamRole(organizationName, teamName) || "");
  }
}
