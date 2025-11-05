import { observable, action, computed } from "mobx";

import { ProvisionSecureFileUploadStore } from "../provision-file-upload-store";
import { CertificateSecureFileUploadStore } from "../certificate-secure-file-upload-store";
import { MobileProvisionFileUploadStore, P12FileUploadStore } from "../encoded-file-upload-store";
import { ICertUploadHandlerStore } from "@root/lib/file-upload-service";
import { IDragDropUploadHandlerStore } from "@root/shared";
import { optimizelyStore, appFeaturesStore } from "@root/stores";
import { PLATFORMS, OS, OptimizelyFeatureNames } from "@lib/common-interfaces";

import {
  IToolsetProjects,
  IAHBranchConfiguration,
  IXcodeScheme,
  IXcodeSchemeContainer,
  IXcodeArchiveProject,
  IProvisioningProfileFile,
  IosAppExtensionInfo,
  EMPTY_PROVISIONING_PROFILE,
} from "@root/data/build";
import { ConfigurePlatformCommon, BranchData, ConfigureMessage } from "./config-base";
import { logger } from "@root/lib/telemetry";

export interface IFileUploadStore extends IDragDropUploadHandlerStore {
  isValid: boolean;
  hasFile: boolean;
  fileName: string;
  fileEncoded?: string;
  secureFileId?: string;
  fileUploadServiceDetails?: any;

  setInfoOnlyFilename(fileName: string);
}

export interface IPasswordProtectedFileUploadStore extends IFileUploadStore, ICertUploadHandlerStore {
  password: string;
  passwordReadonly: boolean;
}

export class AppExtensionProvisionUploadStore extends ProvisionSecureFileUploadStore {
  private _appExtensionInfo: IosAppExtensionInfo;
  constructor(appExtensionInfo: IosAppExtensionInfo) {
    super();
    this._appExtensionInfo = appExtensionInfo;
  }
  public get appExtensionInfo(): IosAppExtensionInfo {
    return this._appExtensionInfo;
  }
}

export class ConfigurePlatformXcode extends ConfigurePlatformCommon {
  public provisioningProfileMaximumSize: number = 500000;
  public provisionUploadStoreDefault?: IFileUploadStore | ProvisionSecureFileUploadStore;
  public p12UploadStoreDefault?: IPasswordProtectedFileUploadStore | CertificateSecureFileUploadStore;

  // backup secure upload stores, only for switching logic
  public provisionUploadStoreSecure?: ProvisionSecureFileUploadStore;
  public p12UploadStoreSecure?: CertificateSecureFileUploadStore;

  @observable
  public enableSecureFiles: boolean = false;

  @computed
  public get provisionUploadStore(): IFileUploadStore | ProvisionSecureFileUploadStore | undefined {
    return this.enableSecureFiles ? this.provisionUploadStoreSecure : this.provisionUploadStoreDefault;
  }

  @computed
  public get p12UploadStore(): IPasswordProtectedFileUploadStore | CertificateSecureFileUploadStore | undefined {
    return this.enableSecureFiles ? this.p12UploadStoreSecure : this.p12UploadStoreDefault;
  }

  public appExtensionProvisionUploadStores: AppExtensionProvisionUploadStore[] = [];
  // Stores any existing app extension provisioning profiles from previous configurations.
  // If user is switching between different projects in the configuration, this information is used
  // to re-populate the app extension provisioning profile upload stores with any existing files whenever
  // the project is changed.
  public appExtensionProvisioningProfileFiles?: IProvisioningProfileFile[];

  @observable
  public selectedSchemeContainer?: IXcodeSchemeContainer;

  @observable
  public selectedScheme?: IXcodeScheme;

  @observable
  public selectedSchemeAppExtensions?: IosAppExtensionInfo[];

  @observable
  public selectedXcodeVersion?: string;

  @observable
  public noProjectsFound: boolean = false;

  @observable
  public testsEnabled: boolean = false;

  @observable
  public forceLegacyBuildSystem: boolean = false;

