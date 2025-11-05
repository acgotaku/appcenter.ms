import { observable, action, computed } from "mobx";

import { RepoStore } from "../repo-store";
import { IToolsetProjects, IMsBuildSolution, IBuildPlatform, IAHBranchConfiguration } from "@root/data/build";
import { ConfigurePlatformCommon, ConfigureMessage, BranchData } from "./config-base";
import { PfxFileUploadStore } from "../encoded-file-upload-store";

export class ConfigurePlatformUwp extends ConfigurePlatformCommon {
  public readonly pfxFileUploadStore: PfxFileUploadStore;

  @observable
  public selectedSolution?: IMsBuildSolution;

  @observable
  public selectedConfiguration?: string;

  @observable
  public selectedPlatforms: IBuildPlatform[] = [];

  @observable
  public noSolutionsFound: boolean = false;

  @observable
  public noConfigurationsFound: boolean = false;

  @computed
  public get sortedSolutions(): IMsBuildSolution[] {
    if (!this.analysisResult || !this.analysisResult.uwp) {
      return [];
    }

    const solutions = this.analysisResult.uwp && this.analysisResult.uwp.uwpSolutions;
    if (solutions) {
      return solutions.sort(ConfigurePlatformCommon.projectSortFn);
    }
    return [];
  }

  @computed
  public get allBuildPlatforms(): IBuildPlatform[] {
    return ["ARM", "x86", "x64"];
  }

  @action
  public setSelectedPlatforms(platforms: string[]) {
    this.selectedPlatforms = platforms as IBuildPlatform[];
  }

  @observable private analysisResult?: IToolsetProjects;

  constructor(repoStore: RepoStore) {
    super(repoStore);

    this.pfxFileUploadStore = new PfxFileUploadStore();
  }

  private getDefaultConfiguration(solution?: IMsBuildSolution): string | undefined {
    if (!solution) {
      return;
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

    this.selectedSolution = selectedProject;
    // if current configuration is null or there is no same in selected solution set defaults
    if (
      !this.selectedConfiguration ||
      !selectedProject ||
      !selectedProject.configurations ||
      !selectedProject.configurations.length ||
      selectedProject.configurations.indexOf(this.selectedConfiguration) === -1
    ) {
      this.selectedConfiguration = this.getDefaultConfiguration(selectedProject);
    }
  }

  @action
  public selectConfigurationByName(configuration: string) {
    this.selectedConfiguration = configuration;
  }

  @action
  public onBranchConfigurationPreLoaded(branchData: BranchData) {
    super.onBranchConfigurationPreLoaded(branchData);
    const config = branchData.config;

    if (config && config.toolsets && config.toolsets.uwp) {
      const rootToolset = config.toolsets;
      const uwpToolset = rootToolset.uwp;

      //if has certificate
      if (uwpToolset && uwpToolset.packageCertificateFileName && !this.pfxFileUploadStore.hasFile) {
        this.pfxFileUploadStore.setInfoOnlyFilename(uwpToolset.packageCertificateFileName);
        this.pfxFileUploadStore.passwordChanged(uwpToolset.packageCertificatePassword);
        this.signingEnabled = true;
      }

      if (uwpToolset) {
        this.selectedPlatforms = [...uwpToolset.platforms];

        const useFakeOptions = !branchData.projectsStore || !branchData.projectsStore.isLoaded;
        if (useFakeOptions) {
          const fakeSolution: IMsBuildSolution = {
            path: uwpToolset.slnPath,
            configurations: [uwpToolset.configuration],
            nugetConfigPath: uwpToolset.nugetConfigPath,
          };
          this.selectedSolution = fakeSolution;
          this.selectedConfiguration = uwpToolset.configuration;
        } else {
          this.selectSolutionByPath(uwpToolset.slnPath);
          this.selectConfigurationByName(uwpToolset.configuration);
        }
      }
    } else {
      this.selectedPlatforms = [...this.allBuildPlatforms];
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
      }
      this.noSolutionsFound = solutions.length === 0;

      const configurations = this.selectedSolution && this.selectedSolution.configurations;
      this.noConfigurationsFound = !configurations || configurations.length === 0;
    }
  }

  @computed
  public get isValid(): boolean {
    const buildValid: boolean = !!this.selectedSolution && !!this.selectedConfiguration;
    if (!buildValid) {
      return false;
    }

    if (this.signingEnabled) {
      if (!this.pfxFileUploadStore.isValid) {
        return false;
      }
    }

    return true;
  }

  public save(config: IAHBranchConfiguration, telemetry?: Object): void {
    super.save(config, telemetry);

    if (this.selectedSolution) {
      config.toolsets.uwp = {
        slnPath: this.selectedSolution.path,
        configuration: this.selectedConfiguration || "",
        platforms: this.selectedPlatforms,
        nugetConfigPath: this.selectedSolution.nugetConfigPath,
      };
    }
    this.setSigningProperties(config);
  }

  public setSigningProperties(config: IAHBranchConfiguration): void {
    if (this.signingEnabled) {
      // we need to provide the filename when updating the config without re-uploading the cert
      if (this.pfxFileUploadStore.isValid && config.toolsets.uwp) {
        if (this.pfxFileUploadStore.hasFile) {
          config.toolsets.uwp.packageCertificateBase64String = this.pfxFileUploadStore.fileEncoded;
        }
        config.toolsets.uwp.packageCertificateFileName = this.pfxFileUploadStore.fileName;
        config.toolsets.uwp.packageCertificatePassword = this.pfxFileUploadStore.password;
      }
    }
  }

  public signMessage(): ConfigureMessage {
    return { message: "If a certificate is not provided, it will be signed with a temporary one for development." };
  }

  public testToggleDisabled(): boolean {
    return true;
  }

  public testMessage(): ConfigureMessage {
    return { type: "info", message: "Testing UWP builds is currently not available." };
  }

  public distributeToggleDisabled(): boolean {
    return false; // we can distribute even non-signed builds
  }
}
