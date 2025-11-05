import { action, computed, observable } from "mobx";
import { teamStore, Team, TeamsQueryOrOptions, teamMemberStore, TeamMember } from "@root/data/management";
import { locationStore, userStore } from "@root/stores";
import { FetchError } from "@root/lib/http/fetch-error";
import { NotificationType } from "@root/shared";
import { INotificationMessage } from "../../../../constants/constants";
import { TeamType } from "@root/data/management/stores/team-store";
import { notifyScreenReader } from "@root/stores";
import { t } from "@root/lib/i18n";

export class NewTeamUIStore {
  private newTeam: Team = new Team();
  @observable private showConflictError: boolean = true;

  @computed
  get notification(): INotificationMessage {
    if (!teamStore.creationFailed(this.newTeam)) {
      return null as any;
    }

    const error = teamStore.creationError<FetchError>(this.newTeam);
    return {
      type: NotificationType.Error,
      // @ts-ignore. [Should fix it in the future] Strict error.
      message: ((status) => {
        switch (error.status) {
          case 409:
            return null; // Handled in `conflictError()`
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
  get conflictError(): string {
    if (!this.showConflictError || !teamStore.creationFailed(this.newTeam)) {
      return null as any;
    }

    const error = teamStore.creationError<FetchError>(this.newTeam);
    if (error.status === 409) {
      return "A team of this name already exists. Please select a different name.";
    } else {
      return undefined as any;
    }
  }

  @action
  public create(organizationName: string, displayName: string, teamType: TeamType): void {
    this.newTeam.applyChanges({ displayName: displayName });
    this.setShowConflictError(true);
    const currentUser = userStore.currentUser;
    const options: TeamsQueryOrOptions = {
      organizationName: organizationName,
    };

    this.newTeam.applyChanges({ sourceType: teamType === TeamType.Team ? "0" : "1" });

    teamStore.create(this.newTeam, false, options).onSuccess((team) => {
      // Since team creation will always be performed by the current user,
      // preemptively add the current user as a maintainer for the created Team.
      const currentUserMember = teamMemberStore.currentUserMember || new TeamMember();
      currentUserMember.applyChanges({
        name: currentUser.name,
        email: currentUser.email,
        displayName: currentUser.display_name,
        teamRelations: [{ organizationName: organizationName, teamName: team!.name, role: "maintainer" }],
      });
      teamMemberStore.add(currentUserMember);
      const url =
        teamType === TeamType.Team
          ? `/orgs/${organizationName}/people/teams/${team!.name}/members`
          : `/orgs/${organizationName}/people/distribution/${team!.name}/members`;

      locationStore.router.push(`/orgs/${organizationName}/people/teams`);
      locationStore.router.push(url);
      notifyScreenReader({
        message: t("management:people.teams.teamCreatedAnnouncement", { teamName: team!.displayName }),
        delay: 500,
      });
    });
  }

  @computed
  get isCreating(): boolean {
    return teamStore.isCreating(this.newTeam);
  }

  @action
  public setShowConflictError(value: boolean): void {
    this.showConflictError = value;
  }
}