  @observable
  protected analysisResult?: IToolsetProjects;

  @computed
  public get sortedXcodeProjects(): IXcodeSchemeContainer[] {
    if (!this.analysisResult || !this.analysisResult.xcode) {
      return [];
    }

    const projects = this.analysisResult.xcode && this.analysisResult.xcode.xcodeSchemeContainers;
    if (projects) {
      return projects.sort(ConfigurePlatformCommon.iOSProjectSortFn);
    }
    return [];
  }

  @computed
  public get sortedXcodeSchemes(): IXcodeScheme[] {
    const schemes: IXcodeScheme[] = [];
    const schemeNames: { [name: string]: boolean } = {};

    if (!this.selectedSchemeContainer) {
      return schemes;
    }

    if (this.selectedSchemeContainer.sharedSchemes && this.selectedSchemeContainer.sharedSchemes.length) {
      this.selectedSchemeContainer.sharedSchemes.forEach((scheme: IXcodeScheme) => {
        // Take unique schemes
        if (!schemeNames[scheme.name]) {
          schemeNames[scheme.name] = true;
          schemes.push(scheme);
        }
      });
    }

    return schemes.sort((a: IXcodeScheme, b: IXcodeScheme) => {
      return a.name.localeCompare(b.name);
    });
  }

  @computed
  public get noSchemesFound(): boolean {
    return !!this.selectedSchemeContainer && !this.selectedScheme && this.sortedXcodeSchemes.length === 0;
  }

  @computed
  public get isAppExtensionProvisionUploadStoresValid(): boolean {
    return this.appExtensionProvisionUploadStores.every((x) => x.isValid);
  }

  @computed
  public get isXcode10orXcode11(): boolean {
    return !!this.selectedXcodeVersion && (this.selectedXcodeVersion.startsWith("10.") || this.selectedXcodeVersion.startsWith("11."));
  }

  @computed
  public get provisionProfileSize(): number {
    return (
      (this.provisionUploadStore &&
        this.provisionUploadStore.hasFile &&
        this.provisionUploadStore.file &&
        this.provisionUploadStore.file.size) ||
      0
    );
  }

  @computed
  private get isSecureFilesEnabled(): boolean {
    const supportXamarin = optimizelyStore.isFeatureEnabled(OptimizelyFeatureNames.build_secure_files_xamarin);
    const isPlatformSUpported =
      this.repoStore.app &&
      (this.repoStore.app.platform === PLATFORMS.OBJECTIVE_C_SWIFT.value ||
        this.repoStore.app.platform === PLATFORMS.REACT_NATIVE.value ||
        (supportXamarin && this.repoStore.app.platform === PLATFORMS.XAMARIN.value));
    const isMacOS = this.repoStore.app && this.repoStore.app.os === OS.MACOS;
    return (
      this.enableSecureFiles ||
      optimizelyStore.isFeatureEnabled(OptimizelyFeatureNames.build_secure_files) ||
      appFeaturesStore.isBuildSecureFilesActive(this.repoStore.app?.id) ||
      isMacOS || // for macos we use secure files right from the beginning
      (isPlatformSUpported && (this.isNewBranch || !this.isSigned)) || // if it is new or not previously signed branch for supported platforms
      this.isUsingSecureFiles // if it already uses secure files
    );
  }

  @computed
  public get isNewBranch(): boolean {
    return !!this.repoStore.currentBranchStatus && !this.repoStore.currentBranchStatus.configured;
  }

  @computed
  public get isUsingSecureFiles(): boolean {
    return !!(
      this.repoStore.currentBranchConfigurationStore &&
      this.repoStore.currentBranchConfigurationStore.data &&
      this.repoStore.currentBranchConfigurationStore.data.toolsets &&
      this.repoStore.currentBranchConfigurationStore.data.toolsets.xcode &&
      this.repoStore.currentBranchConfigurationStore.data.toolsets.xcode.provisioningProfileFileId &&
      this.repoStore.currentBranchConfigurationStore.data.toolsets.xcode.certificateFileId
    );
  }

