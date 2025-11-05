import { observable, action, computed, when } from "mobx";

import { ciStore } from "./ci-store";
import { RepoStore } from "./repo-store";
import { ProjectsStore } from "./projects-store";
import { BranchConfigurationStore } from "./branch-configuration-store";
import { XcodeVersionsStore } from "./xcode-versions-store";
import { XamarinSDKBundlesStore } from "./xamarin-sdk-bundles-store";
import { NodeVersionsStore } from "./node-versions-store";

import { IApp, OS, PLATFORMS } from "@lib/common-interfaces";

import { appStore } from "@root/stores";
import {
  ICardsState,
  ConfigureBuildCard,
  ConfigureSignCard,
  ConfigureTestCard,
  ConfigureDistributeCard,
  ConfigureAdvancedCard,
  ConfigureCustomVariablesCard,
} from "./configure-platforms/card-state-stores";
import { ConfigurePlatformHandler, ConfigurePlatformCommon, BranchData } from "./configure-platforms/config-base";
import { ConfigurePlatformAndroid } from "./configure-platforms/config-android";
import { ConfigurePlatformXcode } from "./configure-platforms/config-xcode";
import { ConfigurePlatformReactAndroid } from "./configure-platforms/config-react-android";
import { ConfigurePlatformReactIos } from "./configure-platforms/config-react-ios";
import { ConfigurePlatformUwp } from "./configure-platforms/config-uwp";
import { ConfigurePlatformXamarin } from "./configure-platforms/config-xamarin";
import { ConfigurePlatformTest } from "./configure-platforms/config-testcloud";
import { ConfigurePlatformDistribute } from "./configure-platforms/config-distribute";
import { ConfigurePlatformAdvanced } from "./configure-platforms/config-advanced";
import { ConfigurePlatformCustomVariables } from "./configure-platforms/config-custom-variables";
import { IAHBranchConfiguration } from "@root/data/build";
import { FetchError } from "@root/lib/http/fetch-error";
import { IXcodeVersion } from "@root/data/build";

import { isSelectNodeVersionEnabled } from "../utils/feature-flag-helper";

interface IReactProps {
  readonly sortedPackageJsonPaths: string[];
  readonly selectedPackageJsonPath?: string;
  readonly noProjectsFound: boolean;
  readonly javascriptRunTests: boolean;
  readonly reactNativeVersion?: string;
  readonly nodeVersion?: string;
  readonly hasNvmrc: boolean;

  selectPackageJsonByPath(path: string);
  setJavascriptRunTests(value: boolean);
  setNodeVersion(value: string);
}

export interface ConfigureStoreProp {
  configureStore?: ConfigureStore;
  empty?: boolean;
  loading?: boolean;
  limitExceededRepoType?: string;
}

export class ConfigureStore {
  public readonly app: IApp;
  public readonly branchName: string;

  private readonly primaryHandler?: ConfigurePlatformCommon;
  private readonly handlers: ConfigurePlatformHandler[] = [];

  constructor(app: IApp, branchName: string) {
    this.app = { ...app };
    this.branchName = branchName;

    switch (this.app.os) {
      case OS.IOS:
      case OS.MACOS:
        this.xcodeVersionsStore = ciStore.setCurrentXcodeVersionsStore(this.app, true);

        switch (this.app.platform) {
          case PLATFORMS.XAMARIN.value:
            this.primaryHandler = this.common = this.xamarin = new ConfigurePlatformXamarin(this.repoStore);
            this.xcode = this.xamarin.ios;
            break;
          case PLATFORMS.REACT_NATIVE.value:
            this.primaryHandler = this.common = this.react = this.xcode = new ConfigurePlatformReactIos(this.repoStore);
            break;
          default:
            this.primaryHandler = this.common = this.xcode = new ConfigurePlatformXcode(this.repoStore);
            break;
        }
        break;
      case OS.ANDROID:
        switch (this.app.platform) {
          case PLATFORMS.XAMARIN.value:
            this.primaryHandler = this.common = this.xamarin = new ConfigurePlatformXamarin(this.repoStore);
            this.android = this.xamarin.android;
            break;
          case PLATFORMS.REACT_NATIVE.value:
            this.primaryHandler = this.common = this.react = this.android = new ConfigurePlatformReactAndroid(this.repoStore);
            break;
          default:
            this.primaryHandler = this.common = this.android = new ConfigurePlatformAndroid(this.repoStore);
            break;
        }
        break;
      case OS.WINDOWS:
        this.primaryHandler = this.common = this.uwp = new ConfigurePlatformUwp(this.repoStore);
        break;
    }

    if (this.app.platform === PLATFORMS.XAMARIN.value) {
      this.sdkBundlesStore = ciStore.setCurrentXamarinSDKBundlesStore(this.app, true);
    }

    if (this.app.platform === PLATFORMS.REACT_NATIVE.value && isSelectNodeVersionEnabled()) {
      this.nodeVersionsStore = ciStore.setCurrentNodeVersionsStore(this.app, true);
    }

    this.testcloud = new ConfigurePlatformTest(this.repoStore, this.primaryHandler);
    this.distribute = new ConfigurePlatformDistribute(this.repoStore, this.primaryHandler);
    this.advanced = new ConfigurePlatformAdvanced(this.repoStore);
    this.customVariables = new ConfigurePlatformCustomVariables(this.repoStore);

    if (this.primaryHandler) {
      this.handlers.push(this.primaryHandler, this.testcloud, this.distribute, this.advanced, this.customVariables);
    }

    this.cardsState.build = new ConfigureBuildCard(this.app, this.primaryHandler);
    this.cardsState.sign = new ConfigureSignCard(this.app, this.primaryHandler);
    this.cardsState.test = new ConfigureTestCard(this.app, this.testcloud);
    this.cardsState.distribute = new ConfigureDistributeCard(this.app, this.distribute);
    this.cardsState.advanced = new ConfigureAdvancedCard(this.app, this.advanced);
    this.cardsState.customVariables = new ConfigureCustomVariablesCard(this.app, this.customVariables);
  }

