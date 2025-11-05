import { action, computed, observable } from "mobx";
import { invitationStore } from "@root/data/management/stores/invitation-store";
import { Invitation } from "@root/data/management/models/invitation";
import { appStore } from "@root/stores/app-store";

export class InvitesUIStore {
  private acceptedInvitations: Invitation[] = [];

  @observable
  public showAllInvites: boolean = false;

  public fetchCollection = () => {
    invitationStore.fetchCollection();
  };

  @computed
  get displayedInvites() {
    const maxIndex = this.showAllInvites ? this.invites.length : 3;
    return this.invites.slice(0, maxIndex);
  }

  @computed
  get shouldTruncateList() {
    return this.invites.length > 3;
  }

  @computed
  get invites() {
    return invitationStore.resources;
  }

  @action
  public toggleShowAll = () => {
    this.showAllInvites = !this.showAllInvites;
  };

  @action
  public declineInvite = (invitation: Invitation) => {
    invitationStore.delete(invitation, false);
  };

  @action
  public acceptInvite = (invitation: Invitation, onAcceptedAppReady: Function) => {
    invitationStore.create(invitation, false).onSuccess(() => {
      if (invitation.app) {
        const app = invitation.app;
        appStore
          .fetchApp({
            ownerName: app.owner?.name,
            appName: app.name,
          })
          .onSuccess(() => {
            this.acceptedInvitations.push(invitation);
            onAcceptedAppReady();
          });
      } else {
        // organizationStore.fetchOrganization(invitation.organization.name).onSuccess(() => {});
        invitationStore.remove(invitation);
        // TODO: we hope to make the org list react to changes in individual org data and re-render without a refresh
        window.location.reload();
      }
    });
  };

  @action
  public clearAcceptedInvitations = () => {
    this.acceptedInvitations.forEach((invitation) => invitationStore.remove(invitation));
    this.acceptedInvitations = [];
  };
}
