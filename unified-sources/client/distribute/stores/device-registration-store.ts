import { action, computed, observable } from "mobx";
import { createTransformer } from "mobx-utils";
import { ExternalDataState } from "@root/shared";
import { Toasty } from "@lib/common-interfaces/toaster";
import { notificationStore } from "@root/stores";
import { base64ToBlob } from "@root/lib/utils/blob";
import { provisioningStatusStore } from "./provisioning-status-store";
import { GroupWizardParent } from "../stores/wizard-store";
import { Urls, Routes } from "../utils/constants";
import { Device } from "../models/device";
import { Release } from "../models/release";
import { filter, omitBy, isNil } from "lodash";
import { DistributionStoreErrorStrings, DeviceRegistrationStrings } from "../utils/strings";
import { locationStore, appStore } from "@root/stores";
import { apiGateway } from "@root/lib/http";
import { AutoProvisioningConfig, DeserializedAutoProvisioningConfig } from "../models/auto-provisioning-config";
import { autoProvisioningConfigStore, AutoProvisioningConfigQueryOrOptions } from "./auto-provisioning-config-store";
import { t } from "@root/lib/i18n";
import { ExternalCredential } from "@root/data/shell/models";
import { logger } from "@root/lib/telemetry";

export enum DeviceRegistrationSteps {
  None,
  Error,
  LoginToAppleDeveloperPortal,
  ConfirmDeviceRegistration,
  SuccessfulDeviceRegistration,
}

export enum DeviceRegistrationErrorPage {
  None,
  TwoFactorAuthenticationError,
  UpdatedLicenseAgreement,
  TeamNotFound,
  ProfileNotFound,
  AppleDeveloperProgramExpired,
  AppleAccountNotRegisteredAppleDeveloper,
  UnhandledError,
  AuthenticationFailed,
}

export const AppleConnectorErrorCodes = {
  TwoFactorAuthentication: "two_factor_auth_unsupported",
  LicenseUpdatePending: "license_agreement_updated",
  AuthenticationFailed: "authentication_failed",
  TeamNotFound: "team_not_found",
  ProfileNotFound: "profile_not_found",
  AppleDeveloperProgramExpired: "program_expired",
  AppleAccountNotRegisteredAppleDeveloper: "profile_not_registered_apple_developer",
};

export interface DeviceRegistration {
  profiles_zip_base64: string;
  status_url?: string;
}

export interface DeviceAvailability {
  registered: number;
  available: number;
  maximum: number;
}

export interface AvailabilityOfDevices {
  iphones: DeviceAvailability;
  ipads: DeviceAvailability;
  ipods: DeviceAvailability;
  watches: DeviceAvailability;
}

export interface DevicesToBeRegistered {
  iphones: number;
  ipads: number;
  ipods: number;
  watches: number;
}

export class DeviceRegistrationStore {
  @observable public selectedStep!: number;
  @observable public errorPage!: number;
  @observable public errorMessage?: string;
  @observable public provisioningProfilesZipURL?: string;
  @observable public loggingIntoAppleDeveloper!: ExternalDataState;
  @observable public publishDevicesState!: ExternalDataState;
  @observable public availabilityOfDevices!: AvailabilityOfDevices;
  @observable public devicesToBeRegistered!: DevicesToBeRegistered;
  @observable public unprovisionedDevicesInLatestRelease!: Device[];
  @observable public appleUsername?: string;
  @observable public applePassword?: string;
  @observable public accountServiceConnectionId?: string;
  @observable public isShowingUploadCertCard!: boolean;
  @observable public isConnectingToApple!: boolean;
  @observable public p12CertFileId?: string;
  @observable public p12CertFile: any;
  @observable public p12CertPassword?: string;
  @observable public base64P12CertFile?: string;
  @observable public statusURL?: string;
  @observable public isDistributingRelease!: boolean;
  @observable public groupName?: string;
  @observable public groupTab?: string;
  @observable public appId?: string;
  @observable public release?: Release;
  @observable public failedToast?: Toasty;
  @observable public isRegisterPending: boolean = false;
  @observable public certificateServiceConnectionId?: string;
  private provisioningProfileContentType!: string;

  constructor() {
    this.initialize();
  }

