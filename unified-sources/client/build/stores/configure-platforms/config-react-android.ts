import { observable, action, computed } from "mobx";

import { RepoStore } from "../repo-store";
import { BranchData } from "./config-base";
import { ConfigurePlatformAndroid } from "./config-android";
import { IAHBranchConfiguration } from "@root/data/build";
import { isSelectNodeVersionEnabled } from "@root/build/utils/feature-flag-helper";

// ReactNative is built on top of native Android, so we'll just subclass
export class ConfigurePlatformReactAndroid extends ConfigurePlatformAndroid {
  @observable
  public selectedPackageJsonPath?: string;

  @observable
  public noProjectsFound: boolean = false;

  @observable
  public javascriptRunTests: boolean = false;

  @observable
  public reactNativeVersion?: string;

  @observable
  public nodeVersion?: string;

  @observable
  public hasNvmrc: boolean = false;

  private static packageJsonSortFn(a: string, b: string): number {
    // Sort by top-level file path first, listing files at the top of the tree first
    const aLevel = a.split("/").length;
    const bLevel = b.split("/").length;
    if (aLevel !== bLevel) {
      return aLevel - bLevel;
    }
    return a.localeCompare(b);
  }

  @computed
  public get sortedPackageJsonPaths(): string[] {
    if (!this.analysisResult || !this.analysisResult.javascript) {
      return [];
    }

    const solutions = this.analysisResult.javascript && this.analysisResult.javascript.javascriptSolutions;
    if (solutions) {
      return solutions.map((solution) => solution.packageJsonPath).sort(ConfigurePlatformReactAndroid.packageJsonSortFn);
    }

    // keep this for safe deployment, remove after api-service is updated in all environments
    const paths = this.analysisResult.javascript && this.analysisResult.javascript.packageJsonPaths;
    if (paths) {
      return paths.sort(ConfigurePlatformReactAndroid.packageJsonSortFn);
    }
    return [];
  }

  constructor(repoStore: RepoStore) {
    super(repoStore);
  }

  private getAndroidModulePathForPackageJsonPath(packageJsonPath: string): string | undefined {
    if (!packageJsonPath.endsWith("package.json")) {
      return;
    }

    const packageDirectory = packageJsonPath.substring(0, packageJsonPath.length - "package.json".length);
    const androidDirectory = packageDirectory + "android";
    const modules = this.analysisResult && this.analysisResult.android && this.analysisResult.android.androidModules;
    if (!modules) {
      return undefined;
    }

    const androidModule = modules.find(
      (androidModule) =>
        androidModule && androidModule.gradleWrapperPath && androidModule.gradleWrapperPath.startsWith(androidDirectory)
    );
    return androidModule && androidModule.path;
  }

  @action
  public selectModuleByPath(modulePath?: string) {
    if (!modulePath) {
      this.selectedBuildConfiguration = undefined;
      this.selectedModule = undefined;
      this.gradleWrapperPath = undefined;
      return;
    }

    const selectedModule = this.sortedAndroidModules.find((value) => value.path === modulePath);

    this.selectedModule = selectedModule;
    if (selectedModule) {
      this.gradleWrapperPath = selectedModule.gradleWrapperPath;

      if (
        selectedModule &&
        this.selectedBuildVariant &&
        this.buildVariantsForSelectedModule &&
        this.buildVariantsForSelectedModule.indexOf(this.selectedBuildVariant) === -1
      ) {
        const defaultBuildConfiguration = this.getDefaultBuildConfiguration(selectedModule);
        if (defaultBuildConfiguration) {
          this.selectBuildConfigurationByName(defaultBuildConfiguration.name);
        }
      }
    } else {
      this.selectedBuildConfiguration = undefined;
      this.gradleWrapperPath = undefined;
    }
  }