  @computed
  public get isSigned(): boolean {
    if (this.repoStore.currentBranchConfigurationStore && this.repoStore.currentBranchConfigurationStore.data) {
      return this.repoStore.currentBranchConfigurationStore.data.signed === true;
    }
    return false;
  }

  private getDefaultScheme(container?: IXcodeSchemeContainer): IXcodeScheme | undefined {
    if (!container) {
      return;
    }

    if (container.sharedSchemes && container.sharedSchemes.length) {
      return container.sharedSchemes[0];
    }

    const sortedSchemes = this.sortedXcodeSchemes;
    if (sortedSchemes && sortedSchemes.length) {
      return sortedSchemes[0];
    }
  }

  @action
  public switchToSecureFiles = () => {
    logger.info("build/secure-files/enabled");
    this.enableSecureFiles = true;
    this.p12UploadStoreSecure = new CertificateSecureFileUploadStore();
    this.provisionUploadStoreSecure = new ProvisionSecureFileUploadStore();
  };

  @action
  public revertSwitchToSecureFiles = () => {
    logger.info("build/secure-files/disabled");
    this.enableSecureFiles = false;
    if (this.p12UploadStoreSecure) {
      this.p12UploadStoreSecure.reset();
    }

    if (this.provisionUploadStoreSecure) {
      this.provisionUploadStoreSecure.reset();
    }
  };

  @action
  public selectProjectByPath(projectPath: string) {
    const selectedProject = this.sortedXcodeProjects.find((value) => {
      return value.path === projectPath;
    });
    this.selectedSchemeContainer = selectedProject;
    this.selectedScheme = this.getDefaultScheme(selectedProject);
    this.appExtensionProvisionUploadStores = this.getAppExtensionUploadStoresForProject(selectedProject, this.selectedScheme);
  }

  // Return the upload stores for any app extensions present in the selected Xcode project.
  private getAppExtensionUploadStoresForProject(
    container?: IXcodeSchemeContainer,
    selectedScheme?: IXcodeScheme
  ): AppExtensionProvisionUploadStore[] {
    if (!container || !selectedScheme) {
      return [];
    }

    this.selectedSchemeAppExtensions = container.appExtensionTargets;
    // If selected project is a workspace, use the selected scheme to get a list of the app extensions to build the scheme.
    if (!this.selectedSchemeAppExtensions && container.path.includes(".xcworkspace") && selectedScheme.archiveProject) {
      const projectPath = selectedScheme.archiveProject.projectPath;
      const selectedSchemeProject = this.sortedXcodeProjects.find((value) => {
        return value.path === projectPath || value.path === projectPath + "/project.xcworkspace";
      });
      this.selectedSchemeAppExtensions = selectedSchemeProject && selectedSchemeProject.appExtensionTargets;
    }

    if (!this.selectedSchemeAppExtensions) {
      return [];
    }

    return this.selectedSchemeAppExtensions
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((target) => {
        const uploadStore = new AppExtensionProvisionUploadStore(target);
        if (this.appExtensionProvisioningProfileFiles) {
          const matchingProfile = this.appExtensionProvisioningProfileFiles.find(
            (profile) => profile.targetBundleIdentifier === target.targetBundleIdentifier
          );
          if (matchingProfile) {
            this.updateProvisionUploadStoreInfo(uploadStore as IFileUploadStore, matchingProfile.fileName, matchingProfile.fileId);
          }
        }
        return uploadStore;
      });
  }

  @action
  public selectSchemeByName(schemeName: string) {
    const selectedScheme = this.sortedXcodeSchemes.find((value) => {
      return value.name === schemeName;
    });

    this.selectedScheme = selectedScheme;
    this.appExtensionProvisionUploadStores = this.getAppExtensionUploadStoresForProject(this.selectedSchemeContainer, selectedScheme);
  }

  @action
  public selectXcodeVersion(version: string) {
    this.selectedXcodeVersion = version;
  }