  private static readonly defaultDeviceAvailability: Readonly<AvailabilityOfDevices> = {
    iphones: { registered: 0, available: 0, maximum: 0 },
    ipads: { registered: 0, available: 0, maximum: 0 },
    ipods: { registered: 0, available: 0, maximum: 0 },
    watches: { registered: 0, available: 0, maximum: 0 },
  };

  private static readonly searchKeywordsForDeviceType: { iphones: string; ipads: string; ipods: string; watches: string } = {
    iphones: "iphone",
    ipads: "ipad",
    ipods: "ipod",
    watches: "watch",
  };

  @action
  public initialize = (): void => {
    this.selectedStep = DeviceRegistrationSteps.None;
    this.errorPage = DeviceRegistrationErrorPage.None;
    this.provisioningProfilesZipURL = undefined;
    this.publishDevicesState = ExternalDataState.Idle;
    this.provisioningProfileContentType = "application/zip";
    this.loggingIntoAppleDeveloper = ExternalDataState.Idle;
    this.devicesToBeRegistered = { iphones: 0, ipads: 0, ipods: 0, watches: 0 };
    this.unprovisionedDevicesInLatestRelease = [];
    this.availabilityOfDevices = { ...DeviceRegistrationStore.defaultDeviceAvailability };
    this.appleUsername = "";
    this.applePassword = "";
    this.accountServiceConnectionId = undefined;
    this.certificateServiceConnectionId = undefined;
    this.p12CertFileId = undefined;
    this.p12CertFile = undefined;
    this.p12CertPassword = undefined;
    this.errorMessage = undefined;
    this.base64P12CertFile = undefined;
    this.statusURL = undefined;
    this.isShowingUploadCertCard = false;
    this.isConnectingToApple = false;
    this.isDistributingRelease = false;
    this.groupName = undefined;
    this.groupTab = undefined;
    this.appId = undefined;
    this.release = undefined;
    this.setIsRegisterPending(false);

    if (this.failedToast) {
      const toastId = this.failedToast.id;
      const toast = notificationStore.persistentNotifications.find((notification) => notification.id === toastId);
      notificationStore.dismissNotification(toast!);
      this.failedToast = undefined;
    }

    if (provisioningStatusStore) {
      provisioningStatusStore.clear();
    }
  };

  public isResigningDistributionGroupRelease = createTransformer((groupName) => {
    return this.groupName === groupName && provisioningStatusStore.resigningStatus && !provisioningStatusStore.isComplete;
  });

  public hasFailedResigningDistributionGroupRelease = createTransformer((groupName) => {
    return this.groupName === groupName && provisioningStatusStore.resigningStatus && provisioningStatusStore.hasFailed;
  });

  public isCompleteResigningDistributionGroupRelease = createTransformer((groupName) => {
    return this.groupName === groupName && provisioningStatusStore.resigningStatus && provisioningStatusStore.isComplete;
  });

  public isResigningDistributionGroupReleaseInProgress = createTransformer((groupName) => {
    return (
      this.isResigningDistributionGroupRelease(groupName) ||
      (this.groupName === groupName && this.isGoingToSignRelease && !this.isCompleteResigningDistributionGroupRelease(groupName))
    );
  });

  public hasFinishedResigningDistributionGroupRelease = createTransformer((groupName) => {
    return (
      this.hasFailedResigningDistributionGroupRelease(groupName) ||
      this.isCompleteResigningDistributionGroupRelease(groupName) ||
      this.publishingDevicesHasFailed
    );
  });

  public hasFailedPublishingOrResigning = createTransformer((groupName) => {
    return this.publishingDevicesHasFailed || this.hasFailedResigningDistributionGroupRelease(groupName);
  });

  public getUrlToProvisioningStatus = createTransformer((params: any) => {
    if (this.isDistributingRelease) {
      const url: string = Routes.ProvisioningStatus;
      return locationStore.getUrlWithCurrentApp(url, {
        tab: params["tab"],
        group_name: params["groupName"],
        parent: String(GroupWizardParent.DistributionGroupDetails),
      });
    } else {
      return locationStore.getUrlWithCurrentApp(Routes.ProvisioningStatus, { tab: params["tab"], group_name: params["groupName"] });
    }
  });

