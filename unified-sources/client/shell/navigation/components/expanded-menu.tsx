import * as React from "react";
import { uniqueId } from "lodash";
import { Observer } from "mobx-react";
import { locationStore } from "../../../stores/index";
import { ChildLink } from "./child-link";
import { NavigationMenuProps } from "./navigation-menu";
const styles = require("./navigation-menu.scss");
const classNames = require("classnames/bind");

function childIsActive(childRoute, childIndex, isBeaconActive) {
  const path = locationStore.pathname.toLowerCase();
  const normalizedChildRoute = (childRoute.startsWith("/") ? childRoute : `/${childRoute}`).toLowerCase();
  return (isBeaconActive && path.startsWith(normalizedChildRoute)) || (childIndex === 0 && locationStore.loading);
}

export const ExpandedMenu: React.FunctionComponent<NavigationMenuProps> = ({
  isBeaconActive,
  items,
  topLevelLink,
  isOuterResource,
}) => (
  <div className={classNames.call(styles, "navigation-menu", "expanded", { active: isBeaconActive })}>
    {React.cloneElement(topLevelLink, {
      "aria-expanded": isBeaconActive,
      id: `left-${uniqueId("nav-menu-header-")}`,
    })}
    <div role="presentation" className={styles.expandedList}>
      {items.map((item, index) => (
        <Observer key={item.title}>
          {() => (
            <ChildLink
              title={item.title}
              route={item.route}
              isOuterResource={isOuterResource}
              active={!isOuterResource && childIsActive(item.route, index, isBeaconActive)}
            />
          )}
        </Observer>
      ))}
    </div>
  </div>
);
