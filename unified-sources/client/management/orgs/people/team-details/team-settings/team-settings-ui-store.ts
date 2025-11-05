import { computed, observable, action } from "mobx";
import { locationStore, notify } from "@root/stores";
import { TeamsQueryOrOptions, teamStore, Team } from "@root/data/management";
import { FetchError } from "@root/lib/http/fetch-error";
import { NotificationType } from "@root/shared";
import { INotificationMessage } from "../../../../constants/constants";
import { deleteTeamDialogStore } from "../../components/teams/dialogs/delete-team-dialog/delete-team-dialog";
import { TeamType } from "@root/data/management/stores/team-store";
import { notifyScreenReader } from "@root/stores";
import { t } from "@root/lib/i18n";

export class TeamSettingsUIStore {
  @observable private updateNotificationAllowed = false;
  private type: TeamType;

  constructor(private organizationName: string, private teamName: string, teamType: TeamType) {
    this.type = teamType;
  }

  @computed
  get team(): Team {
    return this.isFetching ? (undefined as any) : teamStore.get(this.organizationName, this.teamName);
  }

  @action
  public hideNotifications(): void {
    this.updateNotificationAllowed = false;
  }

  @computed
  get notification(): INotificationMessage {
    return this.updateNotification;
  }

  @computed
  get updateNotification(): INotificationMessage {
    if (!this.updateNotificationAllowed || !teamStore.updateFailed(this.team)) {
      return null as any;
    }
    const error = teamStore.updateError(this.team) as FetchError;
    return {
      type: NotificationType.Error,
      message: ((status) => {
        switch (error.status) {
          case 404:
            return `Oops. We could not find this ${this.type}.`;
          case 403:
            return `Oops. You are not allowed to update this ${this.type}.`;
          case 400:
            return `Something isn’t right with the data used to update this ${this.type}.`;
          default:
            return "Oops. Something went wrong. Please try again later.";
        }
      })(status),
    };
  }

  @computed
  get deleteNotificationMessage(): string {
    if (!teamStore.deletionFailed(this.team)) {
      return null as any;
    }
    const error = teamStore.deletionError(this.team) as FetchError;
    switch (error.status) {
      case 404:
        return `Oops. We could not find this ${this.type} for the given organization.`;
      case 403:
        return `Oops. You are not allowed to delete this ${this.type}.`;
      case 400:
        return `Something isn’t right with the data used to delete this ${this.type}.`;
      default:
        return "Oops. Something went wrong. Please try again later.";
    }
  }

  @computed
  get isUpdating(): boolean {
    return teamStore.isUpdating(this.team);
  }

  @computed
  get isFetching(): boolean {
    return teamStore.isFetchingCollection;
  }

  @computed
  get isDeleting(): boolean {
    return teamStore.isDeleting(this.team);
  }

  @computed
  get teamType(): TeamType {
    return this.type;
  }

  @action
  public confirmDeleteTeam = (): void => {
    deleteTeamDialogStore.setVisible(true);
  };

  @action
  public updateTeam(changes: Partial<Team>): void {
    const options: TeamsQueryOrOptions = {
      organizationName: this.organizationName,
      teamName: this.team.name,
    };
    this.hideNotifications();
    this.updateNotificationAllowed = true;

    teamStore.update(this.team, changes, false, options).onSuccess(() => {
      locationStore.goUp();
      notifyScreenReader({
        message: t("management:people.teams.teamUpdatedAnnouncement", { teamName: this.team.displayName }),
        delay: 500,
      });
    });
  }

  @action
  public deleteTeam = (): void => {
    const options: TeamsQueryOrOptions = {
      organizationName: this.organizationName,
      teamName: this.team.name,
    };
    const { displayName } = this.team;
    this.hideNotifications();
    // Hide the modal first because otherwise due to transitions &
    // timing issues, we get extra space on the right after navigation.
    locationStore.goUp();

    const parentPath = this.teamType === TeamType.Team ? "teams" : "distribution";
    teamStore
      .delete(this.team, false, options)
      .onSuccess(() => {
        deleteTeamDialogStore.setVisible(false);
        locationStore.router.push(`/orgs/${this.organizationName}/people/${parentPath}`);
        notifyScreenReader({ message: t("management:people.teams.teamDeletedAnnouncement", { teamName: displayName }), delay: 500 });
      })
      .onFailure(() => {
        deleteTeamDialogStore.setVisible(false);
        notify({
          persistent: false,
          message: this.deleteNotificationMessage,
        });
      });
  };
}
