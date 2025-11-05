import { action, observable, computed } from "mobx";
import { isEmpty, forEach } from "lodash";
import { t } from "@root/lib/i18n";
import { IAHBranchConfiguration, IAHEnvironmentVariable, ICustomVariable } from "@root/data/build";
import { ConfigurePlatformHandler, BranchData } from "./config-base";

export class ConfigurePlatformCustomVariables extends ConfigurePlatformHandler {
  @observable private enabled: boolean = false;
  @observable private savedIndices: Set<number> = new Set();
  @observable private committedVariables: IAHEnvironmentVariable[] = [];
  @observable private vars: IAHEnvironmentVariable[] = [];

  @computed
  public get variables(): ICustomVariable[] {
    return this.vars
      .map((variable, index) => ({
        index,
        variable,
        saved: this.savedIndices.has(index),
      }))
      .sort((v1, v2) => {
        // move saved secret variables to the top
        if (v1.variable.isSecret && v1.saved && (!v2.variable.isSecret || !v2.saved)) {
          return -1;
        } else if (v2.variable.isSecret && v2.saved && (!v1.variable.isSecret || !v1.saved)) {
          return 1;
        }
        return v1.index - v2.index;
      });
  }

  @action
  public onBranchConfigurationPreLoaded(branchData: BranchData) {
    if (branchData.config) {
      const originalVariables = branchData.config.environmentVariables || [];
      this.vars = [...originalVariables];
      this.savedIndices = new Set(originalVariables.map((v, i) => i));
      this.enabled = originalVariables && originalVariables.length > 0;
      this.copyVariables();
    }
  }

  @action
  public onAllBranchDataAvailable(branchData: BranchData) {
    if (!branchData.wasPreloaded) {
      this.onBranchConfigurationPreLoaded(branchData);
    }
  }

  @computed
  public get errors() {
    const allErrors: { [index: number]: string } = {};

    return this.vars.reduce((errors, variable, index) => {
      if (!errors[index] && index < this.committedVariables.length) {
        // check for empty
        if (variable.name === "") {
          errors[index] = t("build:configure.customEnvVariables.validationError.empty");
        } else if (variable.name.indexOf(" ") !== -1) {
          errors[index] = t("build:configure.customEnvVariables.validationError.hasSpaces");
        } else {
          // search duplicates
          forEach(this.vars, (variable2, index2) => {
            if (variable.name === variable2.name && index !== index2) {
              if (!errors[index2]) {
                const errorMessage = t("build:configure.customEnvVariables.validationError.duplicate", {
                  variableName: variable.name,
                });
                errors[index] = errorMessage;
                errors[index2] = errorMessage;
              }
            }
          });
        }
      }

      return errors;
    }, allErrors);
  }

  @computed
  public get isValid(): boolean {
    return isEmpty(this.errors);
  }

  @computed
  public get addedLines(): number {
    return this.committedVariables.length;
  }

  @computed
  public get customVariablesEnabled(): boolean {
    return this.enabled;
  }

  public save(config: IAHBranchConfiguration, telemetry?: Object): void {
    config.environmentVariables = this.vars;
  }

  @action
  public copyVariables() {
    this.committedVariables = [...this.vars];
  }

  @action
  public setCustomVariablesEnabled(value: boolean) {
    this.enabled = value;
    if (!value) {
      this.vars = [];
    } else {
      this.vars = [...this.committedVariables];
    }
  }

  @action
  public addVariable(variable: IAHEnvironmentVariable) {
    this.vars.push(variable);
  }

  @action
  public deleteVariable(index: number) {
    this.vars.splice(index, 1);
    this.copyVariables();
  }

  @action
  public setVariable(index: number, variable: IAHEnvironmentVariable) {
    this.vars[index] = variable;
    this.savedIndices.delete(index);
    this.copyVariables();
  }
}
