import { computed, action, reaction, observable, IReactionDisposer } from "mobx";
import { externalCredentialStore } from "@root/data/shell/stores/external-credentials-store";
import { externalCredentialType, externalServiceType, ExternalCredential, ExternalCredentialOwner } from "@root/data/shell/models";
import { autoProvisioningConfigStore, AutoProvisioningConfigQueryOrOptions } from "../../stores/auto-provisioning-config-store";
import { AutoProvisioningConfig } from "@root/distribute/models/auto-provisioning-config";
import { appStore, locationStore } from "@root/stores";
import { NotificationType, ExternalDataState } from "@root/shared";
import { ResourceRequest } from "@root/data/lib";
import { Routes, MicrosoftInternalGroupId, MicrosoftInternalGroupName } from "../../utils/constants";
import { TelemetryProperty } from "../../utils";
import { getGroupInstallUrl } from "@root/data/distribute/models/distribution-group";
import { distributionStores } from "../../stores/distribution-stores";
import { DistributionGroupListStore } from "@root/distribute/stores/distribution-group-list-store";
import { t } from "@root/lib/i18n";
import { DefaultGroupId, DefaultGroupName } from "@root/distribute/utils/constants";
import { clone } from "lodash";
import { VALIDATION_ERRORS, VALIDATIONS } from "../../../management/utils/formsy/validations";
import { logger } from "@root/lib/telemetry";

export class DistributionGroupSettingsUIStore {
  @observable public showAddCertificateDialog = false;
  @observable public showAddCredentialDialog = false;
  @observable public confirmDialogVisible = false;
  @observable public disableDogfoodingDialogVisible = false;
  @observable public dogfoodNotAllowedDialogVisible = false;
  @observable public updateCredentialDialogVisible = false;
  @observable public turnOffPublicAccessDialogVisible = false;
  @observable public turnOffAutoprovisioningVisible = false;
  @observable public name;
  @observable public isPublic;
  @observable public showReconnectCredentialDialog: boolean = false;
  @observable public showReplaceCertificateDialog: boolean = false;

  @observable private autoprovisioningConfig: AutoProvisioningConfig = new AutoProvisioningConfig({ allowAutoProvisioning: false });
  @observable private error?: string;
  @observable private updateRequested: boolean = false;
  @observable private selectedCredential?: ExternalCredential;

  private telemetryProps: TelemetryProperty = { source: "Settings" };
  private reactionDisposers: IReactionDisposer[] = [];
  private updateReactionDisposer?: IReactionDisposer;

  constructor(private selectedTab: string, private distributionGroupName: string) {
    this.name = distributionGroupName;
    this.reactionDisposers.push(
      this.createConfigCredentialReaction(
        () => !this.isLoadingAutoConfigData && this.selectedAppleCertificate,
        (configDetails) =>
          externalCredentialStore.fetchOne(configDetails.certificateServiceConnectionId, {
            owner: ExternalCredentialOwner.OtherUser,
          })
      )
    );
    this.reactionDisposers.push(
      this.createConfigCredentialReaction(
        () => !this.isLoadingAutoConfigData && this.selectedAppleCredential,
        (configDetails) =>
          externalCredentialStore.fetchOne(configDetails.accountServiceConnectionId, {
            owner: ExternalCredentialOwner.OtherUser,
          })
      )
    );
  }

  public disposeReactions(): any {
    this.reactionDisposers.forEach((disposer) => disposer());
  }

  @action
  public fetchSettings() {
    externalCredentialStore.fetchCollection({
      serviceType: externalServiceType.Apple,
      credentialType: externalCredentialType.Credentials + "," + externalCredentialType.Certificate + "," + externalCredentialType.Key,
    });

    autoProvisioningConfigStore
      .fetchOne(this.autoProvisioningKey, {
        ownerName: appStore.ownerName,
        appName: appStore.app.name,
        destinationName: this.distributionGroupName,
      })
      .onSuccess(
        action((config: AutoProvisioningConfig) => {
          this.autoprovisioningConfig = clone(config);
        }) as any
      );
  }