  @action
  public setFailedToast = (toast: Toasty): void => {
    this.failedToast = toast;
  };

  @action
  public setAppId = (id: string): void => {
    this.appId = id;
  };

  @action
  public setRelease = (release: Release): void => {
    this.release = release;
  };

  @action
  public setGroupName = (groupName: string) => {
    this.groupName = groupName;
  };

  @action
  public setAccountServiceConnectionId = (value: string) => {
    this.accountServiceConnectionId = value;
  };

  @action
  public setCertificateServiceConnection = (selectedCertificate: ExternalCredential) => {
    this.certificateServiceConnectionId = selectedCertificate.isValid ? selectedCertificate.id : undefined;
  };

  @action
  public openProvisioningStatusPanel = (tab, groupName) => {
    if (!tab || !groupName) {
      return;
    }
    if (this.isDistributingRelease) {
      const url: string = Routes.ProvisioningStatus;
      locationStore.pushWithCurrentApp(url, {
        tab: tab,
        group_name: groupName,
        parent: String(GroupWizardParent.DistributionGroupDetails),
      });
    } else {
      locationStore.pushWithCurrentApp(Routes.ProvisioningStatus, { tab: tab, group_name: groupName });
    }
  };

  @action
  public forceRestartLogin = () => {
    this.selectedStep = DeviceRegistrationSteps.LoginToAppleDeveloperPortal;
    locationStore.goUp();
  };

  @action
  public showLogin = () => {
    this.initialize();
    this.selectedStep = DeviceRegistrationSteps.LoginToAppleDeveloperPortal;
  };

  @computed
  public get resigningStatus(): string {
    return provisioningStatusStore.resigningStatus!;
  }

  @computed
  public get isGoingToSignRelease() {
    return this.isConnectedToAppleDeveloper && this.isShowingUploadCertCard && this.publishDevicesState !== ExternalDataState.Idle;
  }

  @computed
  public get isShowingErrorPage(): boolean {
    return this.errorPage !== DeviceRegistrationErrorPage.None;
  }

  @computed
  public get inProcessOfSigningIn(): boolean {
    return this.errorPage === DeviceRegistrationErrorPage.TwoFactorAuthenticationError;
  }

  @computed
  public get isLoggingIn(): boolean {
    return this.loggingIntoAppleDeveloper === ExternalDataState.Pending;
  }

  @computed
  public get isPublishingDevices(): boolean {
    return this.publishDevicesState === ExternalDataState.Pending;
  }

  @computed
  public get publishingDevicesHasStarted(): boolean {
    return this.publishDevicesState !== ExternalDataState.Idle;
  }

  @computed
  public get publishingDevicesHasFailed(): boolean {
    return this.publishDevicesState === ExternalDataState.Failed;
  }

  @computed
  public get publishingDevicesHasFinished() {
    return this.publishDevicesState === ExternalDataState.Loaded;
  }

  @computed
  public get isUploadingP12Cert(): boolean {
    if (!this.isShowingUploadCertCard) {
      return false;
    }
    return !this.p12CertFile;
  }

  @computed
  public get isConnectedToAppleDeveloper(): boolean {
    return (
      this.loggingIntoAppleDeveloper === ExternalDataState.Loaded &&
      ((this.appleUsername !== "" && this.applePassword !== "") || !!this.accountServiceConnectionId)
    );
  }

  @computed
  public get hasStatusURL(): boolean {
    return !!this.statusURL;
  }

  /**
   * Returns device types list ('iphones', 'ipads', 'ipods', 'watches')
   * for which the limit has been reached.
   */
  @computed
  public get deviceTypesReachedLimit(): string[] {
    const deviceTypes = Object.keys(this.devicesToBeRegistered);
    const deviceTypesReachedLimit: any[] = [];
    deviceTypes.forEach((deviceType) => {
      if ((this.availabilityOfDevices[deviceType] as DeviceAvailability).available < this.devicesToBeRegistered[deviceType]) {
        deviceTypesReachedLimit.push(deviceType);
      }
    });
    return deviceTypesReachedLimit;
  }

