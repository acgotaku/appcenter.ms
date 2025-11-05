import { IApp, AppFilterRole } from "@lib/common-interfaces";

export function isTesterApp(app: IApp): boolean {
  return !!app.member_permissions && app.member_permissions.length === 1 && app.member_permissions.includes("tester");
}

export function isDogfoodTesterApp(app: IApp): boolean {
  return !!app.microsoft_internal && isTesterApp(app);
}

export function isAppFilterRole(app: IApp, role: AppFilterRole): boolean {
  return role === "tester" ? isTesterApp(app) : !isTesterApp(app);
}