  @observable
  public updatingExistingConfiguration: boolean = false;

  public cardsState: ICardsState = {
    build: undefined,
    sign: undefined,
    test: undefined,
    distribute: undefined,
    advanced: undefined,
    customVariables: undefined,
  };

  public readonly common?: ConfigurePlatformCommon;
  public readonly xcode?: ConfigurePlatformXcode;
  public readonly android?: ConfigurePlatformAndroid;
  public readonly xamarin?: ConfigurePlatformXamarin;
  public readonly react?: ConfigurePlatformHandler & IReactProps;
  public readonly uwp?: ConfigurePlatformUwp;

  public readonly distribute?: ConfigurePlatformDistribute;
  public readonly testcloud?: ConfigurePlatformTest;
  public readonly advanced?: ConfigurePlatformAdvanced;
  public readonly customVariables?: ConfigurePlatformCustomVariables;

  @computed
  public get isBranchAnalyzed(): boolean {
    if (!this.hasProjectsStore) {
      return false;
    }
    return !!this.projectsStore && this.projectsStore.isLoaded;
  }

  public get advancedBuildSettingsExpandable(): boolean {
    return false;
  }

  @computed
  public get currentConfigurationValid(): boolean {
    return this.handlers.every((h) => h.isValid);
  }

  @computed
  public get buildBundleEnabled(): boolean {
    if (appStore.app) {
      if (appStore.app.isXamarinApp) {
        return !!this.xamarin && this.xamarin.buildBundleEnabled;
      } else if (appStore.app.isAndroidJavaApp || appStore.app.isAndroidReactNativeApp) {
        return !!this.android && this.android.buildBundleEnabled;
      }
    }
    return false;
  }

  private branchDetailsAwaiterDisposer: any;
  private branchConfigAwaiterDisposer: any;
  private branchAnalysisAwaiterDisposer: any;
  private allBranchDataAwaiterDisposer: any;
  private distributionDependenciesAwaiterDisposer: any;

  private loadedConfiguration?: IAHBranchConfiguration;
  private xcodeVersionsStore?: XcodeVersionsStore;
  private sdkBundlesStore?: XamarinSDKBundlesStore;
  private nodeVersionsStore?: NodeVersionsStore;
  @observable private hasProjectsStore: boolean = false;
  private projectsStore?: ProjectsStore;