  @computed
  public get allDeviceTypesReachedLimit(): boolean {
    const deviceTypes = Object.keys(this.devicesToBeRegistered);
    return deviceTypes.length === this.deviceTypesReachedLimit.length;
  }

  @computed
  public get allDevicesCanBeRegistered(): boolean {
    return this.deviceTypesReachedLimit.length === 0;
  }

  /**
   * Returns the devices list which can be provisioned on Apple side.
   */
  @computed
  public get devicesToBeProvisioned(): Device[] {
    const deviceTypes = Object.keys(this.devicesToBeRegistered);

    const devices: Device[] = [];
    deviceTypes.forEach((deviceType) => {
      if ((this.availabilityOfDevices[deviceType] as DeviceAvailability).available >= this.devicesToBeRegistered[deviceType]) {
        devices.push(...this.getUnprovisionedDevicesForType(deviceType));
      }
    });

    return devices;
  }

  private getUnprovisionedDevicesForType = (deviceType: string): Device[] => {
    if (this.unprovisionedDevicesInLatestRelease.length === 0) {
      return [];
    }

    const searchKeyWord = DeviceRegistrationStore.searchKeywordsForDeviceType[deviceType];
    if (!searchKeyWord) {
      return [];
    }
    return this.unprovisionedDevicesInLatestRelease.filter((device) => device.deviceName.toLowerCase().includes(searchKeyWord));
  };

  @computed
  public get shouldShowProvisioningStatus() {
    return (
      this.isPublishingDevices ||
      (this.groupName && this.isResigningDistributionGroupRelease(this.groupName)) ||
      (this.isConnectedToAppleDeveloper &&
        this.isShowingUploadCertCard &&
        (this.publishingDevicesHasStarted || this.publishingDevicesHasFinished)) ||
      this.resigningStatus
    );
  }

  @computed
  public get deviceRegistrationErrorMessage() {
    switch (this.errorPage) {
      case DeviceRegistrationErrorPage.TwoFactorAuthenticationError:
        return t("distribute:deviceRegistrationErrors.twoFactorAuthenticationError");
      case DeviceRegistrationErrorPage.UpdatedLicenseAgreement:
        return t("distribute:deviceRegistrationErrors.updatedLicenseAgreement");
      case DeviceRegistrationErrorPage.TeamNotFound:
        return t("distribute:deviceRegistrationErrors.teamNotFound");
      case DeviceRegistrationErrorPage.ProfileNotFound:
        return t("distribute:deviceRegistrationErrors.profileNotFound");
      case DeviceRegistrationErrorPage.AppleDeveloperProgramExpired:
        return t("distribute:deviceRegistrationErrors.appleDeveloperProgramExpired");
      case DeviceRegistrationErrorPage.AppleAccountNotRegisteredAppleDeveloper:
        return t("distribute:deviceRegistrationErrors.appleAccountNotRegisteredAppleDeveloper");
      case DeviceRegistrationErrorPage.UnhandledError:
        return t("distribute:deviceRegistrationErrors.unhandledError");
      case DeviceRegistrationErrorPage.AuthenticationFailed:
        return t("distribute:deviceRegistrationErrors.unhandledError");
      default:
        return this.errorMessage;
    }
  }

  @action
  public setAppleUsername = (username: string): void => {
    this.appleUsername = username;
  };

  @action
  public setApplePassword = (password: string): void => {
    this.applePassword = password;
  };

  @action
  public setGroupTab = (tab: string): void => {
    this.groupTab = tab;
  };

  @action
  public resetP12File = (): void => {
    this.p12CertFileId = undefined;
    this.p12CertFile = undefined;
    this.p12CertPassword = undefined;
    this.base64P12CertFile = undefined;
    this.certificateServiceConnectionId = undefined;
  };

  @action
  public clearErrorMessage = (): void => {
    this.errorMessage = undefined;
    this.errorPage = DeviceRegistrationErrorPage.None;
  };

  @action
  public setDevicesToBeRegistered = (unprovisionedDevices: Device[]): void => {
    this.devicesToBeRegistered = this.getDevicesToBeRegistered(unprovisionedDevices);
  };

  @action
  public setUnprovisionedDevicesInLatestRelease = (unprovisionedDevices: Device[]): void => {
    this.unprovisionedDevicesInLatestRelease = unprovisionedDevices;
  };

