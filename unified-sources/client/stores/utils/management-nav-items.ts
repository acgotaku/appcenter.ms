import { INavigationItem, IOrganization, OrganizationUserRole } from "@lib/common-interfaces";
import { userStore } from "../user-store";
import { locationStore } from "../location-store";
import { Utils } from "../../lib/http/utils";

export const getNavItem = (o: IOrganization): INavigationItem => {
  const isInstall = Utils.isInstallSubdomain();
  const item: INavigationItem = {
    route: `/orgs/${o.name}`,
    organization: o.name,
    title: `${o.display_name || o.name}`,
    icon: { organization: o },
    mobileReady: true,
    isExternalLink: true,
    childItems: [],
  };

  if (!isInstall) {
    item.childItems!.push({
      route: `/orgs/${o.name}/applications`,
      title: "Apps",
      mobileReady: true,
    });
  }

  if (
    !isInstall &&
    (o.collaborator_role === OrganizationUserRole.Collaborator || o.collaborator_role === OrganizationUserRole.Admin)
  ) {
    item.childItems!.push({
      route: `/orgs/${o.name}/people`,
      title: "People",
    });
  }

  // Add the Manage nav item if the current user is Admin in the organization.
  if (!isInstall && o.collaborator_role === OrganizationUserRole.Admin) {
    item.childItems!.push({
      route: `/orgs/${o.name}/manage`,
      title: "Manage",
    });
  }

  return item;
};

const personalNavItem: INavigationItem = {
  mobileReady: true,
  get route() {
    return locationStore.personalOrgUrl;
  },
  get title() {
    return `${userStore.currentUser.display_name || userStore.currentUser.name}`;
  },
  get icon() {
    return { userEmail: userStore.currentUser.email };
  },
};

export const getNavItems = (organizations: IOrganization[]): INavigationItem[] => {
  const prefixItem = Utils.isInstallSubdomain() ? [] : [personalNavItem];
  return organizations ? prefixItem.concat(organizations.map(getNavItem)) : [];
};
