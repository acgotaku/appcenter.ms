import { observable, action, computed } from "mobx";
import { RepoStore } from "../repo-store";
import { ProjectsStore } from "../projects-store";
import { XcodeVersionsStore } from "../xcode-versions-store";
import { XamarinSDKBundlesStore } from "../xamarin-sdk-bundles-store";
import { NodeVersionsStore } from "../node-versions-store";
import { IAHBranchConfiguration, IAHBuildNumberFormat, IToolsetProjects, IJavaScriptSolution } from "@root/data/build";

export interface BranchData {
  config?: IAHBranchConfiguration;
  projectsStore?: ProjectsStore;
  xcodeVersionsStore?: XcodeVersionsStore;
  sdkBundlesStore?: XamarinSDKBundlesStore;
  nodeVersionsStore?: NodeVersionsStore;
  wasPreloaded?: boolean;
}

export interface ConfigureMessage {
  type?: "info" | "error";
  message: string;
}

interface IObjectWithPath {
  path: string;
}

interface IObjectWithPodfilePath extends IObjectWithPath {
  podfilePath?: string;
}

export abstract class ConfigurePlatformHandler {
  protected readonly repoStore: RepoStore;

  constructor(repoStore: RepoStore) {
    this.repoStore = repoStore;
  }

  public abstract get isValid(): boolean;

  // called when both branch config and analysis are done
  public abstract onAllBranchDataAvailable(branchData: BranchData);

  // special case for already-configured branches, where the branch analysis didn't finish yet
  // but we don't really need it to, these values were valid last time, so should be valid now
  // called when configuration is preloaded (or empty)
  public abstract onBranchConfigurationPreLoaded(branchData: BranchData);

  // (optional) called when the store settles (note that it might be in failed state!)
  public onBranchAnalysisFinished(projectsStore: ProjectsStore) {
    /* override */
  }

  // called when snapshotting current configuration
  public abstract save(config: IAHBranchConfiguration, telemetry?: Object): void;

  // (optional) called when there is an error while saving the current configuration
  public onSaveError(error: any): void {
    /* override */
  }

  public signToggleDisabled(): boolean {
    return false;
  }
  public signToggleVisible(): boolean {
    return true;
  }
  public signMessage(): ConfigureMessage | undefined {
    return;
  }
  public testToggleDisabled(): boolean {
    return false;
  }
  public testToggleVisible(): boolean {
    return true;
  }
  public testMessage(): ConfigureMessage | undefined {
    return;
  }
  public distributeToggleDisabled(): boolean {
    return false;
  }
  public distributeMessage(): ConfigureMessage | undefined {
    return;
  }
}

export abstract class ConfigurePlatformCommon extends ConfigurePlatformHandler {
  @observable
  public trigger?: string;

  @observable
  public signingEnabled: boolean = false;

  @observable
  public autoIncrementVersionEnabled: boolean = false;

  @observable
  public buildNumberFormat?: IAHBuildNumberFormat = "buildId";

  public readonly buildNumberFormats = {
    buildId: "Build ID",
    timestamp: "Timestamp",
  };

  constructor(repoStore: RepoStore) {
    super(repoStore);
  }

  @computed
  public get buildNumberFormatName(): string | undefined {
    if (this.buildNumberFormat) {
      return this.buildNumberFormats[this.buildNumberFormat];
    }
    return;
  }

  @computed
  public get buildNumberFormatDescription(): string | undefined {
    switch (this.buildNumberFormat) {
      case "buildId":
        let nextBuildNumber = 1;
        if (this.repoStore && this.repoStore.branchesStore) {
          nextBuildNumber = this.repoStore.branchesStore.lastBuildId + 1;
        }
        return `The build ID is unique per app level, next is ${nextBuildNumber}`;
      case "timestamp":
        return `Unix timestamp in seconds e.g. 1481761337`;
      default:
        return;
    }
  }

  @action
  public setTrigger(value: string) {
    this.trigger = value;
  }

  @action
  public setSigningEnabled(value: boolean) {
    this.signingEnabled = value;
  }

  @action
  public setAutoIncrementVersionEnabled(enabled: boolean) {
    this.autoIncrementVersionEnabled = enabled;
  }

  @action
  public setBuildNumberFormat(value: IAHBuildNumberFormat) {
    this.buildNumberFormat = value;
  }

  @action
  public onBranchConfigurationPreLoaded(branchData: BranchData) {
    const config = branchData.config;
    if (config) {
      this.trigger = config.trigger;
      this.autoIncrementVersionEnabled = !!config.artifactVersioning;
      if (config.artifactVersioning) {
        this.buildNumberFormat = config.artifactVersioning.buildNumberFormat;
      }
    } else {
      this.trigger = "continuous";
    }
  }

  public save(config: IAHBranchConfiguration, telemetry?: Object): void {
    config.trigger = this.trigger === "manual" ? "manual" : "continuous";
    if (this.autoIncrementVersionEnabled) {
      config.artifactVersioning = { buildNumberFormat: this.buildNumberFormat };
    }

    if (telemetry) {
      telemetry["build-trigger"] = this.trigger;
      telemetry["artifact-versioning"] = this.autoIncrementVersionEnabled ? this.buildNumberFormat : "None";
      telemetry["is-code-signed"] = this.signingEnabled;
    }
  }

  protected static projectSortFn(a: IObjectWithPath, b: IObjectWithPath): number {
    // Sort by top-level file path first
    const aLevel = a.path.split("/").length;
    const bLevel = b.path.split("/").length;
    if (aLevel !== bLevel) {
      return aLevel - bLevel;
    }
    return a.path.localeCompare(b.path);
  }

  protected static iOSProjectSortFn(a: IObjectWithPodfilePath, b: IObjectWithPodfilePath): number {
    // Items with podfile should be on top
    if (a.podfilePath && b.podfilePath) {
      // If both have podfile prefer workspace than project
      const aIsWS = a.path.endsWith(".xcworkspace");
      const bIsWS = b.path.endsWith(".xcworkspace");
      if (aIsWS && !bIsWS) {
        return -1;
      } else if (!aIsWS && bIsWS) {
        return 1;
      }
    } else if (a.podfilePath && !b.podfilePath) {
      return -1;
    } else if (!a.podfilePath && b.podfilePath) {
      return 1;
    }
    // else sort by path
    return ConfigurePlatformCommon.projectSortFn(a, b);
  }

  protected static getJavaScriptSolutionForPackageJsonPath(
    packageJsonPath: string,
    analysisResult?: IToolsetProjects
  ): IJavaScriptSolution | undefined {
    if (!packageJsonPath.endsWith("package.json")) {
      return;
    }

    const solutions = analysisResult && analysisResult.javascript && analysisResult.javascript.javascriptSolutions;
    if (!solutions) {
      return;
    }

    return solutions.find((solution) => solution.packageJsonPath === packageJsonPath);
  }

  public testToggleDisabled(): boolean {
    return !this.signingEnabled;
  }

  public testMessage(): ConfigureMessage | undefined {
    return this.testToggleDisabled() ? { type: "error", message: "Only signed builds can be tested." } : undefined;
  }

  public distributeToggleDisabled(): boolean {
    return !this.signingEnabled;
  }

  public distributeMessage(): ConfigureMessage | undefined {
    return this.distributeToggleDisabled()
      ? { type: "error", message: "Only signed builds can be distributed and run on devices." }
      : undefined;
  }
}
