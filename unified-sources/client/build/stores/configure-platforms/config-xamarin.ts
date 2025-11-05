import { observable, action, computed } from "mobx";
import { values, keys } from "lodash";
import { RepoStore } from "../repo-store";
import {
  IToolsetProjects,
  IMsBuildSolution,
  IAHBranchConfiguration,
  IMSBuildConfiguration,
  IMSBuildConfigurationMap,
  IOSTargetPlatform,
  AndroidBundleStore,
  IosAppExtensionInfo,
  IXamarinSDKBundle,
  IXcodeVersion,
} from "@root/data/build";
import { OS } from "@lib/common-interfaces";
import { ciStore } from "../../stores/ci-store";
import { ConfigurePlatformCommon, ConfigureMessage, BranchData } from "./config-base";
import { ConfigurePlatformXcode } from "./config-xcode";
import { ConfigurePlatformAndroid } from "./config-android";
import { logger } from "@root/lib/telemetry";

// Xamarin has common properties for both iOS + Android, so we'll with compose the two
export class ConfigurePlatformXamarin extends ConfigurePlatformCommon implements AndroidBundleStore {
  @observable
  public selectedSolution?: IMsBuildSolution;

  @observable
  public selectedConfiguration?: string;

  @observable
  public noSolutionsFound: boolean = false;

  @observable
  private analysisResult?: IToolsetProjects;

  @observable
  public selectedMonoVersion?: string;

  @observable
  public selectedSDKBundle?: string;

  @observable
  public selectedSymlink?: string;

  @observable
  private buildBundleSaved?: boolean;

  @observable
  private buildBundle: boolean = false;

  @computed
  public get selectedAppExtensions(): IosAppExtensionInfo[] {
    return (this.selectedSolution && this.selectedSolution.appExtensionTargets) || [];
  }

  @computed
  public get buildBundleEnabled(): boolean {
    return !this.buildBundleNotSupported && this.buildBundle;
  }

  @computed
  public get buildBundleNotSupported(): boolean {
    // mono version 6.0 comes with Xamarin 9.4 which is required for AAB
    return !!this.selectedMonoVersion && parseFloat(this.selectedMonoVersion) < 6.0;
  }

  @action
  public setBuildBundle = (value: boolean) => {
    logger.info("build/configure/aab/toggled", {
      value,
    });
    this.buildBundle = value;
  };

  @computed
  // @ts-ignore
  public get signingEnabled(): boolean {
    const signingHandler = this.ios || this.android;
    if (!signingHandler) {
      return false;
    }
    return signingHandler.signingEnabled;
  }

  public set signingEnabled(value: boolean) {
    // ignore, ConfigurePlatformCommon fails if this isn't here
  }

  @computed
  public get noConfigurationsFound(): boolean {
    if (!this.analysisResult) {
      // do not show warning until all solutions are loaded
      return false;
    }

    const configurations = this.selectedSolution && this.selectedSolution.configurations;
    return !configurations || configurations.length === 0;
  }

  @action
  public setSigningEnabled(value: boolean) {
    const signingHandler = this.ios || this.android;
    if (!signingHandler) {
      return;
    }
    signingHandler.setSigningEnabled(value);
  }

  public get isSimulatorBuild(): boolean {
    return this._isSimulatorBuild;
  }

  @action
  public setSimulatorBuild(simulator: boolean) {
    this._isSimulatorBuild = simulator;
    if (!simulator && this.isIos) {
      this.setSigningEnabled(true);
    }
  }

  @computed
  public get sortedSolutions(): IMsBuildSolution[] {
    if (!this.analysisResult || !this.analysisResult.xamarin) {
      return [];
    }

    let solutions = this.analysisResult.xamarin && this.analysisResult.xamarin.xamarinSolutions;
    if (solutions) {
      // parse list of configurations "<configuration_name>|<target_platform>" into map and save in solution
      solutions = solutions.map((solution, i) => {
        const configurationsWithPlatform = solution.configurations.reduce((map, configuration) => {
          const [name, platform] = configuration.split("|");
          if (!platform) {
            // handle old API response
            map[name] = {
              name,
              platforms: ["iPhone", "iPhoneSimulator"],
            };
          } else {
            if (map[name]) {
              map[name].platforms.push(platform as IOSTargetPlatform);
            } else {
              map[name] = {
                name,
                platforms: [platform as IOSTargetPlatform],
              };
            }
          }
          return map;
        }, {} as IMSBuildConfigurationMap);
        return {
          ...solution,
          configurations: keys(configurationsWithPlatform),
          configurationsWithPlatform,
        };
      });

      return solutions.sort(ConfigurePlatformCommon.projectSortFn);
    }
    return [];
  }

