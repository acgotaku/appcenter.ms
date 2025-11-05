import { observable, action, computed } from "mobx";

import { KeystoreUploadStore } from "../encoded-file-upload-store";

import { RepoStore } from "../repo-store";
import {
  IToolsetProjects,
  IAndroidModule,
  IAHBranchConfiguration,
  IAndroidBranchConfigurationProperties,
  AndroidBundleStore,
  IAndroidBuildConfiguration,
} from "@root/data/build";
import { ConfigurePlatformCommon, ConfigureMessage, BranchData } from "./config-base";
import { logger } from "@root/lib/telemetry";

export class ConfigurePlatformAndroid extends ConfigurePlatformCommon implements AndroidBundleStore {
  public readonly keystoreUploadStore: KeystoreUploadStore;

  @observable
  public selectedModule?: IAndroidModule;

  @observable
  public selectedBuildConfiguration?: IAndroidBuildConfiguration;

  @observable
  public noModulesFound: boolean = false;

  @observable
  public gradleWrapperPath?: string;

  @observable
  public signingIsAutomatic: boolean = false;

  @observable
  public keystorePassword?: string;

  @observable
  public keyAlias?: string;

  @observable
  public keyPassword?: string;

  @observable
  public runTests: boolean = false;

  @observable
  public runLinter: boolean = false;

  @observable
  private buildBundleSaved?: boolean;

  @observable
  private buildBundle: boolean = false;

  @computed
  public get buildBundleEnabled(): boolean {
    return this.buildBundle;
  }

  @observable protected analysisResult?: IToolsetProjects;

  public static moduleSortFn(a: IAndroidModule, b: IAndroidModule): number {
    return a.name.localeCompare(b.name);
  }

  @computed
  public get sortedAndroidModules(): IAndroidModule[] {
    if (!this.analysisResult || !this.analysisResult.android) {
      return [];
    }

    const modules = this.analysisResult.android && this.analysisResult.android.androidModules;
    if (modules) {
      return modules.sort(ConfigurePlatformAndroid.moduleSortFn);
    }
    return [];
  }

  @computed
  public get selectedBuildVariant(): string | undefined {
    return this.selectedBuildConfiguration && this.selectedBuildConfiguration.name;
  }

  @computed
  public get buildVariantsForSelectedModule(): string[] {
    if (this.selectedModule && this.selectedModule.buildConfigurations) {
      return this.selectedModule.buildConfigurations.map((conf) => conf.name);
    }

    return [];
  }

  constructor(repoStore: RepoStore) {
    super(repoStore);

    this.keystoreUploadStore = new KeystoreUploadStore();
  }

  protected getDefaultBuildConfiguration(moduleInfo: IAndroidModule | undefined): IAndroidBuildConfiguration | undefined {
    if (!moduleInfo || !moduleInfo.buildConfigurations || moduleInfo.buildConfigurations.length === 0) {
      return;
    }
    const buildConfigurations = moduleInfo.buildConfigurations;

    // Default to the first release variant in the list, if there is one
    const releaseVariant = buildConfigurations.find((variant) => {
      return /release$/i.test(variant.name);
    });

    // If there's no release variant, default to first variant in the list
    if (releaseVariant) {
      return releaseVariant;
    } else {
      return buildConfigurations[0];
    }
  }

  @action
  public selectModuleByName(moduleName: string) {
    const selectedModule = this.sortedAndroidModules.find((value) => {
      return value.name === moduleName;
    });

    this.selectedModule = selectedModule;
    this.selectedBuildConfiguration = this.getDefaultBuildConfiguration(selectedModule);
    if (this.buildBundleSaved === null) {
      // allow setting default value only if branch configuration not yet saved
      this.buildBundle = !!selectedModule && !!selectedModule.hasBundle;
    }
  }

  public isDebugVariant(variantName: string | undefined): boolean {
    if (!variantName) {
      return false;
    }
    return /debug$/i.test(variantName);
  }

  @action
  public selectBuildConfigurationByName(buildVariant: string) {
    this.selectedBuildConfiguration = this.getBuildConfigurationByName(buildVariant);

    const disableSigning = this.isDebugVariant(buildVariant) && this.signingEnabled;
    if (disableSigning) {
      this.signingEnabled = false;
    }
  }

