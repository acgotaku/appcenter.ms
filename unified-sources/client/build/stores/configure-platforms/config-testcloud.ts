import { action, computed } from "mobx";

import { RepoStore } from "../repo-store";
import { ConfigurePlatformHandler, ConfigurePlatformCommon, ConfigureMessage, BranchData } from "./config-base";
import { IAHBranchConfiguration } from "@root/data/build";

import { TestCloudPaneUIStore, IncompatibilityReason } from "../../routes/branches/test-cloud/test-cloud-pane-ui-store";

export class ConfigurePlatformTest extends ConfigurePlatformHandler {
  public get testingEnabled(): boolean {
    return this.tcPaneStore.enableTests;
  }

  public setTestingEnabled(value: boolean) {
    this.tcPaneStore.enableTests = value;
  }

  private primaryHandler?: ConfigurePlatformCommon;
  private tcPaneStore: TestCloudPaneUIStore;

  constructor(repoStore: RepoStore, primaryHandler?: ConfigurePlatformCommon) {
    super(repoStore);

    this.primaryHandler = primaryHandler;
    // TODO: stop using this class and move the functionality over here
    this.tcPaneStore = new TestCloudPaneUIStore();
  }

  @action
  public onBranchConfigurationPreLoaded(branchData: BranchData) {
    const config = branchData.config;

    if (config && config.toolsets && config.toolsets.testcloud) {
      /* handle */
    }
  }

  @action
  public onAllBranchDataAvailable(branchData: BranchData) {
    // make sure all our props are properly set
    if (!branchData.wasPreloaded) {
      this.onBranchConfigurationPreLoaded(branchData);
    }
  }

  @computed
  public get isValid(): boolean {
    return true;
  }

  public save(config: IAHBranchConfiguration, telemetry?: Object): void {
    if (this.tcPaneStore.selectedTestCloudConfig && !this.testToggleDisabled()) {
      config.toolsets.testcloud = this.tcPaneStore.selectedTestCloudConfig;
    }

    if (!telemetry) {
      return;
    }

    telemetry["test-cloud-tests"] = this.tcPaneStore.selectedTestCloudConfig
      ? this.tcPaneStore.selectedTestCloudConfig.frameworkType
      : "None";
    if (this.tcPaneStore.incompatibilityReason !== IncompatibilityReason.None) {
      telemetry["test-cloud-incompatibility"] = IncompatibilityReason[this.tcPaneStore.incompatibilityReason];
    }
  }

  public testToggleDisabled(): boolean {
    const disabled = !this.tcPaneStore.isTestPaneEnabled;
    if (disabled) {
      return true;
    }

    return !!this.primaryHandler && this.primaryHandler.testToggleDisabled();
  }

  public testMessage(): ConfigureMessage | undefined {
    return this.primaryHandler && this.primaryHandler.testMessage();
  }
}