  @action
  public saveAutoProvisioningConfigSettingsIfFeatureIsActive = (groupName: string): ResourceRequest<any, any> | undefined => {
    const autoProvisioningRequestOptions: AutoProvisioningConfigQueryOrOptions = {
      appName: appStore.app.name!,
      ownerName: appStore.ownerName!,
      destinationName: groupName,
    };
    const existingConfig: AutoProvisioningConfig | undefined = autoProvisioningConfigStore.get(this.autoProvisioningKey);

    if (
      (existingConfig && existingConfig.allowAutoProvisioning !== this.autoprovisioningConfig.allowAutoProvisioning) ||
      (!existingConfig && this.autoprovisioningConfig.allowAutoProvisioning)
    ) {
      logger.info("Toggled autoprovisioning config", {
        autoprovisioning: this.autoprovisioningConfig.allowAutoProvisioning,
      });
    }

    // If config already exists, update it if auto provisioning is enabled. Otherwise delete existing config.
    // If config doesn't already exist, create it if auto provisioning is enabled.
    if (existingConfig) {
      if (this.autoprovisioningConfig.allowAutoProvisioning) {
        return autoProvisioningConfigStore.update(
          existingConfig,
          this.autoprovisioningConfig,
          undefined,
          autoProvisioningRequestOptions
        );
      } else {
        return autoProvisioningConfigStore.delete(existingConfig.id, undefined, autoProvisioningRequestOptions);
      }
    } else if (this.autoprovisioningConfig.allowAutoProvisioning) {
      return autoProvisioningConfigStore.create(
        new AutoProvisioningConfig(this.autoprovisioningConfig),
        undefined,
        autoProvisioningRequestOptions
      );
    }
  };

  @action
  public updateSettings = () => {
    // Ignore all save actions if it's a shared group
    if (this.isSharedGroup) {
      locationStore.goUp();
      return;
    }

    // Reset updating state
    this.error = undefined;
    if (this.updateReactionDisposer) {
      this.updateReactionDisposer();
    }
    this.getGroupListStore().state = ExternalDataState.Idle;
    this.updateRequested = true;
    this.autoprovisioningConfig.id = this.autoProvisioningKey;

    // If the initial name of the group was updated && another group with the same name exists,
    // show a conflict error
    const store = this.getGroupListStore();
    if (this.name !== this.distributionGroupName && store.hasDistributionGroupWithName(this.name)) {
      this.error = t("distribute:groupSettings.errors.nameConflict");
      return;
    }

    if (this.autoprovisioningConfig.allowAutoProvisioning && (!this.selectedAppleCertificate || !this.selectedAppleCredential)) {
      this.error = t("distribute:groupSettings.errors.selectAccountAndCertificate");
      return;
    }

    //
    // Update the distribution group name and public flag for all non-"Collaborators" groups
    //
    const updateAutoProvisioningIfActiveAndFinishUpdate = () => {
      const provisioningRequest = this.saveAutoProvisioningConfigSettingsIfFeatureIsActive(this.name);
      if (provisioningRequest) {
        provisioningRequest.onSuccess(() => this.finishUpdateSettings());
      } else {
        this.finishUpdateSettings();
      }
    };

    if (!this.isDefaultDistributionGroup) {
      this.telemetryProps = Object.assign({}, this.telemetryProps, {
        isPublicChanged: this.distributionGroup!.is_public !== this.isPublic,
        nameChanged: this.distributionGroup!.name !== this.name,
        isPublic: this.isPublic || false,
      });
      store.updateDistributionGroup(this.distributionGroup!.name!, this.name, !!this.isPublicGroup, this.telemetryProps).then(() => {
        updateAutoProvisioningIfActiveAndFinishUpdate();
      });
    } else {
      updateAutoProvisioningIfActiveAndFinishUpdate();
    }
  };

  @action
  private finishUpdateSettings = () => {
    this.updateRequested = false;
    locationStore.pushWithCurrentApp(Routes.DistributionGroupDetails, { tab: this.selectedTab, group_name: this.name });
  };

  @computed
  public get updateNotification() {
    if ((this.updateRequested && this.updateFailed) || this.error) {
      return {
        type: NotificationType.Error,
        message: this.error || t("distribute:groupSettings.errors.updateFailed"),
      };
    }
  }

  @computed
  private get updateFailed() {
    return (
      this.updateRequested &&
      (autoProvisioningConfigStore.updateFailed(this.autoprovisioningConfig) ||
        autoProvisioningConfigStore.creationFailed(this.autoProvisioningKey) ||
        this.getGroupListStore().distributionGroupUpdateFailed)
    );
  }