  @action
  public setTestsEnabled(value: boolean) {
    this.testsEnabled = value;
  }

  @action
  public setLegacyBuildSystemEnabled(value: boolean) {
    this.forceLegacyBuildSystem = value;
  }

  private updateProvisionUploadStoreInfo(
    provisionUploadStore: IFileUploadStore,
    provisionFileName?: string,
    provisionFileId?: string
  ): void {
    //if has Provisioning Profile
    if (provisionFileName && !provisionUploadStore.hasFile) {
      provisionUploadStore.setInfoOnlyFilename(provisionFileName);
      if (this.isSecureFilesEnabled) {
        provisionUploadStore.secureFileId = provisionFileId;
      }
    }
  }

  @action
  public onBranchConfigurationPreLoaded(branchData: BranchData) {
    super.onBranchConfigurationPreLoaded(branchData);
    const config = branchData.config;

    //@ts-ignore init stores only after branch is loaded or it is unconfigured, because "isSecureFilesEnabled" depends on branch configuration
    this.p12UploadStoreDefault = this.isSecureFilesEnabled ? new CertificateSecureFileUploadStore() : new P12FileUploadStore();
    //@ts-ignore
    this.provisionUploadStoreDefault = this.isSecureFilesEnabled
      ? new ProvisionSecureFileUploadStore()
      : new MobileProvisionFileUploadStore();

    if (config && config.toolsets && config.toolsets.xcode) {
      const xcodeToolset = config.toolsets.xcode;

      // Store if there was an existing app provisioning profile before updating the upload store.
      const hasProvisioningProfile =
        xcodeToolset.provisioningProfileFilename && this.provisionUploadStore && !this.provisionUploadStore.hasFile;
      this.updateProvisionUploadStoreInfo(
        this.provisionUploadStore as IFileUploadStore,
        xcodeToolset.provisioningProfileFilename,
        xcodeToolset.provisioningProfileFileId
      );

      const hasCertificate = xcodeToolset.certificateFilename && this.p12UploadStore && !this.p12UploadStore.hasFile;

      if (hasCertificate && this.p12UploadStore) {
        if (xcodeToolset.certificateFilename) {
          this.p12UploadStore.setInfoOnlyFilename(xcodeToolset.certificateFilename);
        }
        if (xcodeToolset.certificatePassword) {
          this.p12UploadStore.passwordChanged(xcodeToolset.certificatePassword);
        }
        if (this.isSecureFilesEnabled) {
          (this.p12UploadStore as IPasswordProtectedFileUploadStore).secureFileId = xcodeToolset.certificateFileId;
        }
      }

      // profile is optional for macOS
      if ((hasProvisioningProfile || (this.repoStore.app && this.repoStore.app.os === OS.MACOS)) && hasCertificate) {
        this.signingEnabled = true;
      }

      const { xcodeVersion } = xcodeToolset;
      if (xcodeVersion) {
        // Set selected Xcode version to 10 Gold Master/Release if saved version is 10 beta
        if (xcodeVersion.startsWith("10.0 beta")) {
          this.selectedXcodeVersion = "10.0";
        } else {
          this.selectedXcodeVersion = xcodeVersion;
        }
      }

      this.testsEnabled = !!config.testsEnabled;

      const useFakeOptions = !branchData.projectsStore || !branchData.projectsStore.isLoaded;
      if (useFakeOptions) {
        const fakeSchemes: IXcodeScheme[] = [
          {
            name: xcodeToolset.scheme || "",
            hasTestAction: !!config.testsEnabled,
          },
        ];
        const fakeProjects: IXcodeSchemeContainer = {
          path: xcodeToolset.projectOrWorkspacePath || "",
          sharedSchemes: fakeSchemes,
          podfilePath: xcodeToolset.podfilePath,
          cartfilePath: xcodeToolset.cartfilePath,
        };

        this.selectedSchemeContainer = fakeProjects;
        this.selectedScheme = fakeSchemes[0];
      } else {
        if (xcodeToolset.projectOrWorkspacePath) {
          this.selectProjectByPath(xcodeToolset.projectOrWorkspacePath);
        }

        if (xcodeToolset.scheme) {
          this.selectSchemeByName(xcodeToolset.scheme);
        }
      }
    } else {
      this.selectedXcodeVersion =
        branchData.xcodeVersionsStore &&
        branchData.xcodeVersionsStore.currentVersion &&
        branchData.xcodeVersionsStore.currentVersion.name;
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
      if (branchData.config && branchData.config.toolsets && branchData.config.toolsets.xcode) {
        // Save existing app extension profile files
        this.appExtensionProvisioningProfileFiles = branchData.config.toolsets.xcode.appExtensionProvisioningProfileFiles;
      }
      // re-populate the selectors
      const schemeName = this.selectedScheme && this.selectedScheme.name;
      if (this.selectedSchemeContainer) {
        this.selectProjectByPath(this.selectedSchemeContainer.path);
      }
      if (schemeName) {
        this.selectSchemeByName(schemeName);
      }
    }

    // this.selectedSchemeContainer will be undefined if project name was renamed for existing build configuration
    if (emptyConfig || !this.selectedSchemeContainer) {
      const projects = this.sortedXcodeProjects;
      if (projects.length > 0) {
        this.selectedSchemeContainer = projects[0];
      }
      this.noProjectsFound = projects.length === 0;

      const schemes = this.sortedXcodeSchemes;
      if (schemes.length > 0) {
        this.selectedScheme = schemes[0];
      }

      if (branchData.xcodeVersionsStore && branchData.xcodeVersionsStore.isLoaded && !this.selectedXcodeVersion) {
        this.selectedXcodeVersion = branchData.xcodeVersionsStore.currentVersion && branchData.xcodeVersionsStore.currentVersion.name;
      }

      this.appExtensionProvisionUploadStores = this.getAppExtensionUploadStoresForProject(
        this.selectedSchemeContainer,
        this.selectedScheme
      );
    }
  }

