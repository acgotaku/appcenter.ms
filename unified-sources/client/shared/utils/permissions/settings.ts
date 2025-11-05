export enum Permission {
  CreateWebhook,
  EditWebhook,
  TestWebhook,
  DeleteWebhook,
  CreateExportConfiguration,
  EditExportConfiguration,
  DeleteExportConfiguration,
}

export const Permissions = {
  [Permission.CreateWebhook]: ["manager", "developer"],
  [Permission.EditWebhook]: ["manager", "developer"],
  [Permission.TestWebhook]: ["manager", "developer"],
  [Permission.DeleteWebhook]: ["manager", "developer"],
  [Permission.CreateExportConfiguration]: ["manager", "developer"],
  [Permission.EditExportConfiguration]: ["manager", "developer"],
  [Permission.DeleteExportConfiguration]: ["manager", "developer"],
};
