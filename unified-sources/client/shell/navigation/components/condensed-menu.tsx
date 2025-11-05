import * as React from "react";
import { Menu, Trigger, ItemGroup, Action, Text, Size, IconItem, TextColor, IconName } from "@root/shared";
import { uniqueId } from "lodash";
import { Observer } from "mobx-react";
import { NavigationMenuProps } from "./navigation-menu";
import { locationStore } from "../../../stores/index";
const styles = require("./navigation-menu.scss");
const classNames = require("classnames/bind");

export const CondensedMenu: React.FunctionComponent<NavigationMenuProps> = ({
  isBeaconActive,
  topLevelLink,
  title,
  isOuterResource,
  items,
  splitGroups,
  isAdmin,
}) => {
  const headerId = uniqueId("nav-menu-header-");
  const rootClass = classNames.call(styles, "navigation-menu", "condensed", { active: isBeaconActive });

  // Split array of items into array of arrays by group prop
  // [{group: 1}, {group: 1}, {group: 2}] => [[{group: 1}, {group: 1}],[{group: 2}]]
  const itemGroups = splitGroups
    ? Array.from(new Set(items.map((item) => item.group))).map((groupName) => items.filter((item) => item.group === groupName))
    : [items];

  return (
    <Menu
      dark={false}
      portaled
      backdropClassName={styles.menuBackdrop}
      listClassName={isAdmin ? styles.adminMenuList : styles.menuList}
      horizontal
      interactive={false}
      className={rootClass}
      header={
        <Text size={Size.Medium} color={TextColor.Disabled}>
          {title}
        </Text>
      }
    >
      <Trigger on="hover" disabled={!isBeaconActive} mouseOutTime={500}>
        {React.cloneElement(topLevelLink, {
          "aria-labelledby": headerId,
        })}
      </Trigger>

      {itemGroups.map((groupMembers, index) => (
        <ItemGroup key={index} id={headerId}>
          {groupMembers.map((item) => (
            <Observer key={item.title}>
              {() => (
                <Action
                  href={isOuterResource ? item.route : undefined}
                  to={!isOuterResource ? item.route : undefined}
                  text={item.title}
                  className={
                    !isOuterResource && locationStore.pathname.startsWith(item.route) ? styles.menuItemActive : styles.menuItem
                  }
                >
                  {typeof item.icon === "string" ? (
                    <IconItem icon={item.icon} title={item.title} />
                  ) : (
                    <IconItem icon={IconName.None} title={item.title} />
                  )}
                </Action>
              )}
            </Observer>
          ))}
        </ItemGroup>
      ))}
    </Menu>
  );
};