  @action
  public setStateNoDevices = () => {
    this.loggingIntoAppleDeveloper = ExternalDataState.Idle;
    this.availabilityOfDevices = { ...DeviceRegistrationStore.defaultDeviceAvailability };
    this.selectedStep = DeviceRegistrationSteps.ConfirmDeviceRegistration;
  };

  @action
  public loadAvailabilityOfDevices = (
    email: string | undefined,
    password: string | undefined,
    groupName: string,
    accountServiceConnnection: ExternalCredential,
    releaseId?: number
  ): Promise<AvailabilityOfDevices | void> => {
    this.appleUsername = email;
    this.applePassword = password;
    this.loggingIntoAppleDeveloper = ExternalDataState.Pending;
    this.errorMessage = undefined;
    this.groupName = groupName;
    return this.postGetAvailabilityOfDevices(email, password, groupName, accountServiceConnnection.id, releaseId)
      .then(
        action((availabilityOfDevices: AvailabilityOfDevices) => {
          this.loggingIntoAppleDeveloper = ExternalDataState.Loaded;
          this.availabilityOfDevices = availabilityOfDevices;
          this.selectedStep = DeviceRegistrationSteps.ConfirmDeviceRegistration;
          this.errorPage = DeviceRegistrationErrorPage.None;
          logger.info("Provisioning: successfully connected to Apple Developer Portal and loaded availability of devices", {
            source: this.isDistributingRelease ? "Distribute new release" : "Register devices",
          });
          return availabilityOfDevices;
        })
      )
      .catch(
        action((error: any) => {
          this.loggingIntoAppleDeveloper = ExternalDataState.Failed;
          switch (error.body.code) {
            case AppleConnectorErrorCodes.AuthenticationFailed:
              this.selectedStep = DeviceRegistrationSteps.None;
              this.errorPage = DeviceRegistrationErrorPage.AuthenticationFailed;
              this.errorMessage = DistributionStoreErrorStrings.WrongCredentials;
              accountServiceConnnection.isValid = false;
              break;
            case AppleConnectorErrorCodes.TwoFactorAuthentication:
              this.selectedStep = DeviceRegistrationSteps.None;
              this.errorPage = DeviceRegistrationErrorPage.TwoFactorAuthenticationError;
              break;
            case AppleConnectorErrorCodes.LicenseUpdatePending:
              this.selectedStep = DeviceRegistrationSteps.None;
              this.errorPage = DeviceRegistrationErrorPage.UpdatedLicenseAgreement;
              break;
            case AppleConnectorErrorCodes.TeamNotFound:
              this.selectedStep = DeviceRegistrationSteps.None;
              this.errorPage = DeviceRegistrationErrorPage.TeamNotFound;
              this.errorMessage = error.body.message;
              break;
            case AppleConnectorErrorCodes.ProfileNotFound:
              this.selectedStep = DeviceRegistrationSteps.None;
              this.errorPage = DeviceRegistrationErrorPage.ProfileNotFound;
              break;
            case AppleConnectorErrorCodes.AppleDeveloperProgramExpired:
              this.selectedStep = DeviceRegistrationSteps.None;
              this.errorPage = DeviceRegistrationErrorPage.AppleDeveloperProgramExpired;
              break;
            case AppleConnectorErrorCodes.AppleAccountNotRegisteredAppleDeveloper:
              this.selectedStep = DeviceRegistrationSteps.None;
              this.errorPage = DeviceRegistrationErrorPage.AppleAccountNotRegisteredAppleDeveloper;
              break;
            default:
              this.errorPage = DeviceRegistrationErrorPage.UnhandledError;
              this.errorMessage = error.body.message || "";
          }
          this.selectedStep = DeviceRegistrationSteps.ConfirmDeviceRegistration;
        })
      );
  };

