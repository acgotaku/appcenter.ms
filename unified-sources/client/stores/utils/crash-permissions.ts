import { appStore } from "@root/stores/app-store";
import { IApp, CollaboratorRole } from "@lib/common-interfaces";

export enum CrashPermission {
  Viewer,
  Modifier,
  Uploader,
}

// TODO: Get rid of class
export class CrashPermissions {
  private static mappingFor(permission: CrashPermission): CollaboratorRole[] {
    switch (permission) {
      case CrashPermission.Viewer:
        return ["manager", "developer", "viewer"];
      case CrashPermission.Modifier:
        return ["manager", "developer"];
      case CrashPermission.Uploader:
        return ["manager", "developer"];
    }
  }

  public static hasPermission(permission: CrashPermission, app?: IApp): boolean {
    if (app) {
      return appStore.hasAnyCollaboratorRoleForApp(this.mappingFor(permission), app);
    } else {
      return appStore.hasAnyCollaboratorRole(this.mappingFor(permission));
    }
  }
}
