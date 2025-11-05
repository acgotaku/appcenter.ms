import { locationStore } from "@root/stores";
import { action, computed, observable, IReactionDisposer, reaction } from "mobx";
import { externalCredentialStore } from "@root/data/shell/stores/external-credentials-store";
import { orgComplianceSettingStore } from "@root/data/management/stores/org-compliance-setting-store";
import { ExternalCredential, externalServiceType, externalCredentialType, ExternalCredentialOwner } from "@root/data/shell/models";
import { OrgComplianceSetting } from "@root/data/management/models";
import { FetchError } from "@root/lib/http/fetch-error";
import { t } from "@root/lib/i18n";

export class IntuneMAMConfigModalUIStore {
  @observable public selectedAppleCertificate?: ExternalCredential;
  @observable public showAddCertificateDialog: boolean = false;
  @observable public showReplaceCertificateDialog: boolean = false;
  @observable public showRemoveIntuneMAMConfigDialog: boolean = false;

  private newOrgSetting: OrgComplianceSetting = new OrgComplianceSetting();
  private reactionDisposers: IReactionDisposer[] = [];

  constructor(private orgName: string, private complianceSettingId: string) {
    this.reactionDisposers.push(
      this.createConfigCredentialReaction(
        () => !this.isLoadingComplianceConfigData && !this.selectedCertificate,
        (connectionId) =>
          externalCredentialStore.fetchOne(connectionId, {
            owner: ExternalCredentialOwner.OtherUser,
          })
      )
    );
  }

  @computed
  public get isMAMIntegrated(): boolean {
    return !!this.complianceSettingId;
  }

  public disposeReactions(): any {
    this.reactionDisposers.forEach((disposer) => disposer());
  }

  @computed
  public get selectedCertificate(): ExternalCredential {
    if (this.selectedAppleCertificate) {
      return this.selectedAppleCertificate;
    }

    return this.certificates.find(
      (credential) => this.selectedComplianceSetting && credential.id === this.selectedComplianceSetting.certificateConnectionId
    )!;
  }

  @computed
  public get isSaveComplianceSettingsEnabled() {
    return this.selectedCertificate && this.selectedCertificate.isValid;
  }

  @computed
  public get isLoadingComplianceConfigData() {
    return externalCredentialStore.isFetchingCollection || orgComplianceSettingStore.isFetchingCollection;
  }

  @action
  public dismissWizard(): void {
    locationStore.goUp(false);
  }

  @computed
  public get credentials() {
    return externalCredentialStore.resources;
  }

  @computed
  public get certificates() {
    return this.credentials.filter((credential) => credential.isCertificate);
  }

  @computed get errorNotification() {
    return this.isFetchingCredentialsFailed || this.isAddSettingsFailed || this.isUpdateSettingsFailed || this.isDeleteSettingsFailed;
  }

  @computed get errorMessage() {
    return (
      this.addSettingsError ||
      this.updateSettingsError ||
      this.deleteSettingsError ||
      this.fetchingCredentialsFailed ||
      t("management:intuneMAMConfig.errors.unhandledError")
    );
  }

  @computed
  public get isCertificatesEmpty() {
    return !this.isFetchingCredentials && this.certificates.length === 0;
  }

  @computed
  public get isFetchingCredentials() {
    return externalCredentialStore.isFetchingCollection;
  }

  @computed
  public get isFetchingCredentialsFailed() {
    return externalCredentialStore.collectionFetchFailed;
  }

  @computed
  public get fetchingCredentialsFailed() {
    const collectionFailed = externalCredentialStore.collectionFetchError as FetchError;
    return collectionFailed && collectionFailed.body && collectionFailed.body.message
      ? collectionFailed.body.message
      : t("management:intuneMAMConfig.errors.unhandledError");
  }

  @computed
  public get isAddSettingsFailed() {
    return orgComplianceSettingStore.creationFailed(this.newOrgSetting);
  }

  @computed
  public get addSettingsError() {
    const creationError = orgComplianceSettingStore.creationError<FetchError>(this.newOrgSetting);
    return creationError && creationError.body && creationError.body.message
      ? creationError.body.message
      : t("management:intuneMAMConfig.errors.unhandledError");
  }

  @computed
  public get isUpdateSettingsFailed() {
    return orgComplianceSettingStore.updateFailed(this.complianceSettingId);
  }