  @action
  public setAppExtensionProvisioningProfileFiles(branchData: BranchData) {
    if (branchData.config && branchData.config.toolsets && branchData.config.toolsets.xcode) {
      // Save existing app extension profile files
      this.appExtensionProvisioningProfileFiles = branchData.config.toolsets.xcode.appExtensionProvisioningProfileFiles;
    }
  }

  public isSigningValid(): boolean {
    if (this.signingEnabled) {
      if (this.repoStore.app && this.repoStore.app.os === OS.MACOS) {
        // only certificate is required for macOS
        if (!this.p12UploadStore || !this.p12UploadStore.isValid) {
          return false;
        }
      } else {
        if (!this.provisionUploadStore || !this.provisionUploadStore.isValid || !this.p12UploadStore || !this.p12UploadStore.isValid) {
          return false;
        }
      }
    }
    return true;
  }

  @computed
  public get isValid(): boolean {
    const buildValid: boolean =
      !!this.analysisResult && !!this.selectedSchemeContainer && !!this.selectedScheme && !!this.selectedXcodeVersion;
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

    config.testsEnabled = this.testsEnabled && this.selectedScheme && this.selectedScheme.hasTestAction;

    const isReactNativeApp = this.repoStore.app && this.repoStore.app.isReactNativeApp;
    const forceLegacyBuildSystemProps = { forceLegacyBuildSystem: this.forceLegacyBuildSystem };

    if (this.selectedSchemeContainer) {
      config.toolsets.xcode = {
        projectOrWorkspacePath: this.selectedSchemeContainer.path,
        podfilePath: this.selectedSchemeContainer.podfilePath,
        cartfilePath: this.selectedSchemeContainer.cartfilePath,
        scheme: this.selectedScheme && this.selectedScheme.name,
        xcodeVersion: this.selectedXcodeVersion || "",
        xcodeProjectSha: this.selectedSchemeContainer.xcodeProjectSha
          ? this.selectedSchemeContainer.xcodeProjectSha
          : this.getProjectSha(this.selectedScheme && this.selectedScheme.archiveProject),
        archiveConfiguration: this.selectedScheme && this.selectedScheme.archiveConfiguration,
        targetToArchive:
          this.selectedScheme && this.selectedScheme.archiveProject && this.selectedScheme.archiveProject.archiveTargetId,
        ...(this.isXcode10orXcode11 && isReactNativeApp ? forceLegacyBuildSystemProps : {}),
      };

      this.setSigningProperties(config);
    }

    if (telemetry) {
      telemetry["xcode-version"] = this.selectedXcodeVersion;
      telemetry["supports-tests"] = this.selectedScheme && this.selectedScheme.hasTestAction;
      if (this.appExtensionProvisionUploadStores && this.appExtensionProvisionUploadStores.length) {
        telemetry["is-using-app-extensions"] = "true";
        if (this.appExtensionProvisionUploadStores.every((x) => !x.isValid)) {
          telemetry["app-extensions-provisioning-option-not-used"] = "true";
        }
      }
    }
  }