  @action
  public selectPackageJsonByPath(packageJson: string) {
    const javascriptSolution = ConfigurePlatformReactAndroid.getJavaScriptSolutionForPackageJsonPath(packageJson, this.analysisResult);
    if (javascriptSolution) {
      this.selectedPackageJsonPath = javascriptSolution.packageJsonPath;
      this.reactNativeVersion = javascriptSolution.reactNativeVersion;
      this.hasNvmrc = Boolean(javascriptSolution.nvmrcPath);
    } else {
      // keep this for safe deployment, remove after api-service is updated in all environments
      this.selectedPackageJsonPath = packageJson;
    }

    const androidModulePath = this.getAndroidModulePathForPackageJsonPath(this.selectedPackageJsonPath);
    this.selectModuleByPath(androidModulePath);
  }

  @action
  public setJavascriptRunTests(value: boolean) {
    this.javascriptRunTests = value;
  }

  @action
  public setNodeVersion(value: string) {
    this.nodeVersion = value;
  }

  @action
  public onBranchConfigurationPreLoaded(branchData: BranchData) {
    super.onBranchConfigurationPreLoaded(branchData);
    this.selectPackageJsonByBranchConfiguration(branchData);
  }

  @action
  public onAllBranchDataAvailable(branchData: BranchData) {
    super.onAllBranchDataAvailable(branchData);

    const emptyConfig = !branchData.config;
    if (emptyConfig) {
      const packages = this.sortedPackageJsonPaths;
      if (packages.length > 0) {
        this.selectPackageJsonByPath(packages[0]);
      } else {
        this.noProjectsFound = true;
      }

      if (isSelectNodeVersionEnabled()) {
        const currentNodeVersion =
          branchData.nodeVersionsStore && branchData.nodeVersionsStore.isLoaded && branchData.nodeVersionsStore.currentVersion;
        this.nodeVersion = currentNodeVersion ? currentNodeVersion.name : undefined;
      }
    } else {
      this.selectPackageJsonByBranchConfiguration(branchData);

      if (isSelectNodeVersionEnabled()) {
        const reactProps = branchData.config && branchData.config.toolsets && branchData.config.toolsets.javascript;
        this.nodeVersion = reactProps && reactProps.nodeVersion;
      }
    }
  }

  private selectPackageJsonByBranchConfiguration(branchData: BranchData): void {
    if (branchData && branchData.config && branchData.config.toolsets && branchData.config.toolsets.javascript) {
      const jsToolset = branchData.config.toolsets.javascript;

      const useFakeOptions = !branchData.projectsStore || !branchData.projectsStore.isLoaded;
      if (useFakeOptions) {
        this.selectedPackageJsonPath = jsToolset.packageJsonPath;
      } else {
        this.javascriptRunTests = !!jsToolset.runTests;
        if (jsToolset.packageJsonPath) {
          this.selectPackageJsonByPath(jsToolset.packageJsonPath);
        }
      }
    }
  }

  @computed
  public get isValid(): boolean {
    // :( can't use super cause it's a prop
    const androidValid: boolean =
      !!this.analysisResult && !!this.selectedModule && !!this.selectedBuildVariant && !!this.gradleWrapperPath;
    if (!androidValid) {
      return false;
    }
    if (!this.selectedPackageJsonPath) {
      return false;
    }

    if (!this.isSigningValid()) {
      return false;
    }

    if (isSelectNodeVersionEnabled()) {
      if (!this.nodeVersion || (this.nodeVersion === "nvmrc" && !this.hasNvmrc)) {
        return false;
      }
    }

    return true;
  }

  public save(config: IAHBranchConfiguration, telemetry?: Object): void {
    super.save(config, telemetry);

    const nodeProps = { nodeVersion: this.nodeVersion };

    config.toolsets.javascript = {
      packageJsonPath: this.selectedPackageJsonPath,
      runTests: this.javascriptRunTests,
      reactNativeVersion: this.reactNativeVersion,
      ...(isSelectNodeVersionEnabled() ? nodeProps : {}),
    };
  }
}
