import { computed, action, observable } from "mobx";
import { NotificationType } from "@root/shared";
import { APP_OWNER_TYPES, IApp } from "@lib/common-interfaces";
import { userStore } from "@root/stores/user-store";
import { locationStore } from "@root/stores/location-store";
import { appStore } from "@root/stores/app-store";
import { organizationStore } from "@root/stores/organization-store";
import { notify } from "@root/stores/notification-store";
import { User } from "@root/data/shell/models/user";
import { App } from "@root/data/shell/models/app";
import { Organization } from "@root/data/shell/models/organization";
import { SubscriptionType, AzureSubscription } from "@root/data/management/models/azure-subscription";
import { AppAzureSubscription } from "@root/data/management/models/app-azure-subscription";
import { appAzureSubscriptionStore } from "@root/data/management/stores/app-azure-subscription-store";
import { azureSubscriptionStore } from "@root/data/management/stores/azure-subscription-store";
import { orgAzureSubscriptionAssociationStore } from "@root/data/management/stores/org-azure-subscription-association-store";
import { FetchError } from "@root/lib/http/fetch-error";
import { t } from "@root/lib/i18n";

export class SubscriptionDetailsUIStore {
  @observable public isAppRemovalDialogVisible: boolean = false;
  @observable public isSubscriptionRemovalDialogVisible: boolean = false;
  @observable public appToRemove!: IApp;
  @observable public appSubscriptionToRemove!: AppAzureSubscription;
  @observable private deleteAppSubscriptionNotificationAllowed = false;

  constructor(private subscriptionType: SubscriptionType, private ownerName: string, private subscriptionId: string) {
    if (this.subscriptionType === SubscriptionType.User) {
      // No query params fetches the user billing plan
      azureSubscriptionStore.fetchForRelationship("userId", userStore.currentUser.id, {
        userId: userStore.currentUser.id,
        ownerType: APP_OWNER_TYPES.USER,
      });
    } else {
      // billingStore.fetchOne(this.ownerName, { orgName: this.ownerName });
      azureSubscriptionStore.fetchForManyToMany(orgAzureSubscriptionAssociationStore, this.ownerName, {
        ownerName: this.ownerName,
        ownerType: APP_OWNER_TYPES.ORG,
      });
    }
  }

  @computed
  public get isFetchingSubscriptions() {
    return this.subscriptionType === SubscriptionType.Organization
      ? azureSubscriptionStore.isFetchingRelationship(`${orgAzureSubscriptionAssociationStore.id}-${this.ownerName}`)
      : azureSubscriptionStore.isFetchingRelationship(`userId-${userStore.currentUser.id}`);
  }

  @computed
  public get isFetchingSubscriptionFailed() {
    return this.subscriptionType === SubscriptionType.Organization
      ? azureSubscriptionStore.relationshipsFetchFailed(`${orgAzureSubscriptionAssociationStore.id}-${this.ownerName}`)
      : azureSubscriptionStore.relationshipsFetchFailed(`userId-${userStore.currentUser.id}`);
  }

  @computed
  public get isDeletingAppSubscription() {
    if (!this.appSubscriptionToRemove) {
      return false;
    }
    return appAzureSubscriptionStore.isDeleting(this.appSubscriptionToRemove);
  }

  @computed
  get deleteAppSubscriptionNotification(): { type: NotificationType.Error; message: string } | undefined {
    if (!this.deleteAppSubscriptionNotificationAllowed || !appAzureSubscriptionStore.deletionFailed(this.appSubscriptionToRemove)) {
      return undefined;
    }

    const error = appAzureSubscriptionStore.deletionError<FetchError>(this.appSubscriptionToRemove);
    return {
      type: NotificationType.Error,
      message: ((status, body) => {
        switch (status) {
          case 400:
            return (
              (body && body.error && body.error.message) ||
              "Something isn’t right with the data used to remove this app from the subscription."
            );
          case 403:
            return "You’re not allowed to remove this app from the subscription.";
          case 404:
            return "We couldn’t find this app.";
          default:
            return "Oops. Something went wrong. Please try again later.";
        }
      })(error.status, error.body),
    };
  }

  @computed
  public get subscriptionOwner(): Partial<User | Organization> {
    return this.subscriptionType === SubscriptionType.Organization ? organizationStore.find(this.ownerName)! : userStore.currentUser;
  }

  @action
  public hideNotifications(): void {
    this.deleteAppSubscriptionNotificationAllowed = false;
  }

  @computed
  public get subscription(): AzureSubscription {
    return this.subscriptionOwner.azureSubscriptions!.find((subscription) => subscription.id === this.subscriptionId)!;
  }

  @computed
  public get subscriptionApps(): App[] {
    return this.subscription
      ? appStore.appsForSubscription(this.subscription.id!).filter((app) => app.owner.name === this.ownerName)
      : [];
  }

  @computed get hasNoApps(): boolean {
    return !this.isFetchingSubscriptions && this.subscriptionApps.length === 0;
  }

