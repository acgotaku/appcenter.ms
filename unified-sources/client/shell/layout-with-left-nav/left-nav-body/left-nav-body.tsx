import * as React from "react";
import { AppInfo } from "./app-info";
import { Navigation } from "../../navigation";
import { CSSTransitionGroup } from "react-transition-group";
import { locationStore } from "../../../stores/location-store";
import { userStore } from "../../../stores/user-store";
import { IApp, INavigationItem } from "@lib/common-interfaces";
import { layoutStore } from "@root/stores";
import { isTesterApp } from "@root/stores/utils/app-utils";
import { Utils } from "../../../lib/http/utils";
const classNames = require("classnames");
const styles = require("./left-nav-body.scss");

export interface ILeftNavBodyProps {
  app?: IApp;
  isExpanded?: boolean;
  headerItems?: INavigationItem[];
  items?: INavigationItem[];
}

export class LeftNavBody extends React.Component<ILeftNavBodyProps, {}> {
  public render() {
    const { app, isExpanded, items, headerItems } = this.props;
    const { isMobile } = layoutStore;
    const key = locationStore.hasAppContextInRoute ? 1 : 2;
    const enter = locationStore.hasAppContextInRoute ? styles["enter-left"] : styles["enter-right"];
    const leave = locationStore.hasAppContextInRoute ? styles["leave-left"] : styles["leave-right"];
    const enterActive = locationStore.hasAppContextInRoute ? styles["enter-active-left"] : styles["enter-active-right"];
    const leaveActive = locationStore.hasAppContextInRoute ? styles["leave-active-left"] : styles["leave-active-right"];
    const navItemsContainerStyles = !isExpanded
      ? styles["nav-items-container"]
      : classNames(styles["nav-items-container"], styles["expanded"]);

    const appInfoClass = classNames("app-info", { [styles.mobile]: navItemsContainerStyles });
    return (
      <CSSTransitionGroup
        className={styles["transition-group"]}
        transitionName={{
          enter,
          enterActive,
          leave,
          leaveActive,
        }}
        transitionEnterTimeout={300}
        transitionLeaveTimeout={300}
      >
        <div key={key}>
          <div className={navItemsContainerStyles}>
            {isMobile ? <Navigation items={headerItems} isExpanded={isExpanded} /> : null}
            {locationStore.hasAppContextInRoute && app && !(Utils.isInstallSubdomain() || isTesterApp(app)) ? (
              <div className={appInfoClass}>
                <AppInfo app={app} currentUser={userStore.currentUser} isExpanded={isExpanded} />
              </div>
            ) : null}
            <Navigation items={items} isExpanded={isExpanded} onlyMobile={isMobile} />
          </div>
        </div>
      </CSSTransitionGroup>
    );
  }
}