  @computed
  public get isLoading() {
    return this.isLoadingGroup || this.isLoadingAutoConfigData;
  }

  @computed
  public get isLoadingGroup() {
    return distributionStores.getDistributionGroupListStore(appStore.app).isPending;
  }

  @computed
  public get isLoadingAutoConfigData() {
    return externalCredentialStore.isFetchingCollection || autoProvisioningConfigStore.isFetching(this.autoProvisioningKey);
  }

  @computed
  public get appleCredentials() {
    return externalCredentialStore.resources.filter((credential) => credential.isCredential || credential.isAppleConnectKey);
  }

  @computed
  public get appleCertificates() {
    return externalCredentialStore.resources.filter((credential) => credential.isCertificate);
  }

  @computed
  public get selectedAppleCredential(): ExternalCredential | undefined {
    return this.appleCredentials.find((credential) => credential.id === this.autoprovisioningConfig.accountServiceConnectionId);
  }

  @computed
  public get selectedAppleCertificate(): ExternalCredential | undefined {
    return this.appleCertificates.find((credential) => credential.id === this.autoprovisioningConfig.certificateServiceConnectionId);
  }

  @computed
  public get automaticallyManageDevices() {
    return this.autoprovisioningConfig.allowAutoProvisioning;
  }

  public onCredentialSelect = (previousCredential: ExternalCredential) =>
    action((credential: ExternalCredential) => {
      const { isCredential, isAppleConnectKey } = credential;
      if (!previousCredential || previousCredential.isOwnedByCurrentUser || previousCredential === credential) {
        isCredential || isAppleConnectKey
          ? this.onSelectedAppleCredentialChanged(credential)
          : this.onSelectedAppleCertificateChanged(credential);
      } else {
        this.startConfirmUpdateCredential(credential);
      }
    });

  public onSelectedAppleCredentialChanged = action((credential: ExternalCredential) => {
    this.autoprovisioningConfig.accountServiceConnectionId = credential.id;
  });

  public onSelectedAppleCertificateChanged = action((credential: ExternalCredential) => {
    this.autoprovisioningConfig.certificateServiceConnectionId = credential.id;
  });

  public onAutomaticallyManageDevicesToggleChanged = action((event: any) => {
    const checked = event.target.checked;
    if (checked && this.isPublicGroup) {
      this.startTurnOffPublicAccess();
    } else {
      this.autoprovisioningConfig.allowAutoProvisioning = checked;
    }
  });

  public onReconnectAppleCredentialsClicked = action(() => {
    this.startReconnectAccount();
  });

  public onReplaceAppleCertificateClicked = action(() => {
    this.startReplaceCertificate();
  });

  @action
  public startConfirmUpdateCredential = (credential: ExternalCredential) => {
    this.updateCredentialDialogVisible = true;
    this.selectedCredential = credential;
  };

  @action
  public finishConfirmUpdateCredential = () => {
    this.updateCredentialDialogVisible = false;
    if (!this.selectedCredential) {
      throw new Error("Violation: Selected credential is not set!");
    }
    this.selectedCredential.isCredential
      ? this.onSelectedAppleCredentialChanged(this.selectedCredential)
      : this.onSelectedAppleCertificateChanged(this.selectedCredential);
  };

  @action
  public cancelConfirmUpdateCredential = () => {
    this.updateCredentialDialogVisible = false;
  };

  @action public startAddNewCertificate = () => {
    this.showAddCertificateDialog = true;
  };

  @action
  public cancelAddNewCertificate = () => {
    this.showAddCertificateDialog = false;
  };

  @action
  public finishAddNewCertificate = (certificate: ExternalCredential) => {
    this.showAddCertificateDialog = false;
    this.autoprovisioningConfig.certificateServiceConnectionId = certificate.id;
  };

  @action public startAddNewAccount = () => {
    this.showAddCredentialDialog = true;
  };

  @action
  public cancelAddNewAccount = () => {
    this.showAddCredentialDialog = false;
  };

  @action
  public finishAddNewAccount = (credential: ExternalCredential) => {
    this.showAddCredentialDialog = false;
    this.autoprovisioningConfig.accountServiceConnectionId = credential.id;
  };

  @action
  public startReconnectAccount = () => {
    this.showReconnectCredentialDialog = true;
  };