  @computed
  public get solutionConfigurations(): IMSBuildConfiguration[] {
    const solution = this.selectedSolution;
    if (solution && solution.configurationsWithPlatform) {
      return values<IMSBuildConfiguration>(solution.configurationsWithPlatform);
    }
    return [];
  }

  @computed
  public get selectedConfigurationSupportsDevice(): boolean {
    return this.selectedConfigurationSupportsPlatform("iPhone");
  }

  @computed
  public get selectedConfigurationSupportsEmulator(): boolean {
    return this.selectedConfigurationSupportsPlatform("iPhoneSimulator");
  }

  private selectedConfigurationSupportsPlatform(platform: IOSTargetPlatform): boolean {
    if (this.selectedConfiguration && this.selectedSolution && this.selectedSolution.configurationsWithPlatform) {
      const configurationWithPlatforms = this.selectedSolution.configurationsWithPlatform[this.selectedConfiguration];
      if (!configurationWithPlatforms || !configurationWithPlatforms.platforms) {
        return true;
      }
      return configurationWithPlatforms.platforms.indexOf(platform) !== -1;
    }

    return true;
  }

  @computed
  public get defaultConfigurationIsDevice(): boolean {
    if (this.selectedConfiguration && this.selectedSolution && this.selectedSolution.defaultConfiguration) {
      const tokens = this.selectedSolution.defaultConfiguration.split("|");
      if (tokens.length === 2) {
        return tokens[1] === "iPhone";
      }
    }

    // if there is no information about platform in default configuration, just use value that is already set
    return !this.isSimulatorBuild;
  }

  @computed
  public get defaultPlatform(): string | undefined {
    if (this.selectedConfiguration && this.selectedSolution) {
      if (this.selectedSolution.defaultPlatform) {
        return this.selectedSolution.defaultPlatform;
      }
      if (this.selectedSolution.defaultConfiguration) {
        const tokens = this.selectedSolution.defaultConfiguration.split("|");
        if (tokens.length === 2) {
          return tokens[1];
        }
      }
    }

    return;
  }

  @computed
  get usesAndroidSharedRuntime(): boolean {
    if (!(this.selectedSolution && this.selectedConfiguration)) {
      return false;
    }

    if (!(this.defaultPlatform && this.selectedSolution.properties)) {
      return false;
    }

    const properties = this.selectedSolution.properties.find(
      (p) => p.configuration === this.selectedConfiguration && p.platform === this.defaultPlatform
    );

    if (!properties) {
      return false;
    }

    return !!properties.androidUseSharedRuntime;
  }

  @observable private _isSimulatorBuild: boolean = false;

  public readonly ios?: ConfigurePlatformXcode;
  public readonly android?: ConfigurePlatformAndroid;

  private get isIos(): boolean {
    return !!this.ios;
  }

  private get isAndroid(): boolean {
    return !!this.android;
  }

  constructor(repoStore: RepoStore) {
    super(repoStore);
    if (repoStore.app) {
      switch (repoStore.app.os) {
        case OS.IOS:
          this.ios = new ConfigurePlatformXcode(repoStore);
          break;
        case OS.ANDROID:
          this.android = new ConfigurePlatformAndroid(repoStore);
          break;
      }
    }
  }

  private getDefaultConfiguration(solution?: IMsBuildSolution): string | undefined {
    if (!solution) {
      return;
    }

    if (solution.defaultConfiguration) {
      return solution.defaultConfiguration.split("|")[0];
    }

    if (solution.configurations && solution.configurations.length) {
      return solution.configurations[0];
    }

    return;
  }

