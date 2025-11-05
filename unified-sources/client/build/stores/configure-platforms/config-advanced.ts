import { observable, action } from "mobx";
import { config } from "../../../lib/utils/config";
const environments = require("../../../../environments");
import { RepoStore } from "../repo-store";
import { IAHBranchConfiguration, IBuildScriptsMap } from "@root/data/build";
import { ConfigurePlatformHandler, BranchData } from "./config-base";
import { ProjectsStore } from "../projects-store";

export class ConfigurePlatformAdvanced extends ConfigurePlatformHandler {
  @observable
  public badgeIsEnabled: boolean = false;

  @observable
  public detectedBuildScripts?: IBuildScriptsMap;

  constructor(repoStore: RepoStore) {
    super(repoStore);
  }

  @action
  public onBranchConfigurationPreLoaded(branchData: BranchData) {
    const config = branchData.config;

    if (config) {
      this.badgeIsEnabled = !!config.badgeIsEnabled;
    }
  }

  @action
  public onBranchAnalysisFinished(projectsStore: ProjectsStore) {
    if (projectsStore.data && projectsStore.data.buildscripts) {
      this.detectedBuildScripts = projectsStore.data.buildscripts;
    } else {
      this.detectedBuildScripts = {};
    }
  }

  @action
  public onAllBranchDataAvailable(branchData: BranchData) {
    if (!branchData.wasPreloaded) {
      this.onBranchConfigurationPreLoaded(branchData);
    }
  }

  @action
  public setBadgeIsEnabled(value: boolean) {
    this.badgeIsEnabled = value;
  }

  public static getBadgeUrl(appId: string, branch: string): string {
    const branchName = encodeURIComponent(branch);
    let badgeHost = "";
    const ENV = config.getEnv();
    switch (ENV) {
      case environments.PROD: {
        badgeHost = "build.appcenter.ms";
        break;
      }
      default: {
        badgeHost = "api-service-build-int-pme.dev-pme.avalanch.es";
      }
    }
    return `https://${badgeHost}/v0.1/apps/${appId}/branches/${branchName}/badge`;
  }

  public get isValid(): boolean {
    return true;
  }

  public save(config: IAHBranchConfiguration, telemetry?: Object): void {
    config.toolsets.buildscripts = this.detectedBuildScripts;
    config.badgeIsEnabled = this.badgeIsEnabled;
    if (telemetry) {
      telemetry["build-badge-enabled"] = this.badgeIsEnabled;
    }
  }

  public advancedDisabled(): boolean {
    return false;
  }
}