  @action
  public load(quickSetup?: boolean): void {
    if (this.xcodeVersionsStore && (this.app.os === OS.IOS || this.app.os === OS.MACOS)) {
      this.xcodeVersionsStore.refreshOptimistically();
    }
    if (this.sdkBundlesStore && this.app.platform === PLATFORMS.XAMARIN.value) {
      this.sdkBundlesStore.refreshOptimistically();
    }

    if (this.nodeVersionsStore && this.app.platform === PLATFORMS.REACT_NATIVE.value && isSelectNodeVersionEnabled()) {
      this.nodeVersionsStore.refreshOptimistically();
    }

    const branchConfigurationStore = this.branchConfigurationStore;

    if (quickSetup) {
      if (this.repoStore) {
        this.repoStore.setCurrentBranch(this.branchName);
      }

      const currentBranchStatus = ciStore.currentRepoStore && ciStore.currentRepoStore.currentBranchStatus;
      if (currentBranchStatus && ciStore.currentRepoStore) {
        const projectsStore = ciStore.currentRepoStore.setCurrentProjectsStore(this.branchName);
        const sha = currentBranchStatus.branch && currentBranchStatus.branch.commit.sha;
        if (sha) {
          projectsStore.fetchForCommit(sha);
        }
      }
    }

    // if branch config is already loaded then refresh it in the foreground just in case someone changed the repo
    if (
      branchConfigurationStore &&
      branchConfigurationStore.isLoaded &&
      branchConfigurationStore.branch === this.branchName &&
      (branchConfigurationStore.lastFetchToNow() || 0) > 300 * 1000
    ) {
      branchConfigurationStore.fetch();
    }

    if (this.repoStore) {
      const { distributionGroupsStore, distributionStoresStore } = this.repoStore;

      if (distributionGroupsStore) {
        distributionGroupsStore.refreshOptimistically();
      }

      if (distributionStoresStore) {
        distributionStoresStore.refreshOptimistically();
      }
    }

    this.dispose(); // clear any current awaiters

    this.branchDetailsAwaiterDisposer = when(this.branchDetailsReady, this.onBranchDetailsLoaded, { name: "branchDetailsAwaiter" });
    this.branchConfigAwaiterDisposer = when(this.branchConfigurationReady, this.onBranchConfigurationLoaded, {
      name: "branchConfigAwaiter",
    });

    if (this.distribute) {
      when(this.distributionDependenciesReady, this.distribute.checkDistributionType, { name: "distributionDependenciesAwaiter" });
    }
  }

  public projectsNotFound(): boolean {
    if (!this.projectsStore) {
      return false;
    }
    const toolsets = this.projectsStore.data;
    if (this.projectsStore.isPending) {
      return false;
    }
    if (this.projectsStore.isFailed) {
      return true;
    }
    // detect that projects list is empty per platform
    switch (this.app.platform) {
      case PLATFORMS.XAMARIN.value:
        return !(toolsets && toolsets.xamarin && toolsets.xamarin.xamarinSolutions && toolsets.xamarin.xamarinSolutions.length > 0);
      case PLATFORMS.REACT_NATIVE.value:
        return !(
          toolsets &&
          toolsets.javascript &&
          ((toolsets.javascript.packageJsonPaths && toolsets.javascript.packageJsonPaths.length > 0) ||
            (toolsets.javascript.javascriptSolutions && toolsets.javascript.javascriptSolutions.length > 0))
        );
    }
    switch (this.app.os) {
      case OS.IOS:
      case OS.MACOS:
        return !(
          toolsets &&
          toolsets.xcode &&
          toolsets.xcode.xcodeSchemeContainers &&
          toolsets.xcode.xcodeSchemeContainers.length > 0
        );
      case OS.ANDROID:
        return !(toolsets && toolsets.android && toolsets.android.androidModules && toolsets.android.androidModules.length > 0);
      case OS.WINDOWS:
        return !(toolsets && toolsets.uwp && toolsets.uwp.uwpSolutions && toolsets.uwp.uwpSolutions.length > 0);
    }

    return false;
  }

  public projectsLimitExceededRepoType(): string | null {
    if (!this.projectsStore || !this.projectsStore.isFailed) {
      return null;
    }
    if (!this.projectsStore.error || (this.projectsStore.error as FetchError).status !== 403) {
      return null;
    }
    return (this.repoStore.data && this.repoStore.data.type) || null;
  }

  public get appPlatformName(): string | null {
    if (this.app.os === OS.MACOS) {
      return "macOS";
    }
    switch (this.app.platform) {
      case PLATFORMS.XAMARIN.value:
        return `Xamarin ${this.app.os}`;
      case PLATFORMS.REACT_NATIVE.value:
        return `React Native ${this.app.os}`;
      case PLATFORMS.JAVA.value:
        return "Android";
      case PLATFORMS.OBJECTIVE_C_SWIFT.value:
        return `${this.app.os} Objective-C/Swift`;
      case PLATFORMS.UWP.value:
        return "UWP";
    }
    return null;
  }