  @action
  public selectSolutionByPath(solutionPath: string) {
    const selectedProject = this.sortedSolutions.find((value) => {
      return value.path === solutionPath;
    });

    if (this.isIos && this.ios) {
      // store extension targets for selected solution in xcode toolset store
      this.ios.setAppExtensions((selectedProject && selectedProject.appExtensionTargets) || []);
    }

    this.selectedSolution = selectedProject;
    this.selectedConfiguration = this.getDefaultConfiguration(selectedProject);
    if (this.isAndroid) {
      this.setupAndroidBundle();
    }
  }

  @action
  public selectConfigurationByName(configuration: string) {
    this.selectedConfiguration = configuration;
    // set valid build type
    if (this.ios) {
      if (!this.selectedConfigurationSupportsDevice) {
        this.setSimulatorBuild(true);
      }
      if (!this.selectedConfigurationSupportsEmulator) {
        this.setSimulatorBuild(false);
      }
    }
    this.setupAndroidBundle();
  }

  @action
  public setupAndroidBundle() {
    if (this.buildBundleSaved === null && this.selectedSolution && this.selectedConfiguration && this.selectedSolution.properties) {
      const properties = this.selectedSolution.properties.find((config) => config.configuration === this.selectedConfiguration);
      if (properties) {
        this.buildBundle = properties.androidPackageFormat === "aab";
      }
    }
  }

  @action
  public selectMonoVersion(version: string) {
    this.selectedMonoVersion = version;
    this.selectProperXcodeVersionIfFiltered();
  }

  private findCompatibleXcodeVersion(xcodeVersions: IXcodeVersion[], currentSDKBundle: IXamarinSDKBundle): string | undefined {
    const currentXcodeVersion = xcodeVersions.find((xcode) => xcode.current);
    if (currentXcodeVersion && currentXcodeVersion.name && currentSDKBundle.xcodeVersions.includes(currentXcodeVersion.name)) {
      return currentXcodeVersion.name;
    }
    return xcodeVersions
      .map((xcode) => xcode.name)
      .filter((name) => !name.includes("beta"))
      .find((name) => currentSDKBundle.xcodeVersions.includes(name));
  }

  private selectProperXcodeVersionIfFiltered() {
    if (!this.selectedSDKBundle) {
      return;
    }

    const xcodeProps = this.ios;
    const selectedXcodeVersion = xcodeProps && xcodeProps.selectedXcodeVersion;
    if (!selectedXcodeVersion) {
      return;
    }

    const currentSDKBundle =
      ciStore.currentXamarinSDKBundlesStore &&
      ciStore.currentXamarinSDKBundlesStore.data &&
      ciStore.currentXamarinSDKBundlesStore.data.find((item) => item.sdkBundle === this.selectedSDKBundle);
    if (!currentSDKBundle) {
      return;
    }

    if (currentSDKBundle.xcodeVersions.includes(selectedXcodeVersion)) {
      return;
    }

    const latestStableCompatibleXcode =
      ciStore.currentXcodeVersionsStore &&
      ciStore.currentXcodeVersionsStore.data &&
      this.findCompatibleXcodeVersion(ciStore.currentXcodeVersionsStore.data, currentSDKBundle);
    if (!latestStableCompatibleXcode) {
      return;
    }

    if (xcodeProps) {
      xcodeProps.selectXcodeVersion(latestStableCompatibleXcode);
    }
  }

  @action
  public selectSDKBundle(value: string) {
    this.selectedSymlink = value.split(";")[2];
    this.selectedSDKBundle = value.split(";")[1];
    this.selectMonoVersion(value.split(";")[0]);
  }

