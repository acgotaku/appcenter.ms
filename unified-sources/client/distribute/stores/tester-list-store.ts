import { noop } from "lodash";
import { computed, observable, action, IObservableArray } from "mobx";
import { Urls } from "../utils/constants";
import { DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore, ExternalDataState } from "@root/shared";
import { IApp, RESPONSE_TYPES } from "@lib/common-interfaces";
import { appStore } from "@root/stores";
import { apiGateway } from "@root/lib/http";
import { DistributionGroupUser } from "../models/distribution-group-user";
import { notificationStore } from "@root/stores";
import { t } from "@root/lib/i18n";
import { logger } from "@root/lib/telemetry";

export class TesterListStore extends DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore<IObservableArray<DistributionGroupUser>> {
  private _groupName: string;

  constructor(groupName: string, seed?: DistributionGroupUser[]) {
    super(ExternalDataState.Loaded);
    this._groupName = groupName;
    this.fetchTesterList = this.fetchTesterList;
    this.deleteTesters = this.deleteTesters;
    this.addTesters = this.addTesters;
    if (seed) {
      this.data = observable(seed);
    }
  }

  @computed public get dataArray() {
    return this.data ? this.data.slice() : [];
  }

  public fetchTesterList = (): Promise<void> => {
    const fetchDataPromise = apiGateway.get<IObservableArray<DistributionGroupUser>>(Urls.DistributionGroupMembers, {
      params: {
        app_name: appStore.name,
        owner_name: appStore.ownerName,
        distribution_group_name: this._groupName,
      },
    });

    if (this.data) {
      return this.loadInBackgroundVoid(fetchDataPromise);
    } else {
      return this.loadVoid(fetchDataPromise);
    }
  };

  @action
  public deleteTesters = (userEmails: string[]): Promise<void> => {
    const app: IApp = appStore.app;
    const body = { user_emails: userEmails };

    // Optimistically remove users from list
    const users = this.dataArray.filter((user) => userEmails.includes(user.email!));
    if (this.data) {
      users.forEach((user) => this.data!.remove(user));
    }

    const deletePromise: Promise<any> = apiGateway.post(Urls.BulkDeleteDistributionGroupMembers, {
      params: {
        owner_name: app.owner!.name,
        app_name: app.name,
        distribution_group_name: this._groupName,
      },
      body: body,
    });

    return deletePromise
      .then(() => {
        this.fetchTesterList();
        return null;
      })
      .catch((err) => {
        // Re-add optimistically removed users if it fails
        if (this.data) {
          this.data.push(...users);
        }

        throw err;
      })
      .then(noop);
  };

  public alreadyAdded(email: string): boolean {
    return this.data!.some((user) => user.email === email);
  }

  @action
  public addTesters = (newUserEmails: string[]): Promise<void> => {
    const app = appStore.app;
    const body = { user_emails: newUserEmails };

    // Optimistically add users
    const newUsers = newUserEmails.map((email) => new DistributionGroupUser({ email }));
    if (!this.data) {
      this.data = observable(newUsers);
    } else {
      this.data.push(...newUsers);
    }

    const promise = apiGateway
      .post(Urls.DistributionGroupMembers, {
        params: {
          owner_name: app.owner.name,
          app_name: app.name,
          distribution_group_name: this._groupName,
        },
        body,
      })
      .catch(
        action((err) => {
          // Remove optimistically added users if it fails
          newUsers.forEach((user) => this.data!.remove(user));
          notificationStore.notify({
            persistent: true,
            message: err?.message ?? "Unhandled error",
          });
          throw err;
        })
      )
      .then(noop);

    // Replace optimistically added emails with fleshed-out records
    return promise.then<void>(() => this.fetchTesterList());
  };

  public resendInvitation(email: string): Promise<void> {
    const app = appStore.app;
    const body = { user_emails: [email] };

    if (!this.data!.some((o) => o.email === email)) {
      const message = t("distribute:testers.resendInvitationUnexpectedError", { email });
      logger.warn(message);
      notificationStore.notify({
        persistent: true,
        message,
      });
      return Promise.reject(message); // not localized because this is a developer-only message tht is never showed the users
    }

    const promise = apiGateway
      .post<void>(Urls.DistributionGroupMembersResendInvite, {
        params: {
          owner_name: app.owner.name,
          app_name: app.name,
          distribution_group_name: this._groupName,
        },
        responseType: RESPONSE_TYPES.TEXT,
        body,
      })
      .catch((err) => {
        logger.warn("resend invitation failure", err);
        notificationStore.notify({
          persistent: true,
          message: t("distribute:testers.resendInvitationFailure", { email }),
        });
        throw err;
      })
      .then(() => {
        logger.info("resend invitation");
        notificationStore.notify({
          persistent: false,
          message: t("distribute:testers.resendInvitationSuccess", { email }),
        });
      });

    return promise;
  }

  public resendLatestRelease(user: DistributionGroupUser): Promise<void> {
    const app = appStore.app;
    const body = { userIds: [user.id] };

    const promise = apiGateway
      .post<void>(Urls.DistributionGroupNotificationsLatestRelease, {
        params: {
          owner_name: app.owner.name,
          app_name: app.name,
          distribution_group_name: this._groupName,
        },
        responseType: RESPONSE_TYPES.TEXT,
        body,
      })
      .catch((err) => {
        logger.warn("resend latest email notification failure", err);
        notificationStore.notify({
          persistent: true,
          message: t("distribute:testers.resendLatestReleaseFailure", { email: user.email }),
        });
        throw err;
      })
      .then(() => {
        logger.info("resend latest email notification");
        notificationStore.notify({
          persistent: false,
          message: t("distribute:testers.resendLatestReleaseSuccess", { email: user.email }),
        });
      });

    return promise;
  }
}