  public dispose(): void {
    if (this.branchDetailsAwaiterDisposer) {
      this.branchDetailsAwaiterDisposer();
      this.branchConfigAwaiterDisposer = null;
    }
    if (this.branchConfigAwaiterDisposer) {
      this.branchConfigAwaiterDisposer();
      this.branchConfigAwaiterDisposer = null;
    }
    if (this.branchAnalysisAwaiterDisposer) {
      this.branchAnalysisAwaiterDisposer();
      this.branchAnalysisAwaiterDisposer = null;
    }
    if (this.allBranchDataAwaiterDisposer) {
      this.allBranchDataAwaiterDisposer();
      this.allBranchDataAwaiterDisposer = null;
    }
    if (this.distributionDependenciesAwaiterDisposer) {
      this.distributionDependenciesAwaiterDisposer();
      this.distributionDependenciesAwaiterDisposer = null;
    }
  }

  public saveConfiguration(telemetry: Object): IAHBranchConfiguration {
    let config: IAHBranchConfiguration = {
      id: undefined,
      branch: undefined,
      toolsets: {},
      environmentVariables: [],
    };

    this.handlers.forEach((h) => h.save(config, telemetry));

    // remove all null properties because when swagger defines a type, sending `null` is considered invalid
    const replaceNull = (key, value) => {
      if (value === null) {
        return undefined;
      }
      return value;
    };
    config = JSON.parse(JSON.stringify(config, replaceNull));

    return config;
  }

  public onSaveConfigurationError(error: any): void {
    this.handlers.forEach((h) => h.onSaveError(error));
  }

  private get repoStore(): RepoStore {
    return ciStore.getRepoStore(this.app.id!)!;
  }

  private get branchConfigurationStore(): BranchConfigurationStore | undefined {
    const repoStore = this.repoStore;
    return repoStore && repoStore.getBranchConfigurationStore(this.branchName);
  }

  private branchDetailsReady = (): boolean => {
    const repoStore = this.repoStore;
    const status = repoStore && repoStore.currentBranchStatus;
    return !!status && !!status.branch && status.branch.name === this.branchName;
  };

  @action
  public onBranchDetailsLoaded = (): void => {
    this.projectsStore = this.repoStore.setCurrentProjectsStore(this.branchName);
    this.hasProjectsStore = true;

    // analyze this branch at this commit
    const lastCommit =
      this.repoStore.currentBranchStatus &&
      this.repoStore.currentBranchStatus.branch &&
      this.repoStore.currentBranchStatus.branch.commit.sha;
    if (lastCommit) {
      this.projectsStore.fetchForCommit(lastCommit);
    }

    this.branchAnalysisAwaiterDisposer = when(
      () => {
        return !!this.projectsStore && !this.projectsStore.isPending;
      },
      this.onBranchAnalysisFinished,
      { name: "branchAnalysisAwaiter" }
    );

    this.allBranchDataAwaiterDisposer = when(
      () => {
        return !!this.projectsStore && !this.projectsStore.isPending && this.branchConfigurationReady();
      },
      this.onAllBranchDataReady,
      { name: "allBranchDataAwaiter" }
    );
  };

  private onBranchAnalysisFinished = () => {
    if (this.projectsStore) {
      this.handlers.forEach((h) => h.onBranchAnalysisFinished(this.projectsStore!));
    }
  };

  public branchConfigurationReady = (): boolean => {
    const repoStore = this.repoStore;
    const currentBranchConfigurationStore = this.branchConfigurationStore;
    const currentBranchStatus = repoStore && repoStore.currentBranchStatus;

    if (this.app.os === OS.IOS || this.app.os === OS.MACOS) {
      // also wait for xcode versions to load
      if (!this.xcodeVersionsStore || !this.xcodeVersionsStore.isLoaded) {
        return false;
      }
    }

    if (this.app.platform === PLATFORMS.XAMARIN.value) {
      if (!this.sdkBundlesStore || !this.sdkBundlesStore.isLoaded) {
        return false;
      }
    }

    if (this.app.platform === PLATFORMS.REACT_NATIVE.value && isSelectNodeVersionEnabled()) {
      if (!this.nodeVersionsStore || !this.nodeVersionsStore.isLoaded) {
        return false;
      }
    }

    if (
      (currentBranchStatus && !currentBranchStatus.configured) ||
      (currentBranchConfigurationStore && currentBranchConfigurationStore.isLoaded)
    ) {
      return true;
    }

    return false;
  };

  public distributionDependenciesReady = () => {
    if (!this.repoStore) {
      return false;
    }
    const { distributionGroupsStore, distributionStoresStore } = this.repoStore;
    return distributionGroupsStore.isLoaded && distributionStoresStore.isLoaded;
  };