  @action
  public onBranchConfigurationPreLoaded(branchData: BranchData) {
    super.onBranchConfigurationPreLoaded(branchData);
    const signingHandler = this.ios || this.android;

    if (signingHandler) {
      signingHandler.onBranchConfigurationPreLoaded(branchData);
    }

    const config = branchData.config;

    if (config && config.toolsets && config.toolsets.xamarin) {
      const xamarinToolset = config.toolsets.xamarin;

      this._isSimulatorBuild = xamarinToolset.isSimBuild;

      if (!xamarinToolset.sdkBundle) {
        if (branchData.sdkBundlesStore && branchData.sdkBundlesStore.data && branchData.sdkBundlesStore.data.length > 0) {
          const sdkBundle = branchData.sdkBundlesStore.data.find((a) => a.current);
          if (sdkBundle) {
            this.selectedSymlink = sdkBundle.symlink;
            this.selectedSDKBundle = sdkBundle.sdkBundle;
            this.selectedMonoVersion = sdkBundle.monoVersion;
          }
        }
      } else {
        this.selectedSymlink = xamarinToolset.symlink;
        this.selectedSDKBundle = xamarinToolset.sdkBundle;
        this.selectedMonoVersion = xamarinToolset.monoVersion;
      }

      this.buildBundleSaved = xamarinToolset.buildBundle;
      this.buildBundle = !!xamarinToolset.buildBundle;

      const useFakeOptions = !branchData.projectsStore || !branchData.projectsStore.isLoaded;
      if (useFakeOptions) {
        const fakeSolution: IMsBuildSolution = {
          path: xamarinToolset.slnPath,
          configurations: [xamarinToolset.configuration],
        };
        this.selectedSolution = fakeSolution;
        this.selectedConfiguration = xamarinToolset.configuration;
        if (this.isAndroid) {
          this.setupAndroidBundle();
        }
      } else {
        this.selectSolutionByPath(xamarinToolset.slnPath);
        this.selectConfigurationByName(xamarinToolset.configuration);
      }
    } else {
      const sdkBundle =
        branchData.sdkBundlesStore && branchData.sdkBundlesStore.data && branchData.sdkBundlesStore.data.find((a) => a.current);
      if (sdkBundle) {
        this.selectedSymlink = sdkBundle.symlink;
        this.selectedSDKBundle = sdkBundle.sdkBundle;
        this.selectedMonoVersion = sdkBundle.monoVersion;
      }
      this._isSimulatorBuild = this.isIos;
    }
  }

  @action
  public onAllBranchDataAvailable(branchData: BranchData) {
    if (branchData.projectsStore && branchData.projectsStore.isLoaded) {
      this.analysisResult = branchData.projectsStore.data;
    }
    // make sure all our props are properly set
    if (!branchData.wasPreloaded) {
      this.onBranchConfigurationPreLoaded(branchData);
    }

    const emptyConfig = !branchData.config;

    if (!emptyConfig) {
      if (this.isIos && this.ios) {
        // prepopulate upload stores for extension targets
        this.ios.setAppExtensionProvisioningProfileFiles(branchData);
      }

      // re-populate the selectors
      const selectedConfiguration = this.selectedConfiguration;
      if (this.selectedSolution) {
        this.selectSolutionByPath(this.selectedSolution.path);
      }
      if (selectedConfiguration) {
        this.selectConfigurationByName(selectedConfiguration);
      }
    }

    // this.selectedSolution will be undefined if project name was renamed for existing build configuration
    if (emptyConfig || !this.selectedSolution) {
      const solutions = this.sortedSolutions;
      if (solutions.length > 0) {
        this.selectSolutionByPath(solutions[0].path);
        if (this.ios) {
          this.setSimulatorBuild(!this.defaultConfigurationIsDevice);
        }
      }
      this.noSolutionsFound = solutions.length === 0;

      if (this.ios && branchData.xcodeVersionsStore && branchData.xcodeVersionsStore.isLoaded && !this.ios.selectedXcodeVersion) {
        this.ios.selectedXcodeVersion =
          branchData.xcodeVersionsStore.currentVersion && branchData.xcodeVersionsStore.currentVersion.name;
      }

      if (
        branchData.sdkBundlesStore &&
        branchData.sdkBundlesStore.isLoaded &&
        branchData.sdkBundlesStore.data &&
        branchData.sdkBundlesStore.data.length > 0
      ) {
        if (!this.selectedSDKBundle) {
          const sdkBundle = branchData.sdkBundlesStore.data.find((a) => a.current);
          if (sdkBundle) {
            this.selectedSymlink = sdkBundle.symlink;
            this.selectedSDKBundle = sdkBundle.sdkBundle;
            this.selectedMonoVersion = sdkBundle.monoVersion;
          }
        }

        if (this.isIos && this.ios) {
          const xcodeVersion = this.getLatestStableCompatibleXcode(branchData);
          if (xcodeVersion) {
            this.ios.selectXcodeVersion(xcodeVersion);
          }
        }
      }
    }
  }

