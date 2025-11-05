import { observable, action, computed, ObservableMap, runInAction } from "mobx";
import { appStore, locationStore, userStore, organizationStore } from "@root/stores";
import { apiGateway } from "@root/lib/http";
import { API } from "../../constants/api";
import { FetchError } from "../../../lib/http/fetch-error";
import { INotificationMessage, IAppInvitation, IAppUser } from "../../constants/constants";
import { DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore, ExternalDataState } from "@root/shared";
import { IApp, CollaboratorRole, NotificationType, IOrganization } from "@lib/common-interfaces";
import { unionBy, remove, map } from "lodash";
import { InviteUserStore } from "./app-invites/invite-user-store";
import { RemoveUserStore } from "./app-invites/remove-user-store";
import { UpdateCollaboratorRoleStore } from "./app-roles/update-app-role-store";
import { Utils } from "@root/lib/http/utils";

type StoreWithNotification = DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore<any> & { notification: INotificationMessage };

export class AppUsersStore extends DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore<void> {
  @observable private _users!: IAppUser[];
  @observable private _inviteStores!: ObservableMap<string, InviteUserStore>;
  @observable private _removeStores!: ObservableMap<string, RemoveUserStore>;
  @observable private _updateRoleStores!: ObservableMap<string, UpdateCollaboratorRoleStore>;
  @observable public isUserRemoveWarningVisible: boolean = false;

  constructor() {
    super();
    this.resetData();
  }

  @computed
  get notification(): INotificationMessage {
    const error = this.error as FetchError;

    if (this.state === ExternalDataState.Failed) {
      return {
        type: NotificationType.Error,
        message: ((error) => {
          switch (error.status) {
            case 404:
              return "Oops. We couldn't find this app.";
            case 403:
              return "Oops. You're not allowed to manage this app.";
            default:
              return "Something went wrong. Please try again.";
          }
        })(error),
      };
    } else {
      return (
        this._getNotification(Array.from(this._inviteStores.values())) ||
        this._getNotification(Array.from(this._removeStores.values())) ||
        this._getNotification(Array.from(this._updateRoleStores.values()))
      );
    }
  }

  @computed
  get users(): IAppUser[] {
    return this._users;
  }

  @action
  public resetData() {
    this._users = [];
    this._inviteStores = observable.map<string, InviteUserStore>({});
    this._removeStores = observable.map<string, RemoveUserStore>({});
    this._updateRoleStores = observable.map<string, UpdateCollaboratorRoleStore>({});
  }

  @action
  public resetStates() {
    this._resetStates(Array.from(this._inviteStores.values()));
    this._resetStates(Array.from(this._removeStores.values()));
    this._resetStates(Array.from(this._updateRoleStores.values()));
  }

  @action
  public addUser(user: IAppUser): void {
    this.addUsers([user]);
  }

  public isInvited(email: string): boolean {
    return this._users.some((user: IAppUser) => {
      return user.email === email;
    });
  }

  @action
  public showUserRemoveWarning(): void {
    this.isUserRemoveWarningVisible = true;
  }

  @action
  public hideUserRemoveWarning(): void {
    this.isUserRemoveWarningVisible = false;
  }

  @action
  public getInviteStore(email: string): InviteUserStore {
    const store = this._inviteStores.get(email);

    if (!store) {
      const newStore = new InviteUserStore();
      this._inviteStores.set(email, newStore);
      return newStore;
    } else {
      return store;
    }
  }

  @action
  public getRemoveStore(email: string): RemoveUserStore {
    const store = this._removeStores.get(email);

    if (!store) {
      const newStore = new RemoveUserStore();
      this._removeStores.set(email, newStore);
      return newStore;
    } else {
      return store;
    }
  }

  @action
  public getRoleUpdateStore(email: string): UpdateCollaboratorRoleStore {
    const store = this._updateRoleStores.get(email);

    if (!store) {
      const newStore = new UpdateCollaboratorRoleStore();
      this._updateRoleStores.set(email, newStore);
      return newStore;
    } else {
      return store;
    }
  }

  /**
   * Invite the user using their email to the given app.
   */
  @action
  public invite(user: IAppUser, app: IApp) {
    const { email } = user;
    this.resetStates();
    this.addUser(user);

    return this.getInviteStore(email!)
      .invite(app, email!)
      .catch((error) => {
        this.removeUser(user);
        throw error;
      });
  }

  /**
   * Remove the given user from the given app.
   */
  @action
  public remove(user: IAppUser, app: IApp) {
    const currentUser = userStore.currentUser;

    this.resetStates();

    return this.getRemoveStore(user.email!)
      .remove(user, app)
      .then(() => {
        runInAction(() => {
          this.removeUser(user);

          // If current user is removing themselves, navigate appropriately.
          if (currentUser.name === user.name) {
            // If it's not an org app or inside install portal, remove the app and navigate to the apps list.
            if (!app.isOrgApp || Utils.isInstallSubdomain()) {
              appStore.removeApp(app);
              locationStore.pushAppList();
              return;
            }

            // If it's an org app, remove the app and navigate only if the currentUser isn't an admin.
            const orgOwner = organizationStore.find(app.owner?.name);
            const isCurrentUserAnAdminForOwnerOrg = organizationStore.isCurrentUserAnAdmin(orgOwner);

            if (!isCurrentUserAnAdminForOwnerOrg) {
              appStore.removeApp(app);
              locationStore.router.push(organizationStore.homePageUrl(app.owner as IOrganization)!);
            }
          }
        });
      });
  }

  /**
   * Update the role of the given user for the given app to the new role.
   */
  @action
  public updateCollaboratorRole(app: IApp, user: IAppUser, newRole: CollaboratorRole): void {
    this.resetStates();
    this.getRoleUpdateStore(user.email!).update(app, user, newRole);
  }

  @action
  public fetchAppUsers(app: IApp): void {
    this.loadVoid(
      Promise.all([
        apiGateway.get(API.APP_USERS, {
          params: {
            owner_name: app.owner?.name,
            app_name: app.name,
          },
        }),
        apiGateway.get(API.GET_APP_INVITATIONS, {
          params: {
            owner_name: app.owner?.name,
            app_name: app.name,
          },
        }),
      ]).spread<void>((users: IAppUser[], invitations: IAppInvitation[]) => {
        runInAction(() => {
          const allUsers: IAppUser[] = map<IAppUser, IAppUser>(users, (user) => {
            return Object.assign({}, user, { invitePending: false });
          }).concat(
            map(invitations, (invite) => {
              return {
                display_name: invite.email,
                email: invite.email,
                id: invite.email,
                invitePending: true,
                permissions: invite.permissions,
              };
            })
          );

          this.addUsers(allUsers);
        });
        return null;
      })
    );
  }

  @action
  private addUsers(users: IAppUser[]): void {
    this._users = unionBy(this._users, users, "email");
  }

  @action
  private removeUser(user: IAppUser): void {
    return this.removeUserByEmail(user.email!);
  }

  @action
  private removeUserByEmail(email: string): void {
    remove(this._users, (u) => u.email === email);
  }

  @action
  private _resetStates(stores: StoreWithNotification[]): void {
    stores.forEach((s) => (s.state = undefined as any));
  }

  // @ts-ignore. [Should fix it in the future] Strict error.
  private _getNotification(stores: StoreWithNotification[]): INotificationMessage {
    for (const store of stores) {
      if (store.isFailed) {
        return store.notification;
      }
    }
  }
}

export const appUsersStore = new AppUsersStore();