  @computed
  public get updateSettingsError() {
    const updateError = orgComplianceSettingStore.updateError<FetchError>(this.complianceSettingId);
    return updateError && updateError.body && updateError.body.message
      ? updateError.body.message
      : t("management:intuneMAMConfig.errors.unhandledError");
  }

  @computed
  public get isDeleteSettingsFailed() {
    return orgComplianceSettingStore.deletionFailed(this.complianceSettingId);
  }

  @computed
  public get deleteSettingsError() {
    const deletionError = orgComplianceSettingStore.creationError<FetchError>(this.complianceSettingId);
    return deletionError && deletionError.body && deletionError.body.message
      ? deletionError.body.message
      : t("management:intuneMAMConfig.errors.unhandledError");
  }

  @action
  public fetch() {
    externalCredentialStore.fetchCollection({
      serviceType: externalServiceType.Apple,
      credentialType: externalCredentialType.Certificate,
    });
  }

  public onSelectedAppleCertificateChanged = (previousCertificate: ExternalCredential) =>
    action((certificate: ExternalCredential) => {
      this.selectedAppleCertificate = certificate;
    });

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
    this.selectedAppleCertificate = certificate;
  };

  @computed
  public get isOrgSettingsAddUpdateInProgress(): boolean {
    return orgComplianceSettingStore.isCreating(this.newOrgSetting) || orgComplianceSettingStore.isUpdating(this.complianceSettingId);
  }

  @computed
  public get isOrgSettingsDeleteInProgress(): boolean {
    return orgComplianceSettingStore.isDeleting(this.complianceSettingId);
  }

  @action
  public addUpdateOrgSetting = () => {
    if (this.complianceSettingId) {
      orgComplianceSettingStore
        .update(this.selectedComplianceSetting, { certificateConnectionId: this.selectedCertificate.id }, true, {
          orgName: this.orgName,
        })
        .onSuccess(() => {
          this.dismissWizard();
        });
    } else {
      this.newOrgSetting.certificateConnectionId = this.selectedCertificate.id;
      orgComplianceSettingStore.create(this.newOrgSetting, true, { orgName: this.orgName }).onSuccess(() => {
        this.dismissWizard();
      });
    }
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
  public finishReplaceCertificate = (certificate: ExternalCredential) => {
    this.showReplaceCertificateDialog = false;
    this.selectedAppleCertificate = certificate;
  };

  @action
  public startRemoveMAMConfigConfirmationDialog = () => {
    this.showRemoveIntuneMAMConfigDialog = true;
  };

  @action
  public finishRemoveMAMConfigConfirmationDialog = () => {
    // TODO: Handle Error Scenarios for delete api and show on UI
    this.showRemoveIntuneMAMConfigDialog = false;
    orgComplianceSettingStore.delete(this.complianceSettingId, true, { orgName: this.orgName }).onSuccess(() => {
      this.dismissWizard();
    });
  };

  @action
  public cancelRemoveMAMConfigConfirmationDialog = () => {
    this.showRemoveIntuneMAMConfigDialog = false;
  };

  @computed
  public get selectedComplianceSetting(): OrgComplianceSetting {
    return orgComplianceSettingStore.resources.find((setting) => setting.id === this.complianceSettingId)!;
  }

  @computed
  public get isCredentialReactionvalid(): boolean {
    // check if credential fetch is successful
    const credentialValidFetch = !externalCredentialStore.isFetchingCollection && !externalCredentialStore.collectionFetchFailed;
    // check if compliance fetch call is successful
    const complianceSettingValidFetch =
      !orgComplianceSettingStore.isFetchingCollection && !orgComplianceSettingStore.collectionFetchFailed;
    // check if compliance exists or not
    const complianceSettingExists = !!this.complianceSettingId && !!this.selectedComplianceSetting;
    return credentialValidFetch && complianceSettingValidFetch && complianceSettingExists;
  }

  // Creates a reaction for the credential from the configuration which fetches that credential if it didn't exist in the credential store.
  private createConfigCredentialReaction = (reactionExpr, fetchFunction: (connectionId: string) => void) => {
    return reaction(reactionExpr, (credential) => {
      if (credential && this.isCredentialReactionvalid) {
        fetchFunction(this.selectedComplianceSetting.certificateConnectionId!);
      }
    });
  };
}
