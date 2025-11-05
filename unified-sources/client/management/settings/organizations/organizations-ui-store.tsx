import { action, computed, observable } from "mobx";
import { chain } from "lodash";
import { IOrganization } from "@lib/common-interfaces";
import { organizationStore } from "@root/stores/organization-store";
import { Invitation } from "@root/data/management/models/invitation";
import { invitationStore } from "@root/data/management/stores/invitation-store";
import { RemoveCollaboratorStore } from "../../stores/people/collaborators/remove-collaborator-store";
import { ICollaborator } from "../../constants/constants";

export class OrganizationsUIStore {
  @observable
  public invitationToDelete?: Invitation;

  @observable
  public organizationToLeave?: IOrganization;

  public removeCollaboratorStore = new RemoveCollaboratorStore();
  @computed
  get inviteError() {
    if (this.hasJoinFailed) {
      return "management:inviteCard.joinError";
    } else if (this.hasDeclineFailed) {
      return "management:inviteCard.declineError";
    } else if (this.hasOrganizationFetchFailed) {
      return "management:inviteCard.organizationFetchError";
    } else {
      return undefined;
    }
  }

  @computed
  get hasJoinFailed() {
    if (!this.invitationToDelete?.id) {
      return false;
    }
    return invitationStore.creationFailed(this.invitationToDelete.id);
  }

  @computed
  get hasDeclineFailed() {
    if (!this.invitationToDelete?.id) {
      return false;
    }
    return invitationStore.deletionFailed(this.invitationToDelete.id);
  }

  @computed
  get hasOrganizationFetchFailed() {
    if (!this.invitationToDelete) {
      return false;
    }

    const { organization } = this.invitationToDelete;
    if (!organization) {
      return false;
    }
    return organizationStore.fetchOrganizationError(organization.name);
  }

  @computed
  get allOrganizations() {
    const organizationInvites = chain(invitationStore.resources)
      .filter((invite) => invite.isOrganizationInvite)
      .map((invite) => invite.organization)
      .value();
    return (this.acceptedOrganizations as (IOrganization | undefined)[]).concat(organizationInvites);
  }

  @computed
  get showOrganizations() {
    return this.allOrganizations.length > 0;
  }

  @computed
  get acceptedOrganizations() {
    return organizationStore.organizations || [];
  }

  @action
  public acceptInvite = (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement, MouseEvent>, invitation: Invitation) => {
    // The button that is calling this is in a navigation row, so we have to stop propogation of the event.
    e.stopPropagation();
    this.clearNotifications();
    this.invitationToDelete = invitation;
    invitationStore.create(invitation, false).onSuccess(() => {
      organizationStore.fetchOrganization(invitation.organization?.name || "").onSuccess(() => invitationStore.remove(invitation));
    });
  };

  @action
  public declineInvite = (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement, MouseEvent>, invitation: Invitation) => {
    // The button that is calling this is in a navigation row, so we have to stop propogation of the event.
    e.stopPropagation();
    this.clearNotifications();
    this.invitationToDelete = invitation;
    invitationStore.delete(invitation, false);
  };

  @action
  public onLeaveOrganization = (
    e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement, MouseEvent>,
    collaborator: ICollaborator,
    organization: IOrganization
  ) => {
    // The button that is calling this is in a navigation row, so we have to stop propogation of the event.
    e.stopPropagation();
    this.organizationToLeave = organization;
    this.removeCollaboratorStore.showRemoveDialog(collaborator, organization);
  };

  @action
  public leaveOrganization = (collaborator: ICollaborator) => {
    this.clearNotifications();
    if (this.organizationToLeave) {
      this.removeCollaboratorStore.leaveFromSettings(collaborator, this.organizationToLeave);
    }
  };

  @action
  private clearNotifications(): void {
    this.removeCollaboratorStore.resetState();
    this.invitationToDelete = undefined;
  }
}
