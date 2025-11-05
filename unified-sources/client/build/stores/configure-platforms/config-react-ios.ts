import { observable, action, computed } from "mobx";
import { logger } from "@root/lib/telemetry";
import { RepoStore } from "../repo-store";
import { XcodeVersionsStore } from "../xcode-versions-store";
import { BranchData } from "./config-base";
import { ConfigurePlatformXcode } from "./config-xcode";
import { IAHBranchConfiguration } from "@root/data/build";
import { isSelectNodeVersionEnabled } from "@root/build/utils/feature-flag-helper";

export class ConfigurePlatformReactIos extends ConfigurePlatformXcode {
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

  private getProperXcodeVersion(rawCurrentXcodeVersion: string, xcodeVersionsStore: XcodeVersionsStore): string {
    return xcodeVersionsStore.data && xcodeVersionsStore.data.find((v) => v.name === rawCurrentXcodeVersion)
      ? rawCurrentXcodeVersion
      : xcodeVersionsStore.currentVersion
      ? xcodeVersionsStore.currentVersion.name
      : "";
  }

  @computed
  public get sortedPackageJsonPaths(): string[] {
    if (!this.analysisResult || !this.analysisResult.javascript) {
      return [];
    }

    const solutions = this.analysisResult.javascript && this.analysisResult.javascript.javascriptSolutions;
    if (solutions) {
      return solutions.map((solution) => solution.packageJsonPath).sort(ConfigurePlatformReactIos.packageJsonSortFn);
    }

    // keep this for safe deployment, remove after api-service is updated in all environments
    const paths = this.analysisResult.javascript && this.analysisResult.javascript.packageJsonPaths;
    if (paths) {
      return paths.sort(ConfigurePlatformReactIos.packageJsonSortFn);
    }
    return [];
  }

  constructor(repoStore: RepoStore) {
    super(repoStore);
  }

  private getXcodeProjectPathForPackageJsonPath(packageJsonPath: string): string | undefined {
    if (!packageJsonPath.endsWith("package.json")) {
      return;
    }

    const iOSDirectory = packageJsonPath.substring(0, packageJsonPath.length - "package.json".length) + "ios";

    const projects = this.analysisResult && this.analysisResult.xcode && this.analysisResult.xcode.xcodeSchemeContainers;
    if (!projects) {
      return;
    }

    // First look for a xcworkspace; if there's both an xcodeproject and xcworkspace present in the directory, we prefer the workspace.
    // Workspaces are required, for one thing, to use CocoaPods.
    const iOSDirectoryLength = iOSDirectory.length;
    const matchingWorkspace = projects.find((xcodeSchemeContainer) => {
      const xcodeWorkspacePath = xcodeSchemeContainer.path;
      const lastSlashIndex = xcodeWorkspacePath.lastIndexOf("/");
      return (
        lastSlashIndex === iOSDirectoryLength &&
        xcodeWorkspacePath.startsWith(iOSDirectory) &&
        xcodeWorkspacePath.endsWith(".xcworkspace")
      );
    });
    if (matchingWorkspace) {
      return matchingWorkspace.path;
    }

    // If no workspace found, then use the first match in the right directory
    const matchingProject = projects.find((xcodeSchemeContainer) => {
      const rawXcodeProjectPath = xcodeSchemeContainer.path;
      const xcodeProjectPath = rawXcodeProjectPath.replace(/[.]xcodeproj[/]project[.]xcworkspace$/, ".xcodeproj");
      const lastSlashIndex = xcodeProjectPath.lastIndexOf("/");
      return lastSlashIndex === iOSDirectoryLength && xcodeProjectPath.startsWith(iOSDirectory);
    });
    return matchingProject && matchingProject.path;
  }

