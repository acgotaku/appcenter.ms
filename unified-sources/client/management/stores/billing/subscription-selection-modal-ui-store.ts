import { action, computed, observable, runInAction } from "mobx";
import { find, isEmpty, compact } from "lodash";
import { locationStore } from "@root/stores/location-store";
import { azureSubscriptionStore } from "@root/data/management/stores/azure-subscription-store";
import { Organization } from "@root/data/shell/models/organization";
import { organizationStore } from "@root/stores/organization-store";
import { orgAzureSubscriptionAssociationStore } from "@root/data/management/stores/org-azure-subscription-association-store";
import { APP_OWNER_TYPES } from "@lib/common-interfaces";
import { userStore } from "@root/stores/user-store";
import { User } from "@root/data/shell/models/user";
import { AzureSubscription } from "@root/data/management/models/azure-subscription";
import { setSubscriptionForBillingStore } from "./set-subscription-for-billing-store";
import { t } from "@root/lib/i18n";

export class SubscriptionSelectionModalUIStore {
  @observable
  private subscriptionId!: string;
  private previewBaseUrl: string;
  private configPlanBaseUrl: string;
  private billingBaseUrl: string;
  private accountType: string;

  @observable
  public errorMessage?: string;

  constructor(private name: string, private isOrg: boolean = false) {
    this.fetchSubscriptions();

    this.accountType = this.isOrg ? "organization" : "user";

    const isSettingsPage = (window as any).initProps.isUserSettingsPage;

    if (isSettingsPage) {
      this.billingBaseUrl = this.isOrg ? `/settings/billing/orgs/${this.name}` : "/settings/billing/personal";
    } else {
      this.billingBaseUrl = this.isOrg ? `/orgs/${this.name}/manage/billing` : "/settings/billing";
    }

    this.previewBaseUrl = `${this.billingBaseUrl}/review`;
    this.configPlanBaseUrl = `${this.billingBaseUrl}/config`;
  }

  @computed
  private get subscriptionOwner(): Partial<User | Organization> {
    return this.isOrg ? organizationStore.find(this.name)! : userStore.currentUser;
  }

  @computed
  public get subscriptions(): AzureSubscription[] {
    return this.subscriptionOwner.azureSubscriptions!;
  }

  @computed
  private get currentBillingSubscriptionId(): string {
    const currentSubscription = find(this.subscriptions, { isBilling: true });
    return currentSubscription ? currentSubscription.id : (null as any);
  }

  @computed
  public get selectedSubscriptionId(): string {
    return this.subscriptionId || this.currentBillingSubscriptionId;
  }

  @computed
  public get needToSelectSubscription(): boolean {
    return this.selectedSubscriptionId == null;
  }

  @computed
  private get previewUrl(): string {
    const search = window.location.search;
    return encodeURIComponent(`${this.previewBaseUrl}${search}`);
  }

  @computed
  public get subscriptionLinkingUrl(): string {
    const {
      location: { origin },
    } = window;
    const originalUrl = this.isChangingPlan ? this.previewUrl : locationStore.pathname;
    const parameters = `?original_url=${originalUrl}&get_token=true&account_type=${this.accountType}&account_id=${this.subscriptionOwner.id}&is_billing=true`;
    const subscriptionLinkingUrl = `${origin}/auth/aad/subscriptions${parameters}`;
    return subscriptionLinkingUrl;
  }

  @action
  public selectSubscription = (subscriptionId: string): void => {
    this.subscriptionId = subscriptionId;
  };

  @action
  private fetchSubscriptions = (): void => {
    this.isOrg
      ? azureSubscriptionStore.fetchForManyToMany(orgAzureSubscriptionAssociationStore, this.name, {
          ownerName: this.name,
          ownerType: APP_OWNER_TYPES.ORG,
        })
      : azureSubscriptionStore.fetchForRelationship("userId", userStore.currentUser.id, {
          userId: userStore.currentUser.id,
          ownerType: APP_OWNER_TYPES.USER,
        });
  };

  @computed
  private get isChangingPlan(): boolean {
    const {
      query: { test_id, build_id, push_id, build_count, test_count },
    } = locationStore;
    return !isEmpty(compact([test_id, build_id, push_id, build_count, test_count]));
  }

  @action
  public closeModal = (): void => {
    if (this.isChangingPlan) {
      this.goToConfigView();
    } else {
      this.goToBillingView();
    }
  };

  @action
  private goToBillingView = (): void => {
    locationStore.router.push(locationStore.getResolvedUrl(this.billingBaseUrl));
  };

  @action
  private goToConfigView = (): void => {
    locationStore.router.push(locationStore.getResolvedUrl(this.configPlanBaseUrl));
  };

  @computed
  public get setSubscriptionIsPending(): boolean {
    return setSubscriptionForBillingStore.isPending;
  }

  @action
  public continueToReview = (): void => {
    this.errorMessage = undefined;
    if (this.selectedSubscriptionId) {
      const subscription = find(this.subscriptions, { id: this.selectedSubscriptionId });
      if (this.isChangingPlan) {
        locationStore.router.push(
          locationStore.getResolvedUrl(
            this.previewBaseUrl,
            Object.assign({}, locationStore.query, {
              tenant_id: subscription.tenantId,
              subscription_id: subscription.id,
              subscription_name: subscription.name,
            })
          )
        );
      } else {
        setSubscriptionForBillingStore
          .setIsBillingSubscription(subscription.id!, subscription.tenantId!, this.isOrg ? "organization" : "user", this.name)
          .then(() => {
            this.fetchSubscriptions();
            locationStore.router.push(locationStore.getResolvedUrl(this.billingBaseUrl));
          })
          .catch((error) => {
            runInAction(() => {
              switch (error.code) {
                case "Unauthorized":
                  this.errorMessage = t("management:billingSubscription.modal.subscription.unauthorizedError");
                  break;
                case "NotFound":
                  this.errorMessage = t("management:billingSubscription.modal.subscription.notFoundError");
                  break;
                case "BadRequest":
                  this.errorMessage = t("management:billingSubscription.modal.subscription.badRequestError");
                  break;
              }
            });
          });
      }
    }
  };

  /*
   * Component texts
   */

  @computed
  public get modalText() {
    return {
      title: t("management:billingSubscription.modal.subscription.title"),
      description: t("management:billingSubscription.modal.subscription.subtitle"),
      newSubscription: t("management:billingSubscription.modal.subscription.new"),
      continue: t("common:button.continue"),
    };
  }
}
