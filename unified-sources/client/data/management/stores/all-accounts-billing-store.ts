import { action } from "mobx";
import { azureSubscriptionStore } from "./azure-subscription-store";
import { orgAzureSubscriptionAssociationStore } from "./org-azure-subscription-association-store";
import { userStore } from "@root/stores";
import { APP_OWNER_TYPES } from "@lib/common-interfaces";

export class AllAccountsBillingStore {
  @action
  public fetchSubscriptions = (isOrg: boolean, name: string): void => {
    isOrg
      ? azureSubscriptionStore.fetchForManyToMany(orgAzureSubscriptionAssociationStore, name, {
          ownerName: name,
          ownerType: APP_OWNER_TYPES.ORG,
        })
      : azureSubscriptionStore.fetchForRelationship("userId", userStore.currentUser.id, {
          userId: userStore.currentUser.id,
          ownerType: APP_OWNER_TYPES.USER,
        });
  };
}

export const allAccountsBillingStore = new AllAccountsBillingStore();
