import * as React from "react";
import { computed, observable, action, IObservableArray } from "mobx";
import { differenceWith, compact } from "lodash";
import { teamMemberStore, TeamMembersQueryOrOptions, TeamMember, teamStore } from "@root/data/management";
import { FetchError } from "@root/lib/http/fetch-error";
import { notify } from "@root/stores/notification-store";
import { NotificationType, Keys } from "@root/shared";
import { IUser } from "@lib/common-interfaces";
import validations from "@root/shared/formsy/validation-rules";
import { INotificationMessage } from "../../../../constants/constants";
import { getCollaboratorsStore } from "../../../../stores/people/collaborators/collaborators-store";
import { leaveTeamDialogStore } from "../../components/teams/dialogs/leave-team-dialog/leave-team-dialog";

export class TeamMembersUIStore {
  @observable private deleteNotificationAllowed = false;
  @observable private inviteNotificationAllowed = false;
  @observable private memberNameToInvite!: string;
  private memberNamesToBeDeleted: IObservableArray<any> = observable.array([], { deep: false });

  @action
  public hideNotifications(): void {
    this.deleteNotificationAllowed = false;
    this.inviteNotificationAllowed = false;
  }

  @computed
  get notification(): INotificationMessage {
    return this.inviteNotification || this.deletionNotification;
  }

  @computed
  get inviteNotification(): INotificationMessage {
    if (!this.inviteNotificationAllowed || !teamMemberStore.creationFailed(this.memberNameToInvite)) {
      return null as any;
    }

    const error = teamMemberStore.creationError<FetchError>(this.memberNameToInvite);
    return {
      type: NotificationType.Error,
      message: ((status) => {
        switch (error.status) {
          case 409:
            return "Oops. This user is already a member of this team.";
          case 403:
            return "Oops. You can’t add members to this team.";
          case 404:
            return "Oops. We could not find this team or the organization.";
          case 400:
            return error.message ?? "Something isn’t right with the data used to invite this team member";
          default:
            return "Oops. Something went wrong. Please try again later.";
        }
      })(status),
    };
  }

  @computed
  get deletionNotification(): INotificationMessage {
    if (!this.deleteNotificationAllowed) {
      return null as any;
    }

    const erroredMemberNames: any[] = [];
    const errors = compact(
      this.memberNamesToBeDeleted.map((memberName) => {
        erroredMemberNames.push(memberName);
        return teamMemberStore.deletionError(memberName);
      })
    );

    if (errors.length === 0) {
      return null as any;
    }

    // Marty, need more input on the "right" error messages here. Need to reevaluate strategy here.
    const hasUnauthorizedError = errors.some((error: any) => error.status === 403);
    const lastMaintainerError =
      errors.length === 1 && errors.some((error: any) => error.status === 403 && error.code === "LastTeamMaintainer");
    const notFoundError = errors.some((error: any) => error.status === 404);
    return {
      type: NotificationType.Error,
      message: (() => {
        switch (true) {
          case notFoundError:
            return "Oops. It looks like we could not find some of the members.";
          case lastMaintainerError:
            return "Oops. You can't delete this member. Please assign another member as a Maintainer first. Alternatively, you may delete this team.";
          case hasUnauthorizedError:
            return "Oops. You are not allowed to delete members from this team.";
          default:
            return `${erroredMemberNames.join(",")} could not be deleted. Please try again later.`;
        }
      })(),
    };
  }

  @computed
  get fetchFailed(): boolean {
    return teamMemberStore.collectionFetchFailed;
  }

  @computed
  get isFetching(): boolean {
    return teamMemberStore.isFetchingCollection;
  }

  @computed
  get isDeleting(): boolean {
    return this.memberNamesToBeDeleted.some((name) => teamMemberStore.isDeleting(name));
  }

  public getIsFetchingCollaborators = (organizationName: string): boolean => {
    return getCollaboratorsStore(organizationName).isPending;
  };