  @action
  public selectPackageJsonByPath(packageJson: string) {
    const javascriptSolution = ConfigurePlatformReactIos.getJavaScriptSolutionForPackageJsonPath(packageJson, this.analysisResult);
    if (javascriptSolution) {
      this.selectedPackageJsonPath = javascriptSolution.packageJsonPath;
      this.reactNativeVersion = javascriptSolution.reactNativeVersion;
      this.hasNvmrc = Boolean(javascriptSolution.nvmrcPath);
    } else {
      // keep this for safe deployment, remove after api-service is updated in all environments
      this.selectedPackageJsonPath = packageJson;
    }

    const xcodeProjectPath = this.getXcodeProjectPathForPackageJsonPath(packageJson);
    if (xcodeProjectPath) {
      this.selectProjectByPath(xcodeProjectPath);
    }
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
    const config = branchData.config;

    if (config && config.toolsets && config.toolsets.javascript) {
      const jsToolset = config.toolsets.javascript;

      this.javascriptRunTests = !!jsToolset.runTests;
      this.selectedPackageJsonPath = jsToolset.packageJsonPath;
    }
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

      // determine default build system for new RN branch configuration
      this.forceLegacyBuildSystem = false;

      if (isSelectNodeVersionEnabled()) {
        const currentNodeVersion =
          branchData.nodeVersionsStore && branchData.nodeVersionsStore.isLoaded && branchData.nodeVersionsStore.currentVersion;
        this.nodeVersion = currentNodeVersion ? currentNodeVersion.name : undefined;
      }
    } else if (this.selectedPackageJsonPath) {
      const javascriptSolution = ConfigurePlatformReactIos.getJavaScriptSolutionForPackageJsonPath(
        this.selectedPackageJsonPath,
        this.analysisResult
      );
      if (javascriptSolution) {
        this.reactNativeVersion = javascriptSolution.reactNativeVersion;
        this.hasNvmrc = Boolean(javascriptSolution.nvmrcPath);
      }

      this.selectedXcodeVersion =
        this.selectedXcodeVersion &&
        branchData.xcodeVersionsStore &&
        this.getProperXcodeVersion(this.selectedXcodeVersion, branchData.xcodeVersionsStore);

      // get legacy build system value for existing configuration
      const xcodeProps = branchData.config && branchData.config.toolsets && branchData.config.toolsets.xcode;
      this.forceLegacyBuildSystem = !!xcodeProps && !!xcodeProps.forceLegacyBuildSystem;

      if (isSelectNodeVersionEnabled()) {
        const reactProps = branchData.config && branchData.config.toolsets && branchData.config.toolsets.javascript;
        this.nodeVersion = reactProps && reactProps.nodeVersion;
      }

      // check if current configuration uses xcodeproj
      const xcodeprojSaved =
        branchData.config &&
        branchData.config.toolsets &&
        branchData.config.toolsets.xcode &&
        branchData.config.toolsets.xcode.projectOrWorkspacePath &&
        branchData.config.toolsets.xcode.projectOrWorkspacePath.toLowerCase().endsWith(".xcodeproj");

      if (!xcodeprojSaved || !this.analysisResult) {
        return;
      }

      const projects = this.analysisResult.xcode && this.analysisResult.xcode.xcodeSchemeContainers;
      if (!projects) {
        return;
      }

      // try to find if there is matching xcworkspace for current package.json (same as in getXcodeProjectPathForPackageJsonPath at line #64)
      const iOSDirectory =
        this.selectedPackageJsonPath.substring(0, this.selectedPackageJsonPath.length - "package.json".length) + "ios";
      const iOSDirectoryLength = iOSDirectory.length;
      const xcworkspaceDetected = projects.some((xcodeSchemeContainer) => {
        const xcodeWorkspacePath = xcodeSchemeContainer.path;
        const lastSlashIndex = xcodeWorkspacePath.lastIndexOf("/");
        return (
          lastSlashIndex === iOSDirectoryLength &&
          xcodeWorkspacePath.startsWith(iOSDirectory) &&
          xcodeWorkspacePath.endsWith(".xcworkspace")
        );
      });

      // if there is xcworkspace and currently we have xcodeproj, we need to reselect it
      if (xcworkspaceDetected) {
        logger.info("branches/configure/reactnative_ios/workspace_reselect");
        this.selectPackageJsonByPath(this.selectedPackageJsonPath);
        if (branchData.config && branchData.config.toolsets.xcode && branchData.config.toolsets.xcode.scheme) {
          this.selectSchemeByName(branchData.config.toolsets.xcode.scheme);
        }
      }
    }
  }

  @computed
  public get isValid(): boolean {
    const buildValid: boolean =
      !!this.analysisResult && !!this.selectedSchemeContainer && !!this.selectedScheme && !!this.selectedXcodeVersion;
    if (!buildValid) {
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