  @computed get usedForBilling(): boolean {
    if (!this.isFetchingSubscriptions && this.subscription) {
      return this.subscription.isBilling!;
    }

    return false;
  }

  @computed get removeSubscriptionDialogTitle(): string {
    return this.hasNoApps && !this.usedForBilling
      ? t("management:subscriptionDetails.removeSubscriptionDialog.title")
      : !this.usedForBilling
      ? t("management:subscriptionDetails.cannotRemoveSubscriptionDialog.title")
      : t("management:subscriptionDetails.cannotRemoveBillingSubscriptionDialog.title");
  }

  @computed get removeSubscriptionDialogDescription(): string {
    if (this.hasNoApps && !this.usedForBilling) {
      // The subscription can be removed in this case, show the "normal" dialog description.
      return t("management:subscriptionDetails.removeSubscriptionDialog.message");
    } else if (!this.usedForBilling) {
      // The user has apps, but the subscription is not used for billing. They can't remove the subscription.
      return t("management:subscriptionDetails.cannotRemoveSubscriptionDialog.message");
    } else {
      // The subscription is currently being used for billling and cannot be removed.

      return t("management:subscriptionDetails.cannotRemoveBillingSubscriptionDialog.message");
    }

    // return this.hasNoApps && !this.usedForBilling
    //   ? t("management:subscriptionDetails.removeSubscriptionDialog.message")
    //   : (!this.usedForBilling ? t("management:subscriptionDetails.cannotRemoveSubscriptionDialog.message") : t("management:subscriptionDetails.cannotRemoveBillingSubscriptionDialog.message"));
  }

  public startAppRemoval = (app: IApp) =>
    action((): void => {
      this.appToRemove = app;
      this.isAppRemovalDialogVisible = true;
    });

  @action
  public cancelAppRemoval = (): void => {
    this.isAppRemovalDialogVisible = false;
  };

  @action
  public startSubscriptionRemoval = (): void => {
    this.isSubscriptionRemovalDialogVisible = true;
  };

  @action
  public cancelSubscriptionRemoval = (): void => {
    this.isSubscriptionRemovalDialogVisible = false;
  };

  public deleteAppSubscription = (app: IApp, subscriptionId: string) =>
    action((): void => {
      this.hideNotifications();
      this.deleteAppSubscriptionNotificationAllowed = true;
      const appName = app.name;
      const ownerName = app.owner!.name;
      const appSubscriptionOptions = {
        appName,
        ownerName,
        subscriptionId: subscriptionId,
      };
      // Track the app subscription preemptively before deleting it.
      // Why you ask. Good question.
      // `appAzureSubscriptionStore` doesn't have it's own "fetch" (yet). We need `appStore` to get apps for a subscription.
      // Thus, we never "track" the `AppAzureSubscription` instances while fetch.
      // Hence, we need to track individual relationship resources lazily so that the store can delete them.
      this.appSubscriptionToRemove = new AppAzureSubscription(appSubscriptionOptions);
      appAzureSubscriptionStore.add(this.appSubscriptionToRemove);

      // Delete the app subscription
      appAzureSubscriptionStore
        .delete(this.appSubscriptionToRemove, false, appSubscriptionOptions)
        .onSuccess(() => {
          this.isAppRemovalDialogVisible = false;
          app.azure_subscription = null!;
          notify({
            persistent: false,
            message: `${app.display_name} was removed from this subscription.`,
          });
        })
        .onFailure(() => {
          this.isAppRemovalDialogVisible = false;
        });
    });

  public deleteSubscription = (subscription: AzureSubscription) =>
    action((): void => {
      this.isSubscriptionRemovalDialogVisible = false;
      const isOrganizationSubscription = this.subscriptionType === SubscriptionType.Organization;
      const options = {
        subscriptionId: subscription.id,
        ownerName: this.ownerName,
        ownerType: isOrganizationSubscription ? "org" : "user",
      };
      const request = isOrganizationSubscription
        ? orgAzureSubscriptionAssociationStore.disassociate(this.ownerName, subscription.id!)
        : azureSubscriptionStore.deleteRelationship(subscription, "userId", true, options);

      request
        .onSuccess(() => {
          notify({
            persistent: false,
            message: `‘${subscription.name}’ was successfully removed.`,
          });
        })
        .onFailure((error: FetchError | any) => {
          notify({
            persistent: false,
            message: ((status, body) => {
              switch (status) {
                case 400:
                  return (
                    (body && body.error && body.error.message) ||
                    `Something isn’t right with the data used to remove ‘${subscription.name}.’`
                  );
                case 403:
                  return `You’re not allowed to remove ‘${subscription.name}.’`;
                case 404:
                  return `We couldn’t find ‘${subscription.name}.’`;
                default:
                  return `Oops. ‘${subscription.name}’ couldn’t be removed. Please try again later.`;
              }
            })(error.status, error.body),
          });
        });
      locationStore.goUp();
    });
}