  @action
  public publishDevices = (groupName: string, publishAllDevices: boolean): Promise<DeviceRegistration | void> => {
    this.publishDevicesState = ExternalDataState.Pending;
    this.errorMessage = undefined;
    this.groupName = groupName;
    return this.postPublishDevices(
      groupName,
      this.appleUsername,
      this.applePassword,
      this.accountServiceConnectionId!,
      publishAllDevices
    )
      .then(
        action((result: DeviceRegistration) => {
          this.publishDevicesState = ExternalDataState.Loaded;
          this.createProvisioninProfileURL(result);
          this.selectedStep = DeviceRegistrationSteps.SuccessfulDeviceRegistration;
          logger.info("Provisioning: successfully connected to Apple Developer Portal and published devices", {
            source: this.isDistributingRelease ? "Distribute new release" : "Register devices",
          });
          return result;
        })
      )
      .catch(
        action((error: any) => {
          this.publishDevicesState = ExternalDataState.Failed;
          this.errorMessage = (error && error.body && error.body.message) || "";
          notificationStore.notify({
            persistent: true,
            message: DeviceRegistrationStrings.AnErrorOccurredWhenTryingToPublishDevices,
            buttonText: DeviceRegistrationStrings.LearnMoreButton,
            action: () => this.openProvisioningStatusPanel(this.groupTab, this.groupName),
          });
          this.setFailedToast(notificationStore.persistentNotifications[0]);
        })
      );
  };

  @action
  public publishAndResignDevices = (
    groupName: string,
    appleAccountServiceConnectionId: string,
    appleCertificateServiceConnectionId: string,
    releaseId: number
  ): Promise<DeviceRegistration | void> => {
    this.selectedStep = DeviceRegistrationSteps.SuccessfulDeviceRegistration;
    this.publishDevicesState = ExternalDataState.Pending;
    this.groupName = groupName;
    const publishAllDevices = this.allDevicesCanBeRegistered;
    const deviceUdids: string[] = publishAllDevices ? [] : this.devicesToBeProvisioned.map((device) => device.udid);

    return this.postPublishAndResignDevices(
      groupName,
      this.appleUsername,
      this.applePassword,
      this.base64P12CertFile!,
      this.p12CertPassword!,
      publishAllDevices,
      deviceUdids,
      appleAccountServiceConnectionId,
      appleCertificateServiceConnectionId,
      releaseId
    )
      .then(
        action((result: DeviceRegistration) => {
          this.publishDevicesState = ExternalDataState.Loaded;
          if (result.profiles_zip_base64) {
            this.createProvisioninProfileURL(result);
          }
          this.statusURL = result.status_url;
          this.selectedStep = DeviceRegistrationSteps.SuccessfulDeviceRegistration;
          this.startPolling();
          logger.info("Provisioning: successfully connected to Apple Developer Portal, published devices, and started resigning", {
            source: this.isDistributingRelease ? "Distribute new release" : "Register devices",
          });
          return result;
        })
      )
      .catch(
        action((error: any) => {
          this.publishDevicesState = ExternalDataState.Failed;
          this.errorMessage = (error && error.body && error.body.message) || "";
          notificationStore.notify({
            persistent: true,
            message: DeviceRegistrationStrings.AnErrorOccurredWhenTryingToPublishDevices,
            buttonText: DeviceRegistrationStrings.LearnMoreButton,
            action: () => this.openProvisioningStatusPanel(this.groupTab, this.groupName),
          });
          this.setFailedToast(notificationStore.persistentNotifications[0]);
        })
      );
  };

  public loginAndClose = (
    email: string | undefined,
    password: string | undefined,
    groupName: string,
    accountServiceConnnection: ExternalCredential,
    releaseId?: number
  ): void => {
    this.loadAvailabilityOfDevices(email, password, groupName, accountServiceConnnection, releaseId).then(
      // @ts-ignore. [Should fix it in the future] Strict error.
      action((availabilityOfDevices: AvailabilityOfDevices) => {
        if (availabilityOfDevices) {
          if (accountServiceConnnection) {
            this.isShowingUploadCertCard = false;
          } else {
            this.isShowingUploadCertCard = true;
          }
          this.selectedStep = DeviceRegistrationSteps.None;
        }
      })
    );
  };

  @action
  public setIsRegisterPending = (value: boolean) => {
    this.isRegisterPending = value;
  };

