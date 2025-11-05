import { INavigationItem } from "@lib/common-interfaces";
import { IconName } from "@lib/constants/icon-name";
import { userStore } from "../../stores/user-store";

export const ADMIN_ROUTES_ROOT = "admin";
export const ADMIN_MANAGE_ROUTES_ROOT = `${ADMIN_ROUTES_ROOT}/manage`;

export const ADMIN_APPS_ROUTES_ROOT = `${ADMIN_MANAGE_ROUTES_ROOT}/apps`;
export const ADMIN_GDPR_OPERATION_ROUTES_ROOT = `${ADMIN_MANAGE_ROUTES_ROOT}/gdpr`;
export const ADMIN_USERS_ROUTES_ROOT = `${ADMIN_MANAGE_ROUTES_ROOT}/users`;
export const ADMIN_ADMINS_ROUTES_ROOT = `${ADMIN_MANAGE_ROUTES_ROOT}/admins`;
export const ADMIN_ORGANIZATIONS_ROUTES_ROOT = `${ADMIN_MANAGE_ROUTES_ROOT}/organizations`;
export const ADMIN_TEST_RUNS_ROUTES_ROOT = `${ADMIN_MANAGE_ROUTES_ROOT}/test/runs`;
export const ADMIN_SWAGGERS_ROUTES_ROOT = `${ADMIN_MANAGE_ROUTES_ROOT}/swaggers`;
export const ADMIN_NOTIFICATIONS_ROUTES_ROOT = `${ADMIN_MANAGE_ROUTES_ROOT}/notifications`;
export const ADMIN_ANALYTICS_ROUTES_ROOT = `${ADMIN_MANAGE_ROUTES_ROOT}/analytics`;
export const ADMIN_CRASHES_SYSTEM_SYMBOLS = `${ADMIN_MANAGE_ROUTES_ROOT}/crashes/system_symbols`;
export const ADMIN_UPLOAD_CRASH_ROOT = `${ADMIN_MANAGE_ROUTES_ROOT}/uploadCrash`;

export const ADMIN_ROLES = {
  NOT_ADMIN: {
    displayName: "Not Admin",
    value: "notAdmin",
  },
  ADMIN: {
    displayName: "Admin",
    value: "admin",
  },
  CUSTOMER_SUPPORT: {
    displayName: "Customer Support",
    value: "customerSupport",
  },
};

export const getAdminNavItems = (): INavigationItem[] => {
  const currentUser = userStore.currentUser;
  const defaultNavItem: INavigationItem = {
    route: ADMIN_MANAGE_ROUTES_ROOT,
    title: "Manage",
    beacon: "admin",
    isAdminLink: true,
    icon: IconName.AccountSettings,
    childItems: [],
  };

  const linkNavItem: INavigationItem = {
    route: ADMIN_MANAGE_ROUTES_ROOT,
    title: "Links",
    beacon: "admin",
    isAdminLink: true,
    isOuterResource: true,
    icon: IconName.Help,
    childItems: [
      {
        route: "https://msdpn.azurewebsites.net/default?LID=62",
        title: "Global Protection Notice",
        isAdminLink: true,
        group: 1,
        isOuterResource: true,
        icon: IconName.User,
      },
    ],
  };

  if (!currentUser || !currentUser.admin_role) {
    return [defaultNavItem, linkNavItem];
  }

  defaultNavItem.childItems!.push(
    {
      route: ADMIN_APPS_ROUTES_ROOT,
      title: "Apps",
      isAdminLink: true,
      group: 1,
      icon: IconName.AppIndex,
    },
    {
      route: ADMIN_USERS_ROUTES_ROOT,
      title: "Users",
      isAdminLink: true,
      group: 1,
      icon: IconName.User,
    },
    {
      route: ADMIN_ORGANIZATIONS_ROUTES_ROOT,
      title: "Organizations",
      isAdminLink: true,
      group: 1,
      icon: IconName.Organization,
    }
  );

  if (currentUser.admin_role !== ADMIN_ROLES.CUSTOMER_SUPPORT.value) {
    defaultNavItem.childItems!.push(
      {
        route: ADMIN_SWAGGERS_ROUTES_ROOT,
        title: "Swaggers",
        isAdminLink: true,
      },
      {
        route: ADMIN_NOTIFICATIONS_ROUTES_ROOT,
        title: "Notifications",
        isAdminLink: true,
      },
      {
        route: ADMIN_ANALYTICS_ROUTES_ROOT,
        title: "Analytics",
        isAdminLink: true,
      },
      {
        route: ADMIN_CRASHES_SYSTEM_SYMBOLS,
        title: "System Symbols",
        isAdminLink: true,
      },
      {
        route: ADMIN_UPLOAD_CRASH_ROOT,
        title: "Upload Crash",
        isAdminLink: true,
      },
      {
        route: ADMIN_GDPR_OPERATION_ROUTES_ROOT,
        title: "GDPR",
        isAdminLink: true,
      }
    );
  }

  return [defaultNavItem, linkNavItem];
};
