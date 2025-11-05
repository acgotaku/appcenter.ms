import { computed } from "mobx";
import { invitationStore } from "@root/data/management/stores/invitation-store";
import { Invitation } from "@root/data/management/models/invitation";
import { appStore } from "@root/stores/app-store";
import { App } from "@root/data/shell/models/app";
import { organizationStore } from "@root/stores/organization-store";

export class InviteCardUIStore {
  constructor(private invitation: Invitation) {}

  @computed
  get errorMessageKey() {
    if (this.hasJoinFailed) {
      return "management:inviteCard.joinError";
    } else if (this.hasDeclineFailed) {
      return "management:inviteCard.declineError";
    } else if (this.hasAppFetchFailed) {
      return "management:inviteCard.appFetchError";
    } else if (this.hasOrganizationFetchFailed) {
      return "management:inviteCard.organizationFetchError";
    } else {
      return undefined;
    }
  }

  @computed
  get hasJoinFailed() {
    return !!this.invitation.id && invitationStore.creationFailed(this.invitation.id);
  }

  @computed
  get hasDeclineFailed() {
    return !!this.invitation.id && invitationStore.deletionFailed(this.invitation.id);
  }

  @computed
  get hasAppFetchFailed() {
    const { app } = this.invitation;
    if (!app) {
      return false;
    }
    return appStore.fetchFailed(App.internalAppId(app.owner?.name || "", app.name));
  }

  @computed
  get hasOrganizationFetchFailed() {
    const { organization } = this.invitation;
    if (!organization) {
      return false;
    }
    return organizationStore.fetchOrganizationError(organization.name);
  }
}