  @action
  public cancelReconnectAccount = () => {
    this.showReconnectCredentialDialog = false;
  };

  @action
  public finishReconnectAccount = () => {
    this.showReconnectCredentialDialog = false;
  };

  @action
  public startReplaceCertificate = () => {
    this.showReplaceCertificateDialog = true;
  };

  @action
  public cancelReplaceCertificate = () => {
    this.showReplaceCertificateDialog = false;
  };

  @action
  public finishReplaceCertificate = (credential: ExternalCredential) => {
    this.showReplaceCertificateDialog = false;
    this.autoprovisioningConfig.certificateServiceConnectionId = credential.id;
  };

  @action
  public startTurnOffPublicAccess = () => {
    this.turnOffPublicAccessDialogVisible = true;
  };

  @action
  public finishTurnOffPublicAccess = () => {
    this.isPublic = false;
    this.hideTurnOffPublicAccess();
    this.autoprovisioningConfig.allowAutoProvisioning = true;
  };

  @action
  public hideTurnOffPublicAccess = () => {
    this.turnOffPublicAccessDialogVisible = false;
  };

  @action
  public startTurnOffAutoProvisioning = () => {
    this.turnOffAutoprovisioningVisible = true;
  };

  @action
  public finishTurnOffAutoProvisioning = () => {
    this.autoprovisioningConfig.allowAutoProvisioning = false;
    this.hideTurnOffAutoProvisioning();
    this.isPublic = true;
  };

  @action
  public hideTurnOffAutoProvisioning = () => {
    this.turnOffAutoprovisioningVisible = false;
  };