  @action
  public inviteMember(member: IUser, organizationName: string, teamName: string): void {
    this.hideNotifications();
    this.inviteNotificationAllowed = true;
    this.memberNameToInvite = member.name!;

    const newMember: TeamMember = teamMemberStore.get(member.name!) || new TeamMember();
    newMember.applyChanges({
      name: member.name,
      email: member.email,
      displayName: member.display_name,
      teamRelations: [{ organizationName: organizationName, teamName: teamName, role: "collaborator" }],
    });
    const options: TeamMembersQueryOrOptions = {
      organizationName: organizationName,
      teamName: teamName,
    };
    const addingCurrentUser = newMember.isCurrentUser;

    teamMemberStore
      .create(newMember, true, options)
      .onSuccess((member) => {
        // This is temporary bookkeeping.
        teamStore.get(organizationName, teamName)!.incrementMemberCount();
        // Update the team's role for the current user.
        if (addingCurrentUser) {
          const team = teamStore.get(organizationName, teamName);
          team!.applyChanges({ teamMemberRole: member!.getRole(organizationName, teamName) });
        }
      })
      .onFailure(() => {
        // If we're adding the current user and we failed while create,
        // the store will delete the current user's member resource.
        // So, sync to recreate their member relations.
        if (addingCurrentUser) {
          teamStore.syncCurrentUserMemberRelations();
        }
      });
  }

  public fetch(organizationName: string, teamName: string): void {
    const wasCurrentUserATeamMember = !!teamMemberStore.currentUserMember;
    const options: TeamMembersQueryOrOptions = {
      organizationName: organizationName,
      teamName: teamName,
    };
    teamMemberStore
      .fetchCollection(options, {
        segmentFilter: (teamMember: TeamMember) => teamMember.belongsTo(organizationName, teamName),
      })
      .onSuccess((members) => {
        // This is temporary bookkeeping.
        const team = teamStore.get(organizationName, teamName);
        if (!team) {
          return;
        }
        const currentUserMember = teamMemberStore.currentUserMember;
        const currentUserRole = currentUserMember ? currentUserMember.getRole(organizationName, team.name!) : undefined;
        // Update the length.
        team.expectedMemberCount = team.members.length;
        // Update the team's role for the current user.
        team.applyChanges({ teamMemberRole: currentUserRole });
        // If the currentUser doesn't exist but did exist before making the fetch, it means that they were removed by someone else.
        // Since the resource is now deleted, we preemptively resync to recreate the relations.
        if (!currentUserMember && wasCurrentUserATeamMember) {
          teamStore.syncCurrentUserMemberRelations();
        }
      });
  }

  @action
  public deleteMembers(members: TeamMember[], organizationName: string, teamName: string): void {
    this.hideNotifications();
    this.deleteNotificationAllowed = true;
    this.memberNamesToBeDeleted.clear();

    members.forEach((member) => {
      this.memberNamesToBeDeleted.push(member.name!);
      teamMemberStore
        .delete(member, true, {
          organizationName: organizationName,
          teamName: teamName,
          userName: member.name,
        })
        .onSuccess(() => {
          const team = teamStore.get(organizationName, teamName);
          team!.decrementMemberCount(); // This is temporary bookkeeping.
          if (member.isCurrentUser) {
            // If the member being deleted is the current user, set their role on the team to `undefined`.
            // Since the resource is now deleted, we preemptively resync to recreate the relations.
            team!.applyChanges({ teamMemberRole: undefined });
            teamStore.syncCurrentUserMemberRelations();
          }
        });
    });
  }

  @action
  public confirmLeaveTeam = (organizationName: string, teamName: string) => (): void => {
    leaveTeamDialogStore.setVisible(true);
  };

  public showExternalMemberNotification = (value: string, organizationName: string) => (
    event: React.KeyboardEvent<HTMLElement>
  ): void => {
    if (event.which !== Keys.Enter || !value || !validations.isEmail(null, value)) {
      return;
    }
    const collaboratorsStore = getCollaboratorsStore(organizationName);
    if (!collaboratorsStore.findCollaboratorByEmail(value)) {
      notify({
        persistent: false,
        message: `${value} isn’t a member of this organization.`,
      });
    }
  };

  public getMember(name: string): TeamMember {
    return teamMemberStore.get(name)!;
  }

  public getAvailableCollaborators(members: TeamMember[], organizationName: string, teamName: string): IUser[] {
    const collaboratorsStore = getCollaboratorsStore(organizationName);
    return differenceWith(
      collaboratorsStore.acceptedCollaborators,
      members,
      (collaborator, member) => collaborator && member && collaborator.name === member.name
    );
  }

  public fetchCollaborators(organizationName) {
    getCollaboratorsStore(organizationName).fetch();
  }
}
