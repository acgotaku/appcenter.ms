import { DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore, ExternalDataState } from "@root/shared";
import { apiGateway } from "@root/lib/http";
import { action } from "mobx";

export class SetSubscriptionForBillingStore extends DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore<any> {
  constructor() {
    super(ExternalDataState.Idle);
  }

  @action
  public setIsBillingSubscription(subscriptionId: string, tenantId: string, accountType: string, accountName: string): Promise<any> {
    const http = apiGateway;
    const url = `${window.location.origin}/aad/subscriptions/${subscriptionId}`;

    const requestBody = {
      tenant_id: tenantId,
      is_billing: true,
      account_type: accountType,
      account_name: accountName,
    };

    return this.load(http.patch(url, { body: requestBody }));
  }
}

export const setSubscriptionForBillingStore = new SetSubscriptionForBillingStore();
