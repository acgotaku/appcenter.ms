import * as React from "react";
import { differenceBy } from "lodash";
import { action, computed, observable, set } from "mobx";
import { appUsersStore } from "../../stores/user/app-users-store";
import { CollaboratorRole } from "@lib/common-interfaces";
import validations from "@root/shared/formsy/validation-rules";
import { appStore, notify, organizationStore, userStore } from "@root/stores";
import { FetchError } from "@root/lib/http/fetch-error";
import { IAppUser, ICollaborator } from "../../constants/constants";
import { getCollaboratorsStore } from "../../stores/people/collaborators/collaborators-store";
import { Team } from "@root/data/management/models/team";
import { teamStore } from "@root/data/management/stores/team-store";
import { t } from "@root/lib/i18n";
import { teamAppStore } from "@root/data/management/stores/team-app-store";
import { Organization } from "@root/data/shell/models/organization";

export type AppUser = IAppUser & { orgAdmins?: true };
export type Collaborator = AppUser | Team;
export type AvailableCollaborator = AppUser | Team;

export class CollaboratorsUIStore {
  public static emailValidations = {
    isEmail: true,
    isInvited: (_, value: string) => (appUsersStore.isInvited(value.trim()) ? `${value} has already been invited to this app.` : true),
  };

  public static emailValidationErrors = {
    isEmail: "Please enter a valid email address.",
  };

  private removingUser!: AppUser | null;
  @observable public removeUserWarningIsVisible = false;
  @observable public email = "";

  constructor() {
    const { app } = appStore;
    if (app.isOrgApp) {
      this.collaboratorsStore.fetch();

      teamStore.fetchCollection(
        {
          organizationName: app.owner.name,
          include: ["members_count", "apps_count", "team_member_role"],
        },
        {
          segmentFilter: (team: Team) => team.organizationName === app.owner.name,
        }
      );
    }
  }

  private get collaboratorsStore() {
    return getCollaboratorsStore(appStore.app.owner.name);
  }

  public isCollaboratorCurrentUser(collaborator: Collaborator): boolean {
    return collaborator.name === userStore.currentUser.name;
  }

  public userCanDelete = (collaborator: Collaborator) => {
    return (
      (this.userCanEdit || this.isCollaboratorCurrentUser(collaborator)) &&
      appStore.ownerName !== collaborator.name &&
      !this.isOrgAdmins(collaborator)
    );
  };

  @computed
  public get userCanEdit() {
    return appStore.hasAnyCollaboratorRole(["manager"]);
  }

  @computed
  public get teamCollaborators() {
    const { app } = appStore;
    return app.isOrgApp
      ? differenceBy(
          teamStore.resources.filter((team) => team.organizationName === app.owner.name),
          this.people,
          (team: Team) => team.name
        )
      : [];
  }

  @computed
  public get organizationCollaborators() {
    return appStore.app.isOrgApp ? differenceBy(this.collaboratorsStore.collaborators.slice(1), this.people, (u) => u.email) : [];
  }

  @computed
  public get availableCollaborators(): AvailableCollaborator[] {
    return ([] as any[]).concat(this.organizationCollaborators, this.teamCollaborators);
  }

  @computed
  public get people(): Collaborator[] {
    return ([] as any[]).concat(this.adminsRow, teamStore.getTeamsForApp(appStore.app), (appUsersStore.users || []).slice());
  }

  @computed
  get adminsRow(): AppUser[] {
    return appStore.app.isOrgApp
      ? [
          {
            orgAdmins: true,
            email: appStore.app.owner.id,
            avatar_url: appStore.app.owner instanceof Organization ? appStore.app.owner.avatar_url : undefined,
            display_name: appStore.app.owner.display_name,
            permissions: ["manager"],
          },
        ]
      : [];
  }

  @computed
  get teams() {
    const { app } = appStore;
    if (!app.isOrgApp) {
      return [];
    }
    return differenceBy(teamStore.getTeams(app.owner.name), this.people, (team) => team.id);
  }

  @computed
  public get placeholderRowCount() {
    return this.people.length || (appUsersStore.isPending || teamStore.isFetchingCollection ? 5 : 0);
  }

  @action
  public canUpdateRole = (collaborator: Collaborator): boolean => {
    if (this.isTeam(collaborator)) {
      return teamStore.isUpdating(collaborator.id);
    }
    return appUsersStore.getRoleUpdateStore(collaborator.email!).isPending;
  };

  public isTeam(collaborator: AvailableCollaborator): collaborator is Team {
    return collaborator instanceof Team;
  }

  public isOrgAdmins(collaborator: Collaborator): boolean {
    return "orgAdmins" in collaborator;
  }

  public getRole = (collaborator: Collaborator) => {
    return this.isTeam(collaborator)
      ? teamAppStore.get(teamStore.compoundKey(collaborator.organizationName, collaborator.name), appStore.app.internalId)!.permissions
      : collaborator.permissions![0];
  };

