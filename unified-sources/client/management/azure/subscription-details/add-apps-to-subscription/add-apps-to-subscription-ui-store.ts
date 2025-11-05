import * as React from "react";
import * as Fuse from "fuse.js";
import { trim } from "lodash";
import { computed, observable, action } from "mobx";
import { appStore } from "@root/stores/app-store";
import { locationStore } from "@root/stores/location-store";
import { FetchError } from "@root/lib/http/fetch-error";
import { APP_OWNER_TYPES, NotificationType } from "@lib/common-interfaces";
import { SubscriptionType } from "@root/data/management/models/azure-subscription";
import { AppAzureSubscription } from "@root/data/management/models/app-azure-subscription";
import { appAzureSubscriptionStore } from "@root/data/management/stores/app-azure-subscription-store";
import { azureSubscriptionStore } from "@root/data/management/stores/azure-subscription-store";
import { App } from "@root/data/shell/models/app";

export class AddAppsToSubscriptionUIStore {
  @observable public selectedAppName!: string;
  @observable private appSubscriptionToAdd!: AppAzureSubscription;
  @observable private addAppNotificationAllowed = false;
  @observable private searchText!: string;

  constructor(private subscriptionType: SubscriptionType, private ownerName: string) {}

  @computed
  private get validApps() {
    const apps =
      this.subscriptionType === SubscriptionType.Organization
        ? appStore.appsForOwner(APP_OWNER_TYPES.ORG, this.ownerName)
        : appStore.appsForOwner(APP_OWNER_TYPES.USER, this.ownerName);
    return apps.filter((app) => !app.azure_subscription);
  }

  @computed
  get apps() {
    const fuse = new Fuse(this.validApps, {
      shouldSort: true,
      threshold: 0.1,
      keys: ["display_name"],
    });
    return this.searchText ? fuse.search<App>(this.searchText) : this.validApps;
  }

  @computed
  get isAddingApp() {
    if (!this.appSubscriptionToAdd) {
      return false;
    }
    return appAzureSubscriptionStore.isCreating(this.appSubscriptionToAdd);
  }

  @computed
  get addAppNotification(): { type: NotificationType.Error; message: string } | undefined {
    if (!this.addAppNotificationAllowed || !appAzureSubscriptionStore.creationFailed(this.appSubscriptionToAdd)) {
      return undefined;
    }
    const error = appAzureSubscriptionStore.creationError(this.appSubscriptionToAdd) as FetchError;
    return {
      type: NotificationType.Error,
      message: ((status) => {
        switch (status) {
          case 400:
            return "Something isn’t right with the data used to link this app.";
          case 403:
            return "You’re not allowed to assign this app to the subscription.";
          case 404:
            return "We couldn’t find this app.";
          case 409:
            return "Oops. It looks like this app is already added to the subscription.";
          default:
            return "Oops. Something went wrong. Please try again later.";
        }
      })(error.status),
    };
  }

  @action
  public hideNotifications(): void {
    this.addAppNotificationAllowed = false;
  }

  @action
  public onSelectApp = (name: string): void => {
    this.selectedAppName = name;
  };

  @action
  public addApp = (appName: string, subscriptionId: string) => {
    this.hideNotifications();
    this.addAppNotificationAllowed = true;
    this.appSubscriptionToAdd = new AppAzureSubscription({
      ownerName: this.ownerName,
      appName: appName,
      subscriptionId: subscriptionId,
    });
    appAzureSubscriptionStore
      .create(this.appSubscriptionToAdd, false, {
        appName: appName,
        ownerName: this.ownerName,
      })
      .onSuccess(() => {
        const app = appStore.findApp(this.ownerName, appName);
        const subscription = azureSubscriptionStore.get(subscriptionId);
        if (app && subscription) {
          app.azure_subscription = {
            subscription_id: subscription.id,
            subscription_name: subscription.name,
            tenant_id: subscription.tenantId,
          } as any;
        }
        locationStore.goUp();
      });
  };

  @action
  public onSearchTextUpdate = (event: React.ChangeEvent<HTMLInputElement>): void => {
    this.searchText = trim(event.target.value);
  };
}
