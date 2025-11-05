import { observable, action, computed } from "mobx";
import {
  GitLabProfile,
  ExternalCredential,
  ExternalCredentialOwner,
  externalServiceType,
  externalCredentialType,
} from "@root/data/shell/models";
import { externalCredentialStore } from "@root/data/shell/stores/external-credentials-store";
import { FetchError } from "@root/lib/http/fetch-error";
import { t } from "@root/lib/i18n";

export class ConnectGitLabAccountUIStore {
  @observable public credential: ExternalCredential;
  @observable public otherCredential: ExternalCredential;
  @observable public genericErrorMessage: string = "";
  @observable public instanceUrlErrorMessage: string = "";
  @observable public accessTokenErrorMessage: string = "";

  @computed
  public get isValid(): boolean {
    return !!this.accessToken.trim() && !!this.baseUrl;
  }

  @computed
  public get isLoading(): boolean {
    return this.isConnecting || this.isFetching;
  }

  @computed
  public get isNewRecord(): boolean {
    return !this.credential || !this.credential.id;
  }

  @computed
  public get isDifferentOwner(): boolean {
    return this.credential && !!this.credential.id && this.credential.owner !== ExternalCredentialOwner.CurrentUser;
  }

  @computed
  public get otherCredentialExists(): boolean {
    return this.otherCredential && !!this.otherCredential.id;
  }

  @computed
  public get baseUrl(): string {
    return this.profile.baseUrl;
  }

  @computed
  public get accessToken(): string {
    return this.profile.accessToken;
  }

  @computed
  public get instanceUrlValid(): boolean {
    return !this.instanceUrlErrorMessage || this.instanceUrlErrorMessage.length === 0;
  }

  @computed
  public get accessTokenValid(): boolean {
    return !this.accessTokenErrorMessage || this.accessTokenErrorMessage.length === 0;
  }

  constructor() {
    this.credential = this.createInitialCredential();
    this.otherCredential = this.createInitialCredential();
    this.resetState();
  }

  public fetchGitLabCredentialDetails() {
    return externalCredentialStore.fetchCollection(
      {
        serviceType: externalServiceType.GitLab,
        credentialType: externalCredentialType.Credentials,
      },
      { segmentFilter: this.filterCredentials }
    );
  }

  private filterCredentials(credential: ExternalCredential): boolean {
    return credential.serviceType === externalServiceType.GitLab && credential.credentialType === externalCredentialType.Credentials;
  }

  @action
  public loadCredential = (id: string) => {
    externalCredentialStore.fetchOne(id).onSuccess((credential) => {
      if (!credential) {
        return;
      }

      // Fetch this config as well based on service connection id as this connection can be from different user
      this.fetchGitLabCredentialDetails().onSuccess((credentials) => {
        let currentCredential = credentials?.find((otherCredential) => otherCredential.id === id);
        if (currentCredential) {
          credential.owner = ExternalCredentialOwner.CurrentUser;
          this.setCredential(credential, true);
          return;
        }

        currentCredential = credentials?.find(
          (otherCredential) => (otherCredential.profile as GitLabProfile).baseUrl === (credential.profile as GitLabProfile).baseUrl
        );
        credential.owner = ExternalCredentialOwner.OtherUser;
        this.setCredential(credential, !!currentCredential);
        if (currentCredential) {
          this.setOtherCredential(currentCredential);
        }
      });
    });
  };

  private setCredential(credential: ExternalCredential, isTokenUpdate: boolean) {
    this.credential.id = credential.id;
    this.credential.isValid = credential.isValid;
    this.credential.owner = credential.owner;
    this.setBaseUrl((credential.profile as GitLabProfile).baseUrl);
    this.setAccessToken(!isTokenUpdate ? "" : "                    "); // always show placeholder for existing account
    this.genericErrorMessage =
      this.credential.isValid || this.isDifferentOwner ? "" : t("build:connect.errors.gitlab.expiredAccessToken");
  }

  private setOtherCredential(credential: ExternalCredential) {
    this.otherCredential.id = credential.id;
    this.otherCredential.isValid = credential.isValid;
  }

  @action
  public setBaseUrl = (baseUrl: string) => {
    this.profile.baseUrl = baseUrl;
  };

  @action
  public setAccessToken = (accessToken: string) => {
    this.profile.accessToken = accessToken;
  };

  @action
  public connectAccount = () => {
    this.resetErrors();

    if (!/^https?:\/\//i.test(this.baseUrl)) {
      this.setBaseUrl(`https://${this.baseUrl}`);
    }

    let getUrl: URL;
    try {
      getUrl = new URL(this.baseUrl);
    } catch (err) {
      this.instanceUrlErrorMessage = t("build:connect.errors.gitlab.malformedUrl");
      return;
    }

    if (getUrl.protocol !== "https:") {
      this.instanceUrlErrorMessage = t("build:connect.errors.gitlab.invalidProtocol");
      return;
    }

    return externalCredentialStore.create(this.credential, false).onFailure((error) => {
      const fetchError = error as FetchError;
      switch (fetchError.status) {
        case 400:
          if (fetchError.message.includes("host is not reachable")) {
            this.instanceUrlErrorMessage = t("build:connect.errors.gitlab.unreachableError");
            break;
          }
          this.genericErrorMessage = t("build:connect.errors.genericError");
          break;
        case 401:
          this.accessTokenErrorMessage = t("build:connect.errors.gitlab.invalidCredential");
          break;
        case 409:
          this.instanceUrlErrorMessage = t("build:connect.errors.gitlab.accountConflict");
          break;
        default:
          this.genericErrorMessage = t("build:connect.errors.genericError");
          break;
      }
    });
  };

  @action
  public updateAccount = () => {
    this.resetErrors();

    const existingCredential = externalCredentialStore.get(this.isDifferentOwner ? this.otherCredential.id : this.credential.id);
    if (!existingCredential) {
      this.genericErrorMessage = t("management:accounts.errors.gitlab.removedCredentialUpdate");
      return;
    }

    return externalCredentialStore
      .update(existingCredential, {
        profile: this.profile,
      })
      .onSuccess(() => {
        this.loadCredential(this.credential.id);
      })
      .onFailure((error) => {
        const fetchError = error as FetchError;
        if (fetchError.status === 401) {
          this.accessTokenErrorMessage = t("management:accounts.errors.gitlab.invalidCredentialUpdate");
          return;
        } else if (fetchError.status === 400 && fetchError.message.includes("host is not reachable")) {
          this.instanceUrlErrorMessage = t("build:connect.errors.gitlab.unreachableError");
          return;
        }

        this.genericErrorMessage = t("build:connect.errors.genericError");
      });
  };

  @action
  public resetState = () => {
    this.credential = this.createInitialCredential();
    this.otherCredential = this.createInitialCredential();
    this.resetErrors();
  };

  @action
  public resetErrors = () => {
    this.genericErrorMessage = "";
    this.instanceUrlErrorMessage = "";
    this.accessTokenErrorMessage = "";
  };

  @computed
  private get profile(): GitLabProfile {
    return this.credential.profile as GitLabProfile;
  }

  @computed
  private get isConnecting(): boolean {
    return externalCredentialStore.isCreating(this.credential);
  }

  @computed
  private get isFetching(): boolean {
    return externalCredentialStore.isFetching(this.credential.id);
  }

  private createInitialCredential(): ExternalCredential {
    const credential = new ExternalCredential();
    credential.serviceType = "gitlab";
    credential.credentialType = "credentials";
    credential.profile = {
      baseUrl: "",
      accessToken: "",
    };
    credential.isValid = false;
    return credential;
  }
}