  @action
  public cancelAppleSignIn = (): void => {
    this.selectedStep = DeviceRegistrationSteps.None;
    this.provisioningProfilesZipURL = undefined;
    this.publishDevicesState = ExternalDataState.Idle;
    this.loggingIntoAppleDeveloper = ExternalDataState.Idle;
    this.appleUsername = "";
    this.applePassword = "";
    this.statusURL = undefined;
    this.isShowingUploadCertCard = false;
    this.isConnectingToApple = false;
    this.clearErrorMessage();
    this.resetP12File();
  };

  @action
  public closePanel = () => {
    if (this.groupName && !this.isResigningDistributionGroupRelease(this.groupName)) {
      this.stopPolling();
    }
    if (this.groupName && this.hasFinishedResigningDistributionGroupRelease(this.groupName)) {
      this.initialize();
    } else if (!this.isPublishingDevices) {
      this.selectedStep = DeviceRegistrationSteps.None;
      this.errorPage = DeviceRegistrationErrorPage.None;
      this.clearErrorMessage();
    }
    locationStore.goUp();
  };

  @action
  public closeProvisionStatusPanel = () => {
    if (
      this.groupName &&
      (this.hasFailedPublishingOrResigning(this.groupName) || this.isCompleteResigningDistributionGroupRelease(this.groupName))
    ) {
      this.stopPolling();
      this.initialize();
      this.clearErrorMessage();
    }
    locationStore.goUp();
  };

  @action
  public selectLastPanel = () => {
    this.selectedStep = DeviceRegistrationSteps.SuccessfulDeviceRegistration;
  };

  @action
  public toggleUploadCertCard = (state: boolean): void => {
    this.isShowingUploadCertCard = state;
    if (!state) {
      this.resetP12File();
    }
  };

  @action
  public toggleConnectToAppleDialog = (state: boolean): void => {
    this.isConnectingToApple = state;
    if (this.isConnectingToApple) {
      this.selectedStep = DeviceRegistrationSteps.LoginToAppleDeveloperPortal;
    } else {
      this.cancelAppleSignIn();
    }
  };

  @action
  public setIsDistributingRelease = (state: boolean): void => {
    this.isDistributingRelease = state;
  };

  @action
  public setP12CertFileId = (p12CertFileId: string): void => {
    this.p12CertFileId = p12CertFileId;
  };

  @action
  public setP12CertFile = (p12CertFile: any): void => {
    this.p12CertFile = p12CertFile;
    this.createBase64P12File(this.p12CertFile);
  };

  @action
  public setP12CertPassword = (password: string): void => {
    this.p12CertPassword = password;
  };

  @action
  public resetP12CertUpload = (): void => {
    this.resetP12File();
  };

  public isDistributionDisabled = (groupName: string): boolean => {
    let isDisabled: boolean = this.isResigningDistributionGroupReleaseInProgress(groupName);
    if (this.isCompleteResigningDistributionGroupRelease(groupName) || this.hasFailedPublishingOrResigning(groupName)) {
      isDisabled = false;
    }
    return isDisabled;
  };

  @action
  public addUpdateGroupProvisioningConfig = (
    appleAccountServiceConnectionId: string,
    appleCertificateServiceConnectionId: string,
    groupName: string
  ) => {
    this.groupName = groupName;

    const autoProvisioningConfig: Partial<DeserializedAutoProvisioningConfig> = {
      accountServiceConnectionId: appleAccountServiceConnectionId,
      certificateServiceConnectionId: appleCertificateServiceConnectionId,
      allowAutoProvisioning: false,
    };

    const autoProvisioningCreateUpdateOptions: AutoProvisioningConfigQueryOrOptions = {
      appName: appStore.app.name!,
      ownerName: appStore.ownerName!,
      destinationName: groupName,
    };

    const existingConfig: AutoProvisioningConfig | undefined = autoProvisioningConfigStore.get(
      `${appStore.ownerName}-${appStore.app.name}-${this.groupName}`
    );
    if (existingConfig) {
      autoProvisioningConfig.allowAutoProvisioning = existingConfig.allowAutoProvisioning;
      autoProvisioningConfigStore.update(existingConfig, autoProvisioningConfig, undefined, autoProvisioningCreateUpdateOptions);
    } else {
      autoProvisioningConfigStore.create(
        new AutoProvisioningConfig(autoProvisioningConfig),
        undefined,
        autoProvisioningCreateUpdateOptions
      );
    }
  };

