export enum Permission {
  SendNotification,
  DeleteNotification,
  ConfigurePush,
  CreateAudience,
  EditAudience,
  DeleteAudience,
}

export const Permissions = {
  [Permission.SendNotification]: ["developer", "manager"],
  [Permission.DeleteNotification]: ["developer", "manager"],
  [Permission.ConfigurePush]: ["developer", "manager"],
  [Permission.CreateAudience]: ["developer", "manager"],
  [Permission.EditAudience]: ["developer", "manager"],
  [Permission.DeleteAudience]: ["developer", "manager"],
};