  @action
  public onNameChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    this.error = null as any;
    this.name = event.target.value;
    if (!this.name.trim()) {
      this.error = VALIDATION_ERRORS.DISTRIBUTION_GROUP_DISPLAY_NAME.emptyString;
    } else if (this.name.endsWith(" ")) {
      this.error = VALIDATION_ERRORS.DISTRIBUTION_GROUP_DISPLAY_NAME.trailingSpaces;
    } else if ([...this.name].length > VALIDATIONS.DISTRIBUTION_GROUP_DISPLAY_NAME.maxLength) {
      this.error = VALIDATION_ERRORS.DISTRIBUTION_GROUP_DISPLAY_NAME.maxLength;
    } else if (this.name === ".") {
      this.error = VALIDATION_ERRORS.DISTRIBUTION_GROUP_DISPLAY_NAME.matchRegexp;
    }
  };

  public onIsPublicToggleChanged = action((event: any) => {
    const checked = event.target.checked;
    if (checked && this.automaticallyManageDevices) {
      this.startTurnOffAutoProvisioning();
    } else {
      this.isPublic = checked;
    }
  });

  @action
  public setConfirmDialogVisible(confirmDialogVisible: boolean): void {
    this.confirmDialogVisible = confirmDialogVisible;
  }

  @action
  public setDisableDogfoodingDialogVisible(disableDogfoodingDialogVisible: boolean): void {
    this.disableDogfoodingDialogVisible = disableDogfoodingDialogVisible;
  }

  @computed
  public get switchCredentialDialogTitle() {
    if (!this.selectedCredential) {
      return "";
    }

    if (this.selectedCredential.isCredential) {
      return t("distribute:confirmCredentialChangeDialog.title");
    } else {
      return t("distribute:confirmCertificateChangeDialog.title");
    }
  }

  @computed
  public get switchCredentialDialogDescription() {
    if (!this.selectedCredential) {
      return "";
    }

    if (this.selectedCredential.isCredential) {
      return t("distribute:confirmCredentialChangeDialog.description");
    } else {
      return t("distribute:confirmCertificateChangeDialog.description");
    }
  }

  @computed
  public get applyButtonEnabled() {
    if (!this.distributionGroup) {
      return false;
    }
    return !!this.name && !this.error;
  }

  @computed
  public get isPublicGroup() {
    return typeof this.isPublic === "boolean" ? this.isPublic : this.distributionGroup ? this.distributionGroup.is_public : false;
  }

  @computed
  public get isSharedGroup() {
    return this.distributionGroup ? this.distributionGroup.is_shared : false;
  }

  @computed
  public get publicUrl() {
    return !!this.distributionGroup ? getGroupInstallUrl(appStore.app, this.distributionGroup) : "";
  }

  public hasDistributionGroup(groupName: string) {
    const groups = distributionStores.getDistributionGroupListStore(appStore.app).data!.find((group) => {
      return group.name === groupName;
    });
    return !!groups;
  }

  @computed
  public get distributionGroup() {
    return this.getGroupListStore().selectedGroup;
  }

  @computed
  public get isDefaultDistributionGroup() {
    return this.isLoadingGroup
      ? this.distributionGroupName === DefaultGroupName
      : this.distributionGroup && this.distributionGroup.id === DefaultGroupId;
  }

  @computed
  public get isDogfoodDistributionGroup() {
    return this.isLoadingGroup
      ? this.distributionGroupName === MicrosoftInternalGroupName
      : this.distributionGroup && this.distributionGroup.id === MicrosoftInternalGroupId;
  }

  @action
  public removeGroup = (): void => {
    this.setConfirmDialogVisible(false);
    logger.info("Remove distribution group confirmed", this.telemetryProps);
    this.getGroupListStore().deleteDistributionGroup(this.distributionGroup!.name!, this.telemetryProps);
  };

  @action
  public showRemoveGroupConfirmationDialog = (): void => {
    this.setConfirmDialogVisible(true);
    logger.info("Remove distribution group started", this.telemetryProps);
  };

  @action
  public cancelRemoveGroupConfirmationDialog = (): void => {
    this.setConfirmDialogVisible(false);
    logger.info("Remove distribution group canceled", this.telemetryProps);
  };

  @action
  public disableDogfooding = (): void => {
    this.setDisableDogfoodingDialogVisible(false);
    logger.info("Disable dogfooding confirmed", this.telemetryProps);
    this.getGroupListStore().disableDogfooding(this.telemetryProps);
  };

  @action
  public dismissDogfoodNotAllowedDialog = (): void => {
    this.dogfoodNotAllowedDialogVisible = false;
  };

  @action
  public showDisableDogfoodingConfirmationDialog = (): void => {
    if (!appStore.hasAnyCollaboratorRole(["manager"])) {
      this.dogfoodNotAllowedDialogVisible = true;
      return;
    }

    this.setDisableDogfoodingDialogVisible(true);
    logger.info("Disable dogfooding started", this.telemetryProps);
  };

  @action
  public cancelDisableDogfooding = (): void => {
    this.setDisableDogfoodingDialogVisible(false);
    logger.info("Disable dogfooding canceled", this.telemetryProps);
  };

  @action
  public cancelDisableDogfoodingConfirmationDialog = (): void => {
    this.setDisableDogfoodingDialogVisible(false);
    logger.info("Disable dogfooding canceled", this.telemetryProps);
  };

  public cancelWizard() {
    locationStore.goUp();
    logger.info("Update distribution group canceled");
  }

  @computed
  public get isUpdateInProgress(): boolean {
    return (
      this.getGroupListStore().distributionGroupUpdateInProgress ||
      autoProvisioningConfigStore.isUpdating(this.autoProvisioningKey) ||
      autoProvisioningConfigStore.isCreating(this.autoProvisioningKey) ||
      autoProvisioningConfigStore.isDeleting(this.autoProvisioningKey)
    );
  }

  @computed
  public get isDeleteInProgress(): boolean {
    return this.getGroupListStore().distributionGroupDeleteInProgress;
  }

  private getGroupListStore = (): DistributionGroupListStore => {
    return distributionStores.getDistributionGroupListStore(appStore.app);
  };

  // Creates a reaction for the credential from the configuration which fetches that credential if it didn't exist in the credential store.
  private createConfigCredentialReaction = (reactionExpr, fetchFunction: (configDetails: AutoProvisioningConfig) => void) => {
    return reaction(reactionExpr, (credential) => {
      const credentialValidFetch = !externalCredentialStore.isFetchingCollection && !externalCredentialStore.collectionFetchFailed;
      const configValidFetch =
        !autoProvisioningConfigStore.fetchFailed(this.autoProvisioningKey) &&
        !autoProvisioningConfigStore.isFetching(this.autoProvisioningKey);

      if (!credential && credentialValidFetch && configValidFetch) {
        const configDetails = this.autoprovisioningConfig;
        fetchFunction(configDetails);
      }
    });
  };

  private get autoProvisioningKey() {
    return autoProvisioningConfigStore.configurationKey(appStore.app, this.distributionGroupName);
  }
}
