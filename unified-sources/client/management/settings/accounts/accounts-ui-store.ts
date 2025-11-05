import { computed, action, observable } from "mobx";
import { externalCredentialStore } from "@root/data/shell/stores/external-credentials-store";
import { ExternalCredential, externalCredentialType } from "@root/data/shell/models";
import { NotificationType } from "@root/shared";
import { t } from "@root/lib/i18n";

export class AccountsUiStore {
  @observable public isCredentialDialogVisible: boolean = false;
  @observable public isCertificateDialogVisible: boolean = false;
  @observable public isCertificateDialogReplaceable: boolean = false;
  @observable public isAppSpecificPasswordDialogVisible: boolean = false;
  @observable public isDeleteAccountConfirmationVisible: boolean = false;
  @observable public isDeleteCertificateConfirmationVisible: boolean = false;
  @observable public accountToRemove!: ExternalCredential;
  @observable public accountToUpdateAppSpecificPassword!: ExternalCredential;
  @observable public accountToReconnect!: ExternalCredential;
  @observable public certificateToRemove!: ExternalCredential;
  @observable public isAppleConnect: boolean = false;

  @computed
  public get credentials() {
    return externalCredentialStore.resources;
  }

  @computed
  public get appleAccounts() {
    return externalCredentialStore.isFetchingCollection ||
      externalCredentialStore.collectionFetchFailed ||
      !externalCredentialStore.resources
      ? []
      : externalCredentialStore.resources.filter((credential) => credential.isCredential && credential.serviceType === "apple");
  }

  @computed
  public get gitlabAccounts() {
    return externalCredentialStore.isFetchingCollection ||
      externalCredentialStore.collectionFetchFailed ||
      !externalCredentialStore.resources
      ? []
      : externalCredentialStore.resources.filter((credential) => credential.isCredential && credential.serviceType === "gitlab");
  }

  @computed
  public get certificates() {
    return externalCredentialStore.isFetchingCollection ||
      externalCredentialStore.collectionFetchFailed ||
      !externalCredentialStore.resources
      ? []
      : externalCredentialStore.resources.filter((credential) => credential.isCertificate);
  }

  @computed
  public get appleConnectKeys() {
    return externalCredentialStore.isFetchingCollection ||
      externalCredentialStore.collectionFetchFailed ||
      !externalCredentialStore.resources
      ? []
      : externalCredentialStore.resources.filter((key) => key.isAppleConnectKey && key.serviceType === "apple");
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
  public get isAppleAccountsEmpty() {
    return !this.isFetchingCredentials && this.appleAccounts.length === 0;
  }

  @computed
  public get isGitlabAccountsEmpty() {
    return !this.isFetchingCredentials && this.gitlabAccounts.length === 0;
  }

  @computed
  public get isCertificatesEmpty() {
    return !this.isFetchingCredentials && this.certificates.length === 0;
  }

  @computed
  public get isKeysEmpty() {
    return !this.isFetchingCredentials && this.appleConnectKeys.length === 0;
  }

  @computed
  public get isAnyAccountOrCertificate() {
    return (
      this.appleAccounts.length > 0 ||
      this.gitlabAccounts.length > 0 ||
      this.certificates.length > 0 ||
      this.appleConnectKeys.length > 0
    );
  }

  @action
  public fetch() {
    this.accountToRemove = null as any;
    this.certificateToRemove = null as any;
    this.accountToUpdateAppSpecificPassword = null as any;
    externalCredentialStore.fetchCollection({
      credentialType: externalCredentialType.Credentials + "," + externalCredentialType.Certificate + "," + externalCredentialType.Key,
    });
  }

  @action
  public startAddNewAccount = () => {
    this.isCredentialDialogVisible = true;
    this.accountToReconnect = undefined as any;
  };

  @action
  public cancelAddNewAccount = () => {
    this.isCredentialDialogVisible = false;
  };

  @action
  public finishAddNewAccount = () => {
    this.isCredentialDialogVisible = false;
  };

  @action
  public startAddNewCertificate = () => {
    this.isCertificateDialogVisible = true;
    this.isAppleConnect = false;
    this.isCertificateDialogReplaceable = false;
  };

  @action
  public startAddNewAppleConnectKeys = () => {
    this.isCertificateDialogVisible = true;
    this.isAppleConnect = true;
    this.isCertificateDialogReplaceable = false;
  };

  @action
  public startReplaceCertificate = () => {
    this.isCertificateDialogReplaceable = true;
    this.isCertificateDialogVisible = true;
  };

  @action
  public cancelAddNewCertificate = () => {
    this.isCertificateDialogVisible = false;
    this.isAppleConnect = false;
  };

  @action
  public finishAddNewCertificate = () => {
    this.isCertificateDialogVisible = false;
  };

  public startRemoveAccount = (account: ExternalCredential) =>
    action(() => {
      this.accountToRemove = account;
      this.isDeleteAccountConfirmationVisible = true;
    });

  public startReconnectAccount = (account: ExternalCredential) =>
    action(() => {
      this.accountToReconnect = account;
      this.isCredentialDialogVisible = true;
    });

  public updateAppSpecificPassword = (account: ExternalCredential) =>
    action(() => {
      this.accountToUpdateAppSpecificPassword = account;
      this.isAppSpecificPasswordDialogVisible = true;
    });

  @action
  public cancelAppSpecificPassword = () => {
    this.isAppSpecificPasswordDialogVisible = false;
  };

  @action
  public finishAppSpecificPassword = () => {
    this.isAppSpecificPasswordDialogVisible = false;
  };

  public finishRemoveAccount = (account: ExternalCredential) =>
    action(() => {
      this.removeCredential(account);
      this.isDeleteAccountConfirmationVisible = false;
    });

  @action
  public hideRemoveAccountConfirmation = () => {
    this.isDeleteAccountConfirmationVisible = false;
  };

  public startRemoveCertificate = (cert: ExternalCredential) =>
    action(() => {
      this.certificateToRemove = cert;
      this.isDeleteCertificateConfirmationVisible = true;
    });

  public finishRemoveCertificate = (account: ExternalCredential) =>
    action(() => {
      this.removeCredential(account);
      this.isDeleteCertificateConfirmationVisible = false;
    });

  @action
  public hideRemoveCertificateConfirmation = () => {
    this.isDeleteCertificateConfirmationVisible = false;
  };

  @computed
  public get deleteNotification(): { type: NotificationType.Error; message: string } | any {
    if (this.accountToRemove && externalCredentialStore.deletionFailed(this.accountToRemove.id)) {
      return {
        type: NotificationType.Error,
        message: t("management:accounts.errors.removeAccount"),
      };
    } else if (this.certificateToRemove && externalCredentialStore.deletionFailed(this.certificateToRemove.id)) {
      return {
        type: NotificationType.Error,
        message: t("management:accounts.errors.removeCertificate"),
      };
    }
  }

  private removeCredential = (cred: ExternalCredential) => {
    externalCredentialStore.delete(cred);
  };
}

export const accountsUiStore = new AccountsUiStore();