  public onSaveError(error: any): void {
    if (error && error.status === 400 && error.message.indexOf("same type") > 0) {
      // If there was an issue with validating any app extension provisioning profiles
      // due to Type error, we should clear any new uploaded file stores. This prevents
      // the issue of trying to re-save a configuration with non-existent Acfus files.
      this.appExtensionProvisionUploadStores.forEach((uploadStore) => {
        if (uploadStore.hasFile && uploadStore.fileUploadServiceDetails) {
          // Clear any newly uploaded fields
          uploadStore.clear();
        }
      });
    }
  }

  private getProjectSha(archiveProject?: IXcodeArchiveProject): string | undefined {
    if (!archiveProject) {
      return;
    }
    const projects = (this.analysisResult && this.analysisResult.xcode && this.analysisResult.xcode.xcodeSchemeContainers) || [];
    for (const project of projects) {
      if (this.getXcodeProjectName(project) === archiveProject.projectName) {
        return project.xcodeProjectSha;
      }
    }
    return;
  }

  private getXcodeProjectName(project: IXcodeSchemeContainer): string {
    const path = project.path.replace(/[.]xcodeproj[/]project[.]xcworkspace$/, ".xcodeproj");
    const slashIndex = path.lastIndexOf("/");
    if (slashIndex > 0) {
      return path.substr(slashIndex + 1);
    } else {
      return path;
    }
  }

  public setSigningProperties(config: IAHBranchConfiguration): void {
    this.setCertificateSigningProperties(config);

    if (!config.toolsets.xcode) {
      return;
    }

    const appProvisioningProfileFile = this.getProvisioningProfileSigningProperties(
      config,
      this.provisionUploadStore as IFileUploadStore
    );
    if (appProvisioningProfileFile) {
      config.toolsets.xcode.provisioningProfileFileId = appProvisioningProfileFile.fileId;
      config.toolsets.xcode.provisioningProfileFilename = appProvisioningProfileFile.fileName;
      config.toolsets.xcode.provisioningProfileUploadId = appProvisioningProfileFile.uploadId;
    }

    if (this.appExtensionProvisionUploadStores.length) {
      config.toolsets.xcode.appExtensionProvisioningProfileFiles = [];
    }
    this.appExtensionProvisionUploadStores.forEach((uploadStore) => {
      const provisioningProfileFile = this.getProvisioningProfileSigningProperties(
        config,
        uploadStore as IFileUploadStore,
        uploadStore.appExtensionInfo
      );
      if (
        provisioningProfileFile &&
        config.toolsets.xcode &&
        config.toolsets.xcode.appExtensionProvisioningProfileFiles !== undefined
      ) {
        config.toolsets.xcode.appExtensionProvisioningProfileFiles.push(provisioningProfileFile);
      }
    });
  }

