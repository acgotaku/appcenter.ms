import * as React from "react";
import { action, observable, computed } from "mobx";
import { ResourceRequest } from "@root/data/lib";
import { userStore, locationStore } from "@root/stores";
import { apiGateway } from "@root/lib/http";
import { API } from "../../../constants/api";
import { RESPONSE_TYPES } from "@lib/common-interfaces";

export class ChangePasswordUIStore {
  @observable private changeRequest!: ResourceRequest<any>;
  @observable private oldPassword!: string;
  @action setOldPassword = (event: React.ChangeEvent<HTMLInputElement>): void => {
    // Clear out the old request, so that the validation errors go away
    this.changeRequest = undefined as any;
    this.oldPassword = event.target.value;
  };

  @observable private newPassword!: string;
  @action setNewPassword = (event: React.ChangeEvent<HTMLInputElement>): void => {
    this.newPassword = event.target.value;
  };

  @computed private get oldPasswordServerError(): string | undefined {
    return this.changeRequest && this.changeRequest.isFailed ? "The old password was incorrect, please try again" : undefined;
  }

  @computed get extraValidationErrors(): { [key: string]: string } | undefined {
    return this.oldPasswordServerError ? { oldPassword: this.oldPasswordServerError } : undefined;
  }

  @computed get isChanging(): boolean {
    return this.changeRequest && this.changeRequest.isPending;
  }

  @action submitPasswordChanged = () => {
    const url = `${window.location.origin}${API.UPDATE_PASSWORD}`;
    const { csrfToken } = (window as any).initProps;

    this.changeRequest = new ResourceRequest(
      apiGateway.post(url, {
        body: {
          old_password: this.oldPassword,
          new_password: this.newPassword,

          // see: https://github.com/expressjs/csurf
          _csrf: csrfToken,
        },
        responseType: RESPONSE_TYPES.TEXT,
        params: {
          userId: userStore.currentUser.id,
        },
      }),
      () => null,
      () => null
    ).onSuccess(() => {
      // If the password was successfully changed, then redirect the user to logout
      locationStore.logoutToSignIn("Password change successful. Please log in with the new password.");
    });
  };
}