  @action
  public typeEmail = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.email = event.currentTarget.value;
  };

  @action
  public selectAutocompletedCollaborator = (collaborator: AvailableCollaborator) => {
    const { app } = appStore;
    if (this.isTeam(collaborator)) {
      this.email = "";
      const teamId = teamStore.compoundKey(collaborator.organizationName, collaborator.name);
      teamAppStore
        .associate(teamId, app.internalId, true, {
          organizationName: app.owner.name,
          teamName: collaborator.name,
          appName: app.name,
        })
        .onFailure((error: any) => {
          notify({
            persistent: false,
            message: this.getInviteTeamErrorMessage(error.status, collaborator as Team, error.message),
          });
        });
    } else {
      this.email = collaborator.email!;
      this.inviteUser();
    }
  };

  @action
  public inviteUser = (event?: React.FormEvent<HTMLFormElement>) => {
    if (event) {
      event.preventDefault();
    }

    const email = this.email.trim();
    if (!email.length) {
      return;
    }

    if (!validations.isEmail(null, email)) {
      notify({
        persistent: false,
        message: t("management:appCollaborators.error.invalidEmail"),
      });

      return;
    }

    if (this.people.some((c) => "email" in c && c.email === email)) {
      notify({
        persistent: false,
        message: t("management:appCollaborators.error.alreadyMember", { displayName: email, app: appStore.app }),
      });

      return;
    }

    appUsersStore.resetStates();

    const organizationCollaborator = this.organizationCollaborators.find((collaborator) => collaborator.email === email);
    const user: ICollaborator =
      organizationCollaborator ||
      observable({
        email,
        display_name: email,
        name: email,
        invitePending: true,
        id: email,
      });

    set(user, { permissions: ["developer"] });

    appUsersStore.invite(user, appStore.app).catch((error: { message?: string }) => {
      notify({
        persistent: false,
        message: error.message ?? t("management:appCollaborators.error.errorAdding", { displayName: email }),
      });
    });

    this.email = "";
  };

  @action
  public updateRole = (collaborator: Collaborator, role: CollaboratorRole) => {
    const { app } = appStore;
    if (this.isTeam(collaborator)) {
      const options = {
        organizationName: app.owner.name,
        teamName: collaborator.name,
        appName: app.name,
      };
      // We need to use `teamAppStore` because backend doesn't have
      // teams API under the `/apps/..` resource path.
      const teamId = teamStore.compoundKey(app.owner.name, collaborator.name);
      teamAppStore.updateAssociation(teamId, app.internalId, { permissions: role }, false, options).onFailure((error: any) => {
        notify({
          persistent: false,
          message: this.getUpdateTeamRoleErrorMessage(error.status, collaborator as Team),
        });
      });
    } else {
      appUsersStore.resetStates();
      appUsersStore.updateCollaboratorRole(appStore.app, collaborator as IAppUser, role);
    }
  };

  @action
  public startRemovingCollaborator = (user: Collaborator) => {
    const { app } = appStore;
    if (this.isTeam(user)) {
      const options = {
        organizationName: app.owner.name,
        teamName: user.name,
        appName: app.name,
      };
      const teamId = teamStore.compoundKey(app.owner.name, user.name);
      teamAppStore.disassociate(teamId, app.internalId, false, options).onFailure((error: any) => {
        notify({
          persistent: false,
          message: this.getRemoveTeamErrorMessage(error!.status, user as Team),
        });
      });
    } else {
      const ownerOrg = app.isOrgApp ? organizationStore.find(app.owner.name) : null;
      appUsersStore.resetStates();

      // Unless override is set, show warning if current user is removing themself from the app & they aren't the Owner Org's admin
      if (user.name === userStore.currentUser.name && !organizationStore.isCurrentUserAnAdmin(ownerOrg!)) {
        this.removingUser = user;
        this.removeUserWarningIsVisible = true;
      } else {
        this.removeCollaborator(user);
      }
    }
  };

  @action
  public finishRemovingCollaborator = () => {
    this.removeCollaborator(this.removingUser!);
    this.removeUserWarningIsVisible = false;
    this.removingUser = null;
  };

  @action
  public cancelRemovingCollaborator = () => {
    this.removeUserWarningIsVisible = false;
    this.removingUser = null;
  };

  public dispose() {
    // this.disposeReaction();
  }

  private removeCollaborator(user: AppUser) {
    appUsersStore.remove(user as IAppUser, appStore.app).catch((error: FetchError) => {
      if (error.status === 404) {
        notify({
          persistent: true,
          message: t("management:appCollaborators.error.errorStaleUser"),
          action: () => window.location.reload(),
          buttonText: "Reload",
        });
      }
      notify({
        persistent: false,
        message: t("management:appCollaborators.error.errorRemoving", { displayName: user.email }),
      });
    });
  }

  private getInviteTeamErrorMessage(status: number, team: Team, message?: string): string {
    switch (status) {
      case 400:
        return message ?? t("management:appCollaborators.error.badDataErrorForTeamAction", { action: "add" });
      case 404:
        return t("management:appCollaborators.error.teamOrAppNotFoundError");
      case 409:
        return t("management:appCollaborators.error.alreadyMember", { displayName: team.displayName, app: appStore.app });
      case 403:
        return t("management:appSettings.error.notAllowedError");
      default:
        return t("management:appCollaborators.error.errorAdding", { displayName: team.displayName });
    }
  }

  private getUpdateTeamRoleErrorMessage(status: number, team: Team): string {
    switch (status) {
      case 400:
        return t("management:appCollaborators.error.badDataErrorForTeamAction", { action: "update" });
      case 404:
        return t("management:appCollaborators.error.teamOrAppNotFoundError");
      case 403:
        return t("management:appSettings.error.notAllowedError");
      default:
        return t("management:appCollaborators.error.errorUpdating", { displayName: team.displayName });
    }
  }

  private getRemoveTeamErrorMessage(status: number, team: Team): string {
    switch (status) {
      case 400:
        return t("management:appCollaborators.error.badDataErrorForTeamAction", { action: "remove" });
      case 404:
        return t("management:appCollaborators.error.teamOrAppNotFoundError");
      case 403:
        return t("management:appSettings.error.notAllowedError");
      default:
        return t("management:appCollaborators.error.errorRemoving", { displayName: team.displayName });
    }
  }
}