  @action
  public setKeystorePassword(value: string) {
    this.keystorePassword = value;
  }

  @action
  public setKeyAlias(value: string) {
    this.keyAlias = value;
  }

  @action
  public setKeyPassword(value: string) {
    this.keyPassword = value;
  }

  @action
  public setRunTests(value: boolean) {
    this.runTests = value;
  }

  @action
  public setRunLinter(value: boolean) {
    this.runLinter = value;
  }

  @action
  public setAutomaticSigning(value: boolean) {
    this.signingIsAutomatic = value;
  }

  @action
  public setBuildBundle = (value: boolean) => {
    logger.info("build/configure/aab/toggled", {
      value,
    });
    this.buildBundle = value;
  };

  @action
  public onBranchConfigurationPreLoaded(branchData: BranchData) {
    super.onBranchConfigurationPreLoaded(branchData);
    const config = branchData.config;

    if (config && config.toolsets && config.toolsets.android) {
      const androidToolset = config.toolsets.android;

      this.runTests = !!androidToolset.runTests;
      this.runLinter = !!androidToolset.runLint;

      // we need to store this before updating upload store
      const hasKeystore = androidToolset.keystoreFilename && !this.keystoreUploadStore.hasFile;
      if (androidToolset.keystoreFilename && !this.keystoreUploadStore.hasFile) {
        // setInfoOnlyFilename sets "keystoreUploadStore.hasFile" to true
        this.keystoreUploadStore.setInfoOnlyFilename(androidToolset.keystoreFilename);
        this.keystoreUploadStore.passwordChanged(androidToolset.keystorePassword);
      }

      if (androidToolset.keystorePassword) {
        this.keystorePassword = androidToolset.keystorePassword;
      }
      if (androidToolset.keyAlias) {
        this.keyAlias = androidToolset.keyAlias;
      }
      if (androidToolset.keyPassword) {
        this.keyPassword = androidToolset.keyPassword;
      }
      if (androidToolset.automaticSigning) {
        this.signingIsAutomatic = true;
      }

      if (
        hasKeystore ||
        androidToolset.keystorePassword ||
        androidToolset.keyAlias ||
        androidToolset.keyPassword ||
        androidToolset.automaticSigning
      ) {
        this.signingEnabled = true;
      }

      this.buildBundleSaved = androidToolset.buildBundle;
      this.buildBundle = !!androidToolset.buildBundle;

      const useFakeOptions = !branchData.projectsStore || !branchData.projectsStore.isLoaded;
      if (useFakeOptions) {
        const fakeBuildConfiguration = androidToolset.buildVariant ? { name: androidToolset.buildVariant, signingConfig: null } : null;
        const fakeBuildConfigurations: IAndroidBuildConfiguration[] = fakeBuildConfiguration ? [fakeBuildConfiguration] : [];
        const fakeModule: IAndroidModule = {
          name: androidToolset.module || "",
          buildConfigurations: fakeBuildConfigurations,
        };

        this.selectedModule = fakeModule;
        this.selectedBuildConfiguration = fakeBuildConfigurations[0];
      } else {
        if (androidToolset.module) {
          this.selectModuleByName(androidToolset.module);
        }
        if (androidToolset.buildVariant) {
          this.selectBuildConfigurationByName(androidToolset.buildVariant);
        }
      }
    }
  }

