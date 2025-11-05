import { computed, observable, action } from "mobx";
import { notificationStore } from "@root/stores";
import { base64ToBlob } from "@root/lib/utils/blob";
import { apiGateway } from "@root/lib/http";
import { deviceRegistrationStore } from "./device-registration-store";
import { ProvisioningStatusStrings } from "../utils/strings";

export enum ResigningStatus {
  Started = "started",
  Validating = "validating",
  Resigning = "resigning",
  Uploading = "uploading",
  PreparingForTesters = "preparing_for_testers",
  Complete = "complete",
  Failed = "failed",
}

export class ProvisioningStatus {
  public status?: string;
  public error_code?: string;
  public error_message?: string;
  public profiles_zip_base64?: string;
}

export class ProvisioningStatusStore {
  @observable public resigningStatus?: string;
  @observable public errorCode?: string;
  @observable public errorMessage?: string;
  @observable public provisioningProfilesZipURL?: string;
  private statusUrl?: string;
  private pollingPromise?: Promise<ProvisioningStatus>;
  private fetchInterval = 5000; // 5 seconds

  @computed
  get hasStarted(): boolean {
    return this.resigningStatus === ResigningStatus.Started;
  }

  @computed
  get isValidating(): boolean {
    return this.resigningStatus === ResigningStatus.Validating;
  }

  @computed
  get isResigning(): boolean {
    return this.resigningStatus === ResigningStatus.Resigning;
  }

  @computed
  get isUploading(): boolean {
    return this.resigningStatus === ResigningStatus.Uploading;
  }

  @computed
  get isRunning(): boolean {
    return this.hasStarted || this.isValidating || this.isResigning || this.isUploading;
  }

  @computed
  get hasFailed(): boolean {
    return this.resigningStatus === ResigningStatus.Failed;
  }

  @computed
  get isComplete(): boolean {
    return this.resigningStatus === ResigningStatus.Complete || this.resigningStatus === ResigningStatus.PreparingForTesters;
  }

  @action
  public setStatusUrl(statusUrl?: string): void {
    this.statusUrl = statusUrl;
  }

  @action
  public clearStatusUrl(): void {
    this.statusUrl = undefined;
  }

  @action
  public startPolling(): void {
    this.pollingPromise = this.poll(this.fetchData, this.fetchInterval);
  }

  @action
  public stopPolling(): void {
    if (this.pollingPromise) {
      this.pollingPromise.cancel();
      this.pollingPromise = undefined;
    }
  }

  @action
  public stopPollingAndClearStatusUrl(): void {
    this.stopPolling();
    this.clearStatusUrl();
  }

  @action
  public clear(): void {
    this.stopPolling();
    this.statusUrl = undefined;
    this.resigningStatus = undefined;
    this.errorCode = undefined;
    this.errorMessage = undefined;
  }

  private notifyCompletion(): void {
    notificationStore.notify({
      persistent: false,
      message: ProvisioningStatusStrings.AppResignedAndNewReleaseDistributed,
    });
  }

  private notifyFailure(): void {
    notificationStore.notify({
      persistent: true,
      message: ProvisioningStatusStrings.AnErrorOccurredWhenTryingToResign,
      buttonText: ProvisioningStatusStrings.LearnMoreButton,
      action: () => this.openProvisioningStatusPanel(),
    });
    deviceRegistrationStore.setFailedToast(notificationStore.persistentNotifications[0]);
  }

  private openProvisioningStatusPanel(): void {
    if (deviceRegistrationStore.groupTab && deviceRegistrationStore.groupName) {
      deviceRegistrationStore.openProvisioningStatusPanel(deviceRegistrationStore.groupTab, deviceRegistrationStore.groupName);
    }
  }

  private fetchData = (): Promise<ProvisioningStatus> | void => {
    if (!this.statusUrl) {
      this.stopPolling();
      return;
    }
    if (this.isComplete) {
      this.notifyCompletion();
      this.stopPollingAndClearStatusUrl();
      return;
    }
    if (this.hasFailed) {
      this.notifyFailure();
      this.stopPollingAndClearStatusUrl();
      return;
    }
    return apiGateway
      .get<ProvisioningStatus>(this.statusUrl, {
        params: {
          include_provisioning_profile: "true",
        },
      })
      .then(
        action((result: ProvisioningStatus) => {
          this.resigningStatus = result.status;
          this.errorCode = result.error_code;
          this.errorMessage = result.error_message;
          if (result.profiles_zip_base64) {
            this.createProvisioninProfileURL(result.profiles_zip_base64);
          }

          deviceRegistrationStore.errorMessage = this.errorMessage;
          return result;
        })
      )
      .catch((error) => {
        this.stopPollingAndClearStatusUrl();
        throw error;
      });
  };

  private poll(request: any, interval: number) {
    function pollRecursive(): Promise<any> {
      request();
      return Promise.delay(interval).then(pollRecursive);
    }
    return pollRecursive();
  }

  @action
  private createProvisioninProfileURL(base64ZipFile): void {
    const blob = base64ToBlob(base64ZipFile, "application/zip", 512);
    this.provisioningProfilesZipURL = URL.createObjectURL(blob);
  }
}

export const provisioningStatusStore = new ProvisioningStatusStore();
