import * as React from "react";
import { INavigationItem } from "@lib/common-interfaces";
import { ExpandedMenu, CondensedMenu } from ".";

export interface NavigationMenuProps {
  title: string;
  isBeaconActive: boolean;
  isNavExpanded: boolean;
  items: INavigationItem[];
  topLevelLink: React.ReactElement<{ "aria-expanded": boolean; "aria-labelledby": string; id: string }>;
  onlyMobile?: boolean;
  isOuterResource?: boolean;
  isAdmin?: boolean;
  splitGroups?: boolean;
}

export class NavigationMenu extends React.Component<NavigationMenuProps, {}> {
  private normalizeExternalRoutes(items: INavigationItem[]) {
    return items.map((item) => ({ ...item, route: item.route.startsWith("/http") ? item.route.replace("/", "") : item.route }));
  }

  public render() {
    const { isNavExpanded, items, onlyMobile, isAdmin, isOuterResource } = this.props;

    const filteredItems = onlyMobile ? items.filter((item) => item.mobileReady) : items;

    const menuProps = {
      ...this.props,
      items: isOuterResource ? this.normalizeExternalRoutes(filteredItems) : filteredItems,
      splitGroups: isAdmin && !isOuterResource,
    };

    return isNavExpanded ? <ExpandedMenu {...menuProps} /> : <CondensedMenu {...menuProps} />;
  }
}