  @action
  public setAppExtensions(appExtensionTargets: IosAppExtensionInfo[]) {
    this.appExtensionProvisionUploadStores = appExtensionTargets
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((target) => {
        const uploadStore = new AppExtensionProvisionUploadStore(target);
        if (this.appExtensionProvisioningProfileFiles) {
          const matchingProfile = this.appExtensionProvisioningProfileFiles.find(
            (profile) => profile.targetBundleIdentifier === target.targetBundleIdentifier
          );
          if (matchingProfile) {
            this.updateProvisionUploadStoreInfo(uploadStore as IFileUploadStore, matchingProfile.fileName, matchingProfile.fileId);
          }
        }
        return uploadStore;
      });
  }

  private setCertificateSigningProperties(config: IAHBranchConfiguration): void {
    if (!this.signingEnabled || !this.p12UploadStore || !this.p12UploadStore.isValid || !config.toolsets.xcode) {
      return undefined;
    }
    if (this.p12UploadStore.hasFile) {
      // Try to set upload details for a new certificate file if user has uploaded a new one.
      if (this.isSecureFilesEnabled && this.p12UploadStore.fileUploadServiceDetails) {
        config.toolsets.xcode.certificateUploadId = this.p12UploadStore.fileUploadServiceDetails.id;
      } else if (!!this.p12UploadStore.fileEncoded) {
        config.toolsets.xcode.certificateEncoded = this.p12UploadStore.fileEncoded;
      }
    }
    if (this.isSecureFilesEnabled) {
      // Set file information for a previously uploaded certificate.
      config.toolsets.xcode.certificateFileId = (this.p12UploadStore as IPasswordProtectedFileUploadStore).secureFileId;
    }
    config.toolsets.xcode.certificateFilename = this.p12UploadStore.fileName;
    config.toolsets.xcode.certificatePassword = this.p12UploadStore.password;
  }

  private getProvisioningProfileSigningProperties(
    config: IAHBranchConfiguration,
    uploadStore: IFileUploadStore,
    appExtensionTarget?: IosAppExtensionInfo
  ): IProvisioningProfileFile | undefined {
    if (!this.signingEnabled) {
      return;
    }

    const provisioningProfile: IProvisioningProfileFile = {};
    // on macOS and for app extension prov profile is optional, so by default we are sending EMPTY
    if ((this.repoStore.app && this.repoStore.app.os === OS.MACOS) || appExtensionTarget) {
      provisioningProfile.uploadId = EMPTY_PROVISIONING_PROFILE;
    }

    if (!uploadStore || !uploadStore.isValid) {
      return provisioningProfile;
    }

    // we need to provide the filename when updating the config without re-uploading the cert
    if (uploadStore.hasFile) {
      if (this.isSecureFilesEnabled && uploadStore.fileUploadServiceDetails) {
        provisioningProfile.uploadId = uploadStore.fileUploadServiceDetails.id;
      } else if (!!uploadStore.fileEncoded && config.toolsets.xcode) {
        config.toolsets.xcode.provisioningProfileEncoded = uploadStore.fileEncoded;
      }
    }
    if (this.isSecureFilesEnabled) {
      provisioningProfile.fileId = uploadStore.secureFileId;
      // if a file wasn't uploaded we shouldn't set any value in provisioningProfileUploadId
      if (
        provisioningProfile.uploadId === EMPTY_PROVISIONING_PROFILE &&
        provisioningProfile.fileId &&
        provisioningProfile.fileId !== EMPTY_PROVISIONING_PROFILE
      ) {
        provisioningProfile.uploadId = undefined;
      }
    }
    provisioningProfile.fileName = uploadStore.fileName;
    if (appExtensionTarget) {
      provisioningProfile.targetBundleIdentifier = appExtensionTarget.targetBundleIdentifier;
    }
    return provisioningProfile;
  }

  public distributeMessage(): ConfigureMessage | undefined {
    if (this.distributeToggleDisabled() && this.repoStore.app && this.repoStore.app.os === OS.MACOS) {
      return { type: "error", message: "Only signed builds can be distributed." };
    }
    return super.distributeMessage();
  }
}