  private getLatestStableCompatibleXcode(branchData: BranchData): string | undefined {
    if (
      branchData.sdkBundlesStore &&
      branchData.sdkBundlesStore.isLoaded &&
      branchData.sdkBundlesStore.data &&
      branchData.xcodeVersionsStore &&
      branchData.xcodeVersionsStore.isLoaded &&
      branchData.xcodeVersionsStore.data
    ) {
      const sdkBundle = branchData.sdkBundlesStore.data.find((a) => a.current);
      return sdkBundle && this.findCompatibleXcodeVersion(branchData.xcodeVersionsStore.data, sdkBundle);
    }
    return;
  }

  @computed
  public get isValid(): boolean {
    const buildValid: boolean =
      !!this.selectedSolution && !!this.selectedConfiguration && !!this.selectedSDKBundle && !!this.selectedMonoVersion;

    if (!buildValid) {
      return false;
    }

    const signingHandler = this.ios || this.android;

    if (this.android && this.android.signingEnabled) {
      if (
        !this.android.keystoreUploadStore.isValid ||
        !this.android.keystorePassword ||
        !this.android.keyAlias ||
        !this.android.keyPassword
      ) {
        return false;
      }
    }

    if (!signingHandler || !signingHandler.isSigningValid()) {
      return false;
    }

    return true;
  }

  public save(config: IAHBranchConfiguration, telemetry?: Object): void {
    super.save(config, telemetry);

    if (this.selectedSolution) {
      config.toolsets.xamarin = {
        args: undefined,
        configuration: this.selectedConfiguration || "",
        slnPath: this.selectedSolution.path,
        isSimBuild: this.isSimulatorBuild,
        buildBundle: !this.buildBundleNotSupported && this.buildBundle,
        symlink: this.selectedSymlink,
        sdkBundle: this.selectedSDKBundle,
        monoVersion: this.selectedMonoVersion,
      };
    }

    if (this.isIos && this.ios) {
      config.toolsets.xcode = {
        projectOrWorkspacePath: undefined,
        scheme: undefined,
        xcodeVersion: this.ios.selectedXcodeVersion || "",
      };
      this.ios.setSigningProperties(config);
    } else {
      if (this.android && this.android.signingEnabled) {
        config.toolsets.android = {};
        this.android.setSigningProperties(config);
      }
    }

    if (telemetry) {
      telemetry["xamarin-is-signed"] = this.signingEnabled;
      telemetry["xamarin-sdk-bundle"] = this.selectedSDKBundle;
      telemetry["mono-version"] = this.selectedMonoVersion;
    }
  }

  public signMessage(): ConfigureMessage | undefined {
    if (!this.signToggleVisible()) {
      return { type: "info", message: "Device builds must be signed." };
    }
    return undefined;
  }

  public signToggleVisible(): boolean {
    if (this.isIos) {
      return this.isSimulatorBuild;
    }
    return true;
  }

  public signToggleDisabled(): boolean {
    if (this.isIos) {
      return !this.isSimulatorBuild;
    }
    return false;
  }

  public testToggleDisabled(): boolean {
    if (this.isIos) {
      return this.isSimulatorBuild;
    }
    if (this.android) {
      if (this.usesAndroidSharedRuntime) {
        return true;
      }
      // android normally allows non-signed builds to be tested
      return this.android.testToggleDisabled();
    }
    return super.testToggleDisabled();
  }

  public testMessage(): ConfigureMessage | undefined {
    if (this.isIos && this.isSimulatorBuild) {
      return { type: "error", message: "Simulator builds cannot be tested." };
    }
    if (this.android && this.usesAndroidSharedRuntime) {
      return { type: "error", message: "Not compatible with solutions using Android Shared Runtime." };
    }
    return super.testMessage();
  }

  public distributeToggleDisabled(): boolean {
    if (this.isIos) {
      return this.isSimulatorBuild;
    }
    return super.distributeToggleDisabled();
  }

  public distributeMessage(): ConfigureMessage | undefined {
    if (this.isIos && this.isSimulatorBuild) {
      return { type: "error", message: "Simulator builds cannot be distributed." };
    }
    return super.distributeMessage();
  }
}