  private filterXcodeForIOS = (xcodeVersion: string, isXcodePreview: boolean): boolean => {
    return true;
  };

  private filterXcodeForMacOS = (xcodeVersion: string, isXcodePreview: boolean): boolean => {
    const isXcode8X = xcodeVersion.startsWith("8.");
    return !isXcode8X;
  };

  private filterXcodeForXamarin = (xcodeVersion: string, xamarin: ConfigurePlatformXamarin): boolean => {
    const { selectedSymlink } = xamarin;

    if (!selectedSymlink) {
      return false;
    }

    const currentBundleRaw =
      this.sdkBundlesStore && this.sdkBundlesStore.data && this.sdkBundlesStore.data.find((item) => item.symlink === selectedSymlink);
    const compatibleXcodeVersions = currentBundleRaw && currentBundleRaw.xcodeVersions;

    return !!compatibleXcodeVersions && compatibleXcodeVersions.includes(xcodeVersion);
  };

  private filterXcodeForReactNative = (xcodeVersion: string, isXcodePreview: boolean, latestXcodeVersion: string): boolean => {
    return true;
  };

  // NOTE: when updating this filter, please also update the related selection rules
  // in /client-portal/client/build/stores/configure-platforms/config-xamarin.ts
  // in ConfigurePlatformXamarin.selectProperXcodeVersionIfFiltered() method
  public xcodeVersionsFilter = (value: IXcodeVersion, index: number, array: IXcodeVersion[]) => {
    // filter out Xcode versions if selected Xamarin.iOS doesn't support them
    const xcodeVersion = value && value.name;
    const isXcodePreview = xcodeVersion.includes("beta");

    if (!xcodeVersion) {
      return false;
    }

    const isIOS = this.app.os === OS.IOS && this.app.platform === PLATFORMS.OBJECTIVE_C_SWIFT.value;
    const isMacOS = this.app.os === OS.MACOS;
    const isXamarin = this.app.platform === PLATFORMS.XAMARIN.value;
    const isReactNative = this.app.platform === PLATFORMS.REACT_NATIVE.value;

    if (isIOS) {
      return this.filterXcodeForIOS(xcodeVersion, isXcodePreview);
    }

    if (isMacOS) {
      return this.filterXcodeForMacOS(xcodeVersion, isXcodePreview);
    }

    if (isXamarin) {
      return !!this.xamarin && this.filterXcodeForXamarin(xcodeVersion, this.xamarin);
    }

    if (isReactNative) {
      const latestXcodeVersion = array && array[0] && array[0].name;
      return this.filterXcodeForReactNative(xcodeVersion, isXcodePreview, latestXcodeVersion);
    }

    return true;
  };

  private configPreloaded: boolean = false;
  private branchConfigLoadedRan: boolean = false;

  @action
  private onBranchConfigurationLoaded = (): void => {
    if (this.branchConfigLoadedRan) {
      return;
    }
    this.branchConfigLoadedRan = true;

    if (this.branchConfigurationStore && this.branchConfigurationStore.isLoaded) {
      this.loadedConfiguration = this.branchConfigurationStore.data || undefined;
      this.updatingExistingConfiguration = true;
    } else {
      this.loadedConfiguration = undefined;
    }

    const projectsStoreLoaded = this.projectsStore && !this.projectsStore.isPending;
    if (!projectsStoreLoaded) {
      const branchData: BranchData = {
        config: this.loadedConfiguration,
        projectsStore: undefined,
        xcodeVersionsStore: this.xcodeVersionsStore,
        sdkBundlesStore: this.sdkBundlesStore,
        nodeVersionsStore: this.nodeVersionsStore,
      };
      this.configPreloaded = true;
      this.handlers.forEach((h) => h.onBranchConfigurationPreLoaded(branchData));
    }
  };

  private onAllBranchDataReady = () => {
    if (!this.branchConfigLoadedRan) {
      // there's no guarantee in mobx that this was already called, even though
      // the branch config `when` is created sooner
      this.onBranchConfigurationLoaded();
    }

    const branchData: BranchData = {
      config: this.loadedConfiguration,
      projectsStore: this.projectsStore,
      xcodeVersionsStore: this.xcodeVersionsStore,
      sdkBundlesStore: this.sdkBundlesStore,
      nodeVersionsStore: this.nodeVersionsStore,
      wasPreloaded: this.configPreloaded,
    };
    this.handlers.forEach((h) => h.onAllBranchDataAvailable(branchData));
  };
}