  @action
  private createProvisioninProfileURL = (deviceRegistrationData: DeviceRegistration): void => {
    const sliceSize = 512;
    const blob = base64ToBlob(deviceRegistrationData.profiles_zip_base64, this.provisioningProfileContentType, sliceSize);
    this.provisioningProfilesZipURL = URL.createObjectURL(blob);
  };

  private createBase64P12File = (file): void => {
    const reader = new FileReader();
    const store = this;
    reader.readAsBinaryString(file);
    reader.onload = function () {
      store.base64P12CertFile = btoa(reader.result as string); // The result of readAsBinaryString is always a string
    };
  };

  private postPublishDevices(
    groupName: string,
    email: string | undefined,
    password: string | undefined,
    accountServiceConnectionId: string,
    publishAllDevices: boolean
  ): Promise<DeviceRegistration> {
    return apiGateway.post<DeviceRegistration>(Urls.PostPublishDevices, {
      params: {
        app_name: appStore.name,
        owner_name: appStore.ownerName,
        distribution_group_name: groupName,
      },
      body: {
        username: email,
        password: password,
        account_service_connection_id: accountServiceConnectionId,
        publish_all_devices: publishAllDevices,
      },
    });
  }

  private postPublishAndResignDevices(
    groupName: string,
    email: string | undefined,
    password: string | undefined,
    p12Base64: string,
    p12Password: string,
    publishAllDevices: boolean,
    deviceUdids: string[],
    accountServiceConnectionId: string,
    certificateServiceConnectionId: string,
    releaseId: number
  ): Promise<DeviceRegistration> {
    return apiGateway.post<DeviceRegistration>(Urls.PostPublishAndResignDevices, {
      params: {
        app_name: appStore.name,
        owner_name: appStore.ownerName,
        release_id: releaseId.toString(),
      },
      body: omitBy(
        {
          username: email,
          password: password,
          publish_all_devices: publishAllDevices,
          p12_base64: p12Base64,
          p12_password: p12Password || "",
          release_id: releaseId,
          account_service_connection_id: accountServiceConnectionId,
          p12_service_connection_id: certificateServiceConnectionId,
          devices: deviceUdids,
          destinations: [{ name: groupName }],
        },
        isNil
      ),
    });
  }

  private postGetAvailabilityOfDevices(
    email: string | undefined,
    password: string | undefined,
    groupName: string,
    accountServiceConnnectionId: string,
    releaseId?: number
  ): Promise<AvailabilityOfDevices> {
    return apiGateway.post<AvailabilityOfDevices>(Urls.PostGetAvailabilityOfDevices, {
      params: {
        app_name: appStore.name,
        owner_name: appStore.ownerName,
        distribution_group_name: groupName,
      },
      body: omitBy(
        {
          username: email,
          password: password,
          release_id: releaseId,
          service_connection_id: accountServiceConnnectionId,
        },
        isNil
      ),
    });
  }

  public startPolling = (url?: string): void => {
    provisioningStatusStore.setStatusUrl(url || this.statusURL);
    provisioningStatusStore.startPolling();
  };

  public stopPolling(): void {
    provisioningStatusStore.stopPolling();
  }

  private getDevicesToBeRegistered(unprovisionedDevices: Device[]): DevicesToBeRegistered {
    const iphones = filter(unprovisionedDevices, (device) =>
      device.deviceName.toLowerCase().includes(DeviceRegistrationStore.searchKeywordsForDeviceType.iphones)
    ).length;
    const ipads = filter(unprovisionedDevices, (device) =>
      device.deviceName.toLowerCase().includes(DeviceRegistrationStore.searchKeywordsForDeviceType.ipads)
    ).length;
    const ipods = filter(unprovisionedDevices, (device) =>
      device.deviceName.toLowerCase().includes(DeviceRegistrationStore.searchKeywordsForDeviceType.ipods)
    ).length;
    const watches = filter(unprovisionedDevices, (device) =>
      device.deviceName.toLowerCase().includes(DeviceRegistrationStore.searchKeywordsForDeviceType.watches)
    ).length;

    return { iphones, ipads, ipods, watches };
  }
}

export const deviceRegistrationStore = new DeviceRegistrationStore();
