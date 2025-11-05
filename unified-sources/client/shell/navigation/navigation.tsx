import * as React from "react";
import * as PropTypes from "prop-types";
import * as pluralize from "pluralize";
import { Observer } from "mobx-react";
import { omit } from "lodash";

import { INavigationItem, APP_OWNER_TYPES } from "@lib/common-interfaces";
import { NavigationMenu, Filler } from "./components";

import { locationStore } from "../../stores/location-store";
import { TopLevelLink } from "./components/top-level-link";

import { Utils } from "../../lib/http/utils";
import { Routes } from "@root/install-beacon/utils/constants";

const classNames = require("classnames");
const styles = require("./navigation.scss");

const ORGS = pluralize(APP_OWNER_TYPES.ORG);
const USERS = pluralize(APP_OWNER_TYPES.USER);

export interface NavigationProps {
  isExpanded?: boolean;
  items?: INavigationItem[];
  onlyMobile?: boolean;
}

/**
 * Navigation Component
 * @desc This component renders a list of links from the props provided to it.
 * This component also supports 1-level deep child links via props.
 * It will look for the current route and render the given child links under the link that matches
 * the current route.
 */
export class Navigation extends React.PureComponent<NavigationProps, any> {
  private isInstall: boolean = Utils.isInstallSubdomain();

  public static propTypes: React.WeakValidationMap<NavigationProps> = {
    isExpanded: PropTypes.bool,
    items: PropTypes.array,
    onlyMobile: PropTypes.bool,
  };

  public static defaultProps: NavigationProps = {
    items: [],
  };

  public render() {
    const { isExpanded, items, onlyMobile } = this.props;
    const passthrough = omit(this.props, "isExpanded", "items", "tooltips", "onlyMobile");
    const navigationStyles = !isExpanded ? styles.navigation : classNames(styles.navigation, styles.expanded);
    const className = classNames(this.props["className"], navigationStyles);

    return (
      <div role="navigation" {...passthrough} className={className}>
        {items &&
          items.map((item, index) => {
            if (onlyMobile && !item.mobileReady) {
              return;
            }
            // Don't render consecutive filler beacons
            if (item.filler && index > 0 && items[index - 1].filler) {
              return;
            }

            if (item.filler) {
              return <Filler key={index} showLineWhenMobile={item.showLineWhenMobile} />;
            }

            // Put this in an ad-hoc Observer so each NavigationItem/NavigationMenu subscribes to observables individually
            return (
              <Observer key={index}>
                {() => {
                  // Show a navigation menu or a single navigation item
                  const isActive =
                    (locationStore.beacon === item.beacon && (!locationStore.ownerType || !!locationStore.appName)) ||
                    (this.isInstall && item.route === locationStore.pathname && item.route === Routes.AppList) ||
                    (locationStore.ownerType === ORGS &&
                      locationStore.ownerName?.toLowerCase() === item.organization?.toLowerCase()) ||
                    (locationStore.ownerType === USERS && item.route === locationStore.personalOrgUrl);
                  const isMenu = item.childItems && item.childItems.length > 0;
                  const isAdminBeacon = item.beacon === "admin";

                  const topLevelLink = (
                    <TopLevelLink
                      title={item.title}
                      route={item.route}
                      icon={item.icon}
                      onClick={item.onClick}
                      active={isActive}
                      isNavExpanded={isExpanded}
                      isOuterResource={item.isOuterResource}
                      hasChildLinks
                    />
                  );

                  if (isMenu) {
                    return (
                      <NavigationMenu
                        title={item.title}
                        isBeaconActive={isActive}
                        isNavExpanded={!!isExpanded}
                        isOuterResource={item.isOuterResource}
                        items={item.childItems || []}
                        topLevelLink={topLevelLink}
                        onlyMobile={onlyMobile}
                        isAdmin={isAdminBeacon}
                      />
                    );
                  }

                  return React.cloneElement(topLevelLink, { "aria-label": item.title, hasChildLinks: false });
                }}
              </Observer>
            );
          })}
      </div>
    );
  }
}
