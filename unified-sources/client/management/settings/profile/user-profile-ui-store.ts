import { userStore, locationStore, appStore, notificationStore } from "@root/stores";
import { logger } from "@root/lib/telemetry";
import { CheckUsernameAvailableStore } from "@root/stores/check-username-available-store";
import { computed, observable, action, runInAction } from "mobx";
import { AccountsManagementServiceApi, ApiUserUpdateRequestInternal } from "@root/api/clients/accounts-management-service/api";
import { ResourceRequest } from "@root/data/lib";
import { FetchError } from "@root/lib/http/fetch-error";

export class UserProfileUIStore {
  private checkUserNameAvailableStore: CheckUsernameAvailableStore;
  @observable private updateRequest!: ResourceRequest<ApiUserUpdateRequestInternal>;
  @observable username: string;
  @observable email: string;
  @observable displayName: string;
  @observable showUpdateUsernameConfirmDialogFlag = false;
  @observable private previousEmail!: string;

  constructor() {
    const { currentUser } = userStore;
    this.username = currentUser.name;
    this.email = currentUser.email;
    this.displayName = currentUser.display_name;

    this.checkUserNameAvailableStore = new CheckUsernameAvailableStore();
  }

  get editDisabled(): boolean {
    return false;
  }

  get canCloseAccount(): boolean {
    return true;
  }

  @computed get usernameAvailable(): boolean {
    return this.checkUserNameAvailableStore.available;
  }

  @computed get errorMessage(): string | undefined {
    if (!this.updateRequest) {
      return undefined;
    }

    if (this.updateRequest.isFailed && this.updateRequest.error) {
      const error = this.updateRequest.error as FetchError;
      switch (error.status) {
        case 400:
          return "Oops. Something about this change was not right.";
        case 409:
          return "Oops. This username or email is already taken.";
      }
    }
  }

  @computed get successMessage(): string | undefined {
    if (!this.updated) {
      return undefined;
    }

    if (this.previousEmail !== this.email) {
      return "Sweet! Profile updated successfully. To finish updating your new email address, we will need you to confirm it. Please check your inbox for a confirmation email.";
    }

    return "Sweet! Profile updated successfully";
  }

  @computed get isPending(): boolean {
    return !!this.updateRequest && this.updateRequest.isPending;
  }

  @computed get updated(): boolean {
    return !!this.updateRequest && this.updateRequest.isLoaded;
  }

  @computed get shouldShowUpdateUsernameConfirmDialog(): boolean {
    return this.showUpdateUsernameConfirmDialogFlag;
  }

  openCloseAccountWizard = (): void => {
    logger.info("settings/profile/close-account-button/clicked");
    locationStore.router.push("/settings/profile/close-account");
  };

  openChangePassword = (): void => {
    locationStore.router.push("/settings/profile/password");
  };

  checkUsernameExists = (username: string): Promise<void> => {
    return this.checkUserNameAvailableStore.checkUsernameAvailable(username);
  };

  @action setUsername = (event: React.ChangeEvent<HTMLInputElement>): void => {
    this.username = event.target.value;
  };

  @action setEmail = (event: React.ChangeEvent<HTMLInputElement>): void => {
    this.email = event.target.value;
  };

  @action setDisplayName = (event: React.ChangeEvent<HTMLInputElement>): void => {
    this.displayName = event.target.value;
  };

  @action updateProfile = (): void => {
    const currentName = userStore.currentUser.name;

    const ownApps = appStore.apps.filter((app) => app.owner.name === currentName);
    if (userStore.currentUser.name !== this.username && ownApps.length > 0) {
      this.showUpdateUsernameConfirmDialogFlag = true;
      return;
    }

    this.confirmUpdateProfile();
  };

  @action cancelUpdateProfile = (): void => {
    this.showUpdateUsernameConfirmDialogFlag = false;
  };

  @action confirmUpdateProfile = (): void => {
    this.showUpdateUsernameConfirmDialogFlag = false;
    this.previousEmail = userStore.currentUser.email;
    const userData: ApiUserUpdateRequestInternal = this.editDisabled
      ? {
          name: this.username,
        }
      : {
          displayName: this.displayName,
          name: this.username,
          email: this.email,
        };

    this.updateRequest = new ResourceRequest(
      AccountsManagementServiceApi.updateReturnFeatureFlagsUsers(undefined as any, userData),
      () => null,
      (error, data) => {
        if (!error) {
          runInAction(() => {
            userStore.currentUser.name = data!.name;
            userStore.currentUser.display_name = data!.displayName;
            userStore.currentUser.email = data!.email;
          });
        }
      }
    ).onSuccess(() => {
      const emailChanged = this.email !== this.previousEmail;
      notificationStore.notify({
        message: emailChanged
          ? "Sweet! Profile updated successfully. To finish updating your new email address, we will need you to confirm it. Please check your inbox for a confirmation email."
          : "Sweet! Profile updated successfully",
        persistent: emailChanged,
      });
    }) as any;
  };
}
