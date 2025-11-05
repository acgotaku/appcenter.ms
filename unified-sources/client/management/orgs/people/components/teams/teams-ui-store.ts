import { computed, action, observable } from "mobx";
import { teamStore, Team, teamMemberStore, INotificationMessage } from "@root/data/management";
import { userStore } from "@root/stores/user-store";
import { notify } from "@root/stores/notification-store";
import { FetchError } from "@root/lib/http/fetch-error";
import { NotificationType } from "@root/shared";
import { leaveTeamDialogStore } from "./dialogs/leave-team-dialog/leave-team-dialog";
import { deleteTeamDialogStore } from "./dialogs/delete-team-dialog/delete-team-dialog";
import { TeamType } from "@root/data/management/stores/team-store";
import { notifyScreenReader } from "@root/stores";
import { t } from "@root/lib/i18n";

export class TeamsUIStore {
  @observable private leaveNotificationAllowed = false;
  @observable private fetchNotificationAllowed = false;
  @observable private deleteNotificationAllowed = false;
  @observable public teamToDelete!: Team;
  @observable public teamToLeave!: Team;

  @action
  public hideNotifications(): void {
    this.leaveNotificationAllowed = false;
    this.fetchNotificationAllowed = false;
    this.deleteNotificationAllowed = false;
  }

  @computed
  get isFetching(): boolean {
    return teamStore.isFetchingCollection;
  }

  @computed
  get notification(): INotificationMessage {
    return this.fetchNotification || this.leaveNotification || this.deleteNotification;
  }

  @computed
  get fetchNotification(): INotificationMessage {
    if (!this.fetchNotificationAllowed || !teamStore.collectionFetchFailed) {
      return null as any;
    }

    const error = teamStore.collectionFetchError as FetchError;
    return {
      type: NotificationType.Error,
      message: ((status) => {
        switch (error.status) {
          case 404:
            return "Oops. We could not find this organization.";
          case 400:
            return "Something isn’t right with the data used to fetch teams for this organization.";
          default:
            return "Oops. Something went wrong. Please try again later.";
        }
      })(status),
    };
  }

  @computed
  get leaveNotification(): INotificationMessage {
    const { currentUser } = userStore;
    if (!this.leaveNotificationAllowed || !teamMemberStore.deletionFailed(currentUser.name)) {
      return null as any;
    }

    const error = teamMemberStore.deletionError(currentUser.name) as FetchError;
    return {
      type: NotificationType.Error,
      message: ((error) => {
        switch (error.status) {
          case 404:
            return "Oops. We could not find the team or the member.";
          case 400:
            return "Something isn’t right with the data used to leave this team.";
          case 403:
            return error.code === "LastTeamMaintainer"
              ? "Oops. You can't delete this member. Please assign another member as a Maintainer first. Alternatively, you may delete this team."
              : "Oops. It looks like you are not allowed to leave this team.";
          default:
            return "Oops. Something went wrong. Please try again later.";
        }
      })(error),
    };
  }

  @computed
  get deleteNotification(): INotificationMessage {
    if (!this.deleteNotificationAllowed || !teamStore.deletionFailed(this.teamToDelete)) {
      return null as any;
    }
    const error = teamStore.deletionError(this.teamToDelete) as FetchError;
    return {
      type: NotificationType.Error,
      message: ((status) => {
        switch (error.status) {
          case 404:
            return "Oops. We could not find this team for the given organization.";
          case 400:
            return "Something isn’t right with the data used to delete this team.";
          case 403:
            return "Oops. You are not allowed to delete this team.";
          default:
            return "Oops. Something went wrong. Please try again later.";
        }
      })(status),
    };
  }

  @action
  public fetch = (organizationName: string, teamName: string, teamType: TeamType): void => {
    this.fetchNotificationAllowed = true;
    teamStore
      .fetchCollection(
        {
          organizationName,
          teamType,
          teamName,
          include: ["apps_count", "members_count", "team_member_role"],
        },
        {
          segmentFilter: (team: Team) => team.organizationName === organizationName,
        }
      )
      .onSuccess((teams) => {
        // Preemptively sync to create the relations for the current user.
        // This is required since action on a resource needs it to be tracked by the store.
        // Thus, this step makes "leaveTeam" for currentUser possible without querying all members of all teams.
        // This will probably go away after data layer handles relations.
        teamStore.syncCurrentUserMemberRelations();
      });
  };

  @action
  public confirmLeaveTeam = (organizationName: string, team: Team): void => {
    this.teamToLeave = team;
    leaveTeamDialogStore.setVisible(true);
  };

  @action
  public leaveTeam = (organizationName: string, team: Team): void => {
    const { currentUser } = userStore;
    this.hideNotifications();
    this.leaveNotificationAllowed = true;
    this.teamToLeave = team;

    teamMemberStore
      .delete(currentUser.name, true, {
        organizationName,
        teamName: team.name,
        userName: currentUser.name,
      })
      .onSuccess(() => {
        notify({
          persistent: false,
          message: `You’ve left ${this.teamToLeave.displayName}.`,
        });
        // This is temporary bookkeeping.
        team.decrementMemberCount();
        // Reset the currentUser's role for the team.
        team.applyChanges({ teamMemberRole: undefined });
        // Since the resource (currentUser's member) is now deleted,
        // we preemptively resync to recreate the relations for other teams.
        teamStore.syncCurrentUserMemberRelations();
      });
  };

  @action
  public confirmDeleteTeam = (organizationName: string, team: Team): void => {
    this.teamToDelete = team;
    deleteTeamDialogStore.setVisible(true);
  };

  @action
  public deleteTeam = (organizationName: string, team: Team): void => {
    this.hideNotifications();
    this.deleteNotificationAllowed = true;
    teamStore
      .delete(team, true, {
        organizationName,
        teamName: team.name,
      })
      .onSuccess(() => {
        notifyScreenReader({ message: t("management:people.teams.teamDeletedAnnouncement", { teamName: team.displayName }) });
      });
  };

  public getTeams(organizationName: string): Team[] {
    return teamStore.resources.filter((team) => team.organizationName === organizationName);
  }
}