  @action
  public onAllBranchDataAvailable(branchData: BranchData) {
    if (branchData.projectsStore && branchData.projectsStore.isLoaded) {
      this.analysisResult = branchData.projectsStore.data;

      // Set backward compatibility for old approach where buildConfigurations didn't exist
      const androidModules = this.analysisResult && this.analysisResult.android && this.analysisResult.android.androidModules;
      if (androidModules) {
        androidModules.forEach((androidModule) => {
          if (!androidModule.buildConfigurations && androidModule.buildVariants) {
            androidModule.buildConfigurations = androidModule.buildVariants.map(this.mapBuildVariantToBuildConfiguration);
          }
        });
      }
    }
    // make sure all our props are properly set
    if (!branchData.wasPreloaded) {
      this.onBranchConfigurationPreLoaded(branchData);
    }

    if (this.analysisResult && this.analysisResult.android) {
      this.gradleWrapperPath = this.analysisResult.android.gradleWrapperPath;
    }

    const emptyConfig = !branchData.config;
    if (!emptyConfig) {
      // re-populate the selectors with the analyzed data
      const buildConfiguration = this.selectedBuildConfiguration;
      if (this.selectedModule) {
        this.selectModuleByName(this.selectedModule.name);
      }
      if (buildConfiguration) {
        this.selectBuildConfigurationByName(buildConfiguration.name);
      }
    }

    // this.selectedModule will be undefined if project name was renamed for existing build configuration
    if (emptyConfig || !this.selectedModule) {
      const modules = this.sortedAndroidModules;
      if (modules.length > 0) {
        this.selectModuleByName(modules[0].name);
      } else {
        this.noModulesFound = true;
      }
    }
  }

  public isSigningValid(): boolean {
    if (this.signingEnabled) {
      if (!this.signingIsAutomatic) {
        if (!this.keystoreUploadStore.isValid && !this.keystorePassword && !this.keyAlias && !this.keyPassword) {
          return false;
        }
      }
    }

    return true;
  }

  @computed
  public get isValid(): boolean {
    const buildValid: boolean =
      !!this.analysisResult && !!this.selectedModule && !!this.selectedBuildVariant && !!this.gradleWrapperPath;
    if (!buildValid) {
      return false;
    }

    if (!this.isSigningValid()) {
      return false;
    }

    return true;
  }

  public save(config: IAHBranchConfiguration, telemetry?: Object): void {
    super.save(config, telemetry);

    const androidProps: IAndroidBranchConfigurationProperties = {
      gradleWrapperPath:
        this.selectedModule && this.selectedModule.gradleWrapperPath ? this.selectedModule.gradleWrapperPath : this.gradleWrapperPath,
      module: this.selectedModule && this.selectedModule.name,
      buildBundle: this.buildBundle,
      buildVariant: this.selectedBuildVariant,
      isRoot: this.selectedModule && this.selectedModule.isRoot,
      runTests: this.runTests,
      runLint: this.runLinter,
    };

    config.toolsets.android = androidProps;

    this.setSigningProperties(config);

    if (telemetry) {
      telemetry["android-code-signing"] = this.signingEnabled;
      telemetry["android-automatic-signing"] = this.signingIsAutomatic;
    }
  }

  public setSigningProperties(config: IAHBranchConfiguration): void {
    if (this.signingEnabled && config.toolsets.android) {
      if (!this.signingIsAutomatic) {
        config.toolsets.android.keystorePassword = this.keystorePassword;
        config.toolsets.android.keyAlias = this.keyAlias;
        config.toolsets.android.keyPassword = this.keyPassword;

        if (this.keystoreUploadStore.isValid) {
          if (this.keystoreUploadStore.hasFile && !!this.keystoreUploadStore.fileEncoded) {
            config.toolsets.android.keystoreEncoded = this.keystoreUploadStore.fileEncoded;
          }
          config.toolsets.android.keystoreFilename = this.keystoreUploadStore.fileName;
        }
      } else {
        config.toolsets.android.automaticSigning = true;
      }
    }
  }

  public testToggleDisabled(): boolean {
    // this would normally be based on this.signingEnabled
    return false;
  }

  public signToggleDisabled(): boolean {
    return this.isDebugVariant(this.selectedBuildVariant);
  }

  public signMessage(): ConfigureMessage | undefined {
    if (this.isDebugVariant(this.selectedBuildVariant)) {
      return { type: "info", message: "Debug build variants cannot be signed." };
    }
    return super.signMessage();
  }

  private getBuildConfigurationByName(name: string): IAndroidBuildConfiguration | undefined {
    if (this.selectedModule && this.selectedModule.buildConfigurations) {
      return this.selectedModule.buildConfigurations.find((conf) => conf.name === name);
    }
  }

  private mapBuildVariantToBuildConfiguration(name: string): IAndroidBuildConfiguration {
    return {
      name,
      signingConfig: null,
    };
  }
}
