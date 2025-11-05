import { action, observable, computed } from "mobx";
import { externalCredentialStore } from "@root/data/shell/stores/external-credentials-store";
import { orgComplianceSettingStore } from "@root/data/management/stores/org-compliance-setting-store";
import { OrgComplianceSetting } from "@root/data/management/models/org-compliance-setting";
import { t } from "@root/lib/i18n";
import { FetchError } from "@root/lib/http/fetch-error";
export class ComplianceSecurityUIStore {
  @observable public showRemoveIntuneMAMConfigDialog: boolean = false;

  constructor(private orgName: string) {}

  @computed
  public get intuneMAMConfiguredCertificate() {
    return externalCredentialStore.resources.find(
      (credential) => this.intuneMAMOrgSetting && credential.id === this.intuneMAMOrgSetting.certificateConnectionId
    );
  }

  @computed
  public get isFetchingOrDeletingFailed() {
    return (
      orgComplianceSettingStore.collectionFetchFailed ||
      (!!this.intuneMAMOrgSetting &&
        (externalCredentialStore.fetchFailed(this.intuneMAMOrgSetting.certificateConnectionId || "") ||
          orgComplianceSettingStore.deletionFailed(this.intuneMAMOrgSetting.id || "")))
    );
  }

  @computed
  public get errorMessage() {
    const fetchConnectionFailed: FetchError | null =
      this.intuneMAMOrgSetting &&
      externalCredentialStore.fetchError<FetchError>(this.intuneMAMOrgSetting.certificateConnectionId || "");

    if (fetchConnectionFailed && fetchConnectionFailed.code === "not_found") {
      return t("management:intuneMAMConfig.errors.connectionNotFoundError");
    }
    return t("management:intuneMAMConfig.errors.unhandledError");
  }

  @computed
  public get isFetchingOrDeletingComplianceSettings() {
    return (
      orgComplianceSettingStore.isFetchingCollection ||
      (!!this.intuneMAMOrgSetting &&
        (externalCredentialStore.isFetching(this.intuneMAMOrgSetting.certificateConnectionId || "") ||
          orgComplianceSettingStore.isDeleting(this.intuneMAMOrgSetting.id || "")))
    );
  }

  @computed
  public get intuneMAMOrgSetting() {
    return !orgComplianceSettingStore.collectionFetchFailed ? orgComplianceSettingStore.resources[0] : null;
  }

  @computed get isMAMConfigurationValid() {
    return this.intuneMAMConfiguredCertificate ? this.intuneMAMConfiguredCertificate.isValid : false;
  }

  @action
  public fetch() {
    orgComplianceSettingStore
      .fetchCollection({
        orgName: this.orgName,
      })
      .onSuccess(
        action(() => {
          if (this.intuneMAMOrgSetting?.certificateConnectionId) {
            externalCredentialStore.fetchOne(this.intuneMAMOrgSetting.certificateConnectionId);
          }
        })
      );
  }

  @action
  public complianceSecurityConfigURL = (id?: string) => {
    return `/orgs/${this.orgName}/manage/compliance/config` + (id ? `/${id}` : "");
  };

  @action
  public startRemoveMAMConfigConfirmationDialog = () => {
    this.showRemoveIntuneMAMConfigDialog = true;
  };

  @action
  public finishRemoveMAMConfigConfirmationDialog = () => {
    if (this.intuneMAMOrgSetting) {
      this.removeMAMConfig(this.intuneMAMOrgSetting);
    }
    this.showRemoveIntuneMAMConfigDialog = false;
  };

  @action
  public cancelRemoveMAMConfigConfirmationDialog = () => {
    this.showRemoveIntuneMAMConfigDialog = false;
  };

  private removeMAMConfig = (complianceSettings: OrgComplianceSetting) => {
    orgComplianceSettingStore.delete(complianceSettings, false, {
      orgName: this.orgName,
    });
  };
}
