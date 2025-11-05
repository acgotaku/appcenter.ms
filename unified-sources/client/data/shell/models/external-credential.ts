import { observable, computed } from "mobx";
import { last } from "lodash";
import { Model } from "../../lib";
import { t } from "@root/lib/i18n";
export type AppleProfile = { username: string; password: string };
export type JiraProfile = { username: string; password: string; baseUrl: string };
export type GooglePlayProfile = {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
};
export type GitLabProfile = { baseUrl: string; accessToken: string };

export type AppleCertificateProfile = {
  base64Certificate?: string;
  password?: string;
  displayName?: string;
  certificateValidityStartDate?: string;
  certificateValidityEndDate?: string;
};

export type AppleConnectProfile = {
  keyId?: string;
  issuerId?: string;
  key_p8_base64?: string;
  keyName?: string;
  keyAlias?: string;
};

export type ExternalServiceType = "apple" | "jira" | "googleplay" | "gitlab";
export type ExternalCredentialType = "credentials" | "certificate" | "key";

export type CredentialProfileMap = {
  apple: AppleProfile;
  jira: JiraProfile;
  googleplay: GooglePlayProfile;
  gitlab: GitLabProfile;
};

export type CertificateProfileMap = {
  apple: AppleCertificateProfile;
  jira: {};
  googleplay: {};
  gitlab: {};
};

export type AppleKeyProfileMap = {
  apple: AppleConnectProfile;
  jira: {};
  googleplay: {};
  gitlab: {};
};

export type ProfileMap<T extends ExternalServiceType = ExternalServiceType> = {
  certificate: CertificateProfileMap[T];
  credentials: CredentialProfileMap[T];
  key: AppleKeyProfileMap[T];
};

export interface SerializedExternalCredential {
  id: string;
  displayName: string;
  serviceType: string;
  credentialType: string;
  isValid: boolean;
  is2FA: boolean;

  // Data can be either Apple / GooglePlay / Jira
  data: AppleProfile | JiraProfile | GooglePlayProfile | AppleCertificateProfile | GitLabProfile | AppleConnectProfile;
}

export enum ExternalCredentialOwner {
  CurrentUser,
  OtherUser,
}

export interface DeserializedExternalCredential<
  T extends ExternalServiceType = ExternalServiceType,
  U extends ExternalCredentialType = ExternalCredentialType
> {
  id?: string;
  displayName?: string;
  serviceType?: T;
  credentialType?: U;
  owner?: ExternalCredentialOwner;
  is2FA?: boolean;

  // Data can be either Apple / GooglePlay / Jira / GitLab
  profile?: ProfileMap<T>[U];
  isValid?: boolean;
}

export const externalServiceType: { [key: string]: ExternalServiceType } = {
  Apple: "apple",
  Jira: "jira",
  GooglePlay: "googleplay",
  GitLab: "gitlab",
};

export const externalCredentialType: { [key: string]: ExternalCredentialType } = {
  Credentials: "credentials",
  Certificate: "certificate",
  Key: "key",
};

export class ExternalCredential extends Model<DeserializedExternalCredential> implements DeserializedExternalCredential {
  @observable public id!: string;
  @observable public displayName?: string;
  @observable public serviceType?: ExternalServiceType;
  @observable public credentialType?: ExternalCredentialType;
  @observable public profile?:
    | AppleProfile
    | JiraProfile
    | GooglePlayProfile
    | AppleCertificateProfile
    | GitLabProfile
    | AppleConnectProfile;
  @observable public isValid?: boolean;
  @observable public is2FA?: boolean;
  @observable public owner?: ExternalCredentialOwner;

  @computed
  public get isCertificate() {
    return this.credentialType === externalCredentialType.Certificate;
  }

  @computed
  public get isAppleConnectKey() {
    return this.credentialType === externalCredentialType.Key;
  }

  @computed
  public get appleCertificateProfile() {
    return this.isCertificate && this.serviceType === "apple" ? (this.profile as AppleCertificateProfile) : undefined;
  }

  @computed
  public get certificateExpiryDate() {
    return this.isCertificate && this.serviceType === "apple" ? this.appleCertificateProfile?.certificateValidityEndDate : undefined;
  }

  @computed
  public get isCredential() {
    return !this.credentialType || this.credentialType === externalCredentialType.Credentials;
  }

  @computed
  public get friendlyName() {
    return (
      this.displayName ||
      (this.profile as AppleProfile).username ||
      (this.profile as JiraProfile).username ||
      (this.profile as GooglePlayProfile).client_email ||
      (this.profile as AppleCertificateProfile).displayName ||
      (this.profile as AppleConnectProfile).keyAlias ||
      (this.profile as GitLabProfile).baseUrl?.replace(/^https?:\/\//, "")
    );
  }

  @computed
  public get appleCertificateDeveloper() {
    return this.parseAppleCertificateDisplayName[0];
  }

  @computed
  public get appleCertificateType() {
    return this.parseAppleCertificateDisplayName[1];
  }

  @computed
  public get isOwnedByCurrentUser() {
    return this.owner === ExternalCredentialOwner.CurrentUser;
  }

  @computed
  public get parseAppleCertificateDisplayName() {
    // This pretty ugly code is here because the API returns the certificate type and the developer name in the same field.
    // The string parsing should be done server side. Currently there is actually a localization bug as the certificate type is
    // displayed as returned by server.
    const appleCertificateProfile = this.profile as AppleCertificateProfile;
    if (appleCertificateProfile.displayName) {
      const displayName = appleCertificateProfile.displayName;
      const sepIndex = displayName.indexOf(":");
      if (sepIndex !== -1) {
        const certificateType = last(displayName.substring(0, sepIndex).trim().split(" "));
        const developer = displayName.substring(sepIndex + 1).trim();
        return [developer, certificateType];
      }

      return [displayName, null];
    }
    return [null, null];
  }

  @computed
  public get credentialErrorMessage() {
    const keyBase = `distribute:credentials.${this.serviceType}`;
    return this.isValid
      ? null
      : this.isCertificate
      ? t(`${keyBase}.certificateAccount.error`)
      : t(`${keyBase}.developerAccount.error`);
  }

  @computed
  public get credentialRepairAction() {
    const keyBase = `distribute:credentials.${this.serviceType}`;
    return this.isValid
      ? null
      : this.isCertificate
      ? t(`${keyBase}.certificateAccount.repairAction`)
      : t(`${keyBase}.developerAccount.repairAction`);
  }

  @computed
  public get appSpecificPasswordRepairAction() {
    return t("common:button.add");
  }
}

export function isValidExternalServiceType(serviceType: string): serviceType is ExternalServiceType {
  return Object.values(externalServiceType).includes(serviceType as any);
}

export function isValidExternalCredentialType(credentialType: string): credentialType is ExternalCredentialType {
  return Object.values(externalCredentialType).includes(credentialType as any);
}
