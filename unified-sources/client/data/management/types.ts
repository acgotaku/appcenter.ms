import { NotificationType, IUser, CollaboratorRole, OrganizationUserRole } from "@lib/common-interfaces";

export interface INotificationMessage {
  message?: string;
  type: NotificationType;
}

// MessageBar support only Error, Info and Warning types
export interface IMessageBarMessage extends INotificationMessage {
  type: NotificationType.Error | NotificationType.Warning | NotificationType.Info;
}

export interface ICollaborator extends IUser {
  role?: OrganizationUserRole;
  joined_at?: string;
  invitePending?: boolean;
  isTenant?: boolean;
}

export interface IAppInvitation {
  id: string;
  email: string;
  permissions?: CollaboratorRole[];
}

export interface IAppUser {
  id?: string;
  display_name?: string;
  email?: string;
  name?: string;
  permissions?: CollaboratorRole[];
  invitePending?: boolean;
  deletePending?: boolean;
  avatar_url?: string;
}

export interface IPrices {
  testUnit: string;
  testTotal: string;
  buildUnit: string;
  buildTotal: string;
  total: string;
}

export enum StoreType {
  Org = "org",
  User = "user",
}
