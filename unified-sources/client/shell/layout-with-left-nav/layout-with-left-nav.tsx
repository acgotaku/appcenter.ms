import * as React from "react";
import { observer, Observer } from "mobx-react";
import { notificationStore } from "@root/stores";
import { portalRootNode, Toaster, GlobalProgress } from "@root/shared";
import { BeaconName } from "@lib/common-interfaces";
import { TopBar } from "../top-bar";
import { LeftNavHeader } from "./left-nav-header/left-nav-header";
import { LeftNavBody } from "./left-nav-body/left-nav-body";
import { LeftNavFooter } from "./left-nav-footer/left-nav-footer";
import { PageNotFound } from "../page-not-found/page-not-found";
import { appStore } from "@root/stores";
import { locationStore, notFoundStore, globalUIStore, layoutStore } from "@root/stores";
import { withTranslation } from "react-i18next";
import { MobileBanner } from "./mobile-banner";
import { getOsFromUserAgent } from "@root/lib/utils/user-agent";
import { organizationStore } from "@root/stores";
import { createPortal } from "react-dom";
import { Utils } from "../../lib/http/utils";
import { TopBarProps } from "../top-bar/top-bar";

const classNames = require("classnames");
const styles = require("./layout-with-left-nav.scss");

const deviceOs = getOsFromUserAgent();

export interface LayoutWithLeftNavProps {
  topBarProps?: Partial<TopBarProps>;
}

/**
 * Creates a layout for the app.
 * Layout is a combination of left-panel and a right-panel.
 */
export const LayoutWithLeftNav = withTranslation("common")(
  observer(
    class LayoutWithLeftNav extends React.Component<LayoutWithLeftNavProps & { i18n; tReady; t }, {}> {
      constructor(props) {
        super(props);

        const app = appStore.app;

        if (
          !Utils.isInstallSubdomain() &&
          app &&
          app.member_permissions &&
          app.member_permissions.length === 1 &&
          app.member_permissions[0] === "tester"
        ) {
          window.location.assign(locationStore.getInstallPortalUrlWithApp("", app));
        }
      }

      public UNSAFE_componentWillReceiveProps(nextProps) {
        // Give priority to window size for left nav size state when the inner window is smaller than the break point.
        if (this.shouldToggleToCondensed) {
          layoutStore.toggleNavSize();
        }
        // Reset the notFoundStore on props change (thus on route change)
        // Since a computed is used in the `render`, the component shouldn't render unnecessarily.
        //
        // Furthermore, only `reset` if there is no app context; because
        // - appStore has the ability to *notify** of a 404 **before** this component receives new props.
        // - We would want to avoid the situation where appStore notifies about a 404 & we `reset` inadvertently.
        // - We want to `reset` in all other cases because those components/stores *notify* of a 404 *after* this code path.
        if (!locationStore.hasAppContextInRoute) {
          notFoundStore.reset();
        }
      }

      public UNSAFE_componentWillMount() {
        // This handles scenarios where where user has deep-linked to a beacon.
        this.handleBeaconChange(locationStore.beacon);
      }

      private get shouldToggleToCondensed() {
        const isExpanded = layoutStore.leftNavExpanded;
        return layoutStore.leftNavDefaultsCollapsed && isExpanded;
      }

      /**
       * If a user is navigating to a beacon other than the "apps" or "install" beacon & the current app isn't supported,
       * navigate to the "Overview" page.
       */
      private handleBeaconChange(beacon: BeaconName | null | undefined) {
        const { app } = appStore;
        if (beacon !== "apps" && !Utils.isInstallSubdomain() && app && !app.isSupportedForBeacon(beacon)) {
          locationStore.pushWithCurrentApp("/");
        }
      }

      private setViewportElement = (element: HTMLDivElement | null) => {
        if (element) {
          globalUIStore.viewportElement = element;
        }
      };

      public renderNavBar(leftNavExpanded, leftNavStyles, leftNavProps, headerItems, items, app) {
        const { isMobile } = layoutStore;
        const { isNavBarOpen } = globalUIStore;

        return isMobile && !isNavBarOpen ? null : (
          <div
            id="left-nav"
            data-test-id="left-nav"
            data-test-state={leftNavExpanded ? "expanded" : "collapsed"}
            role="navigation"
            className={leftNavStyles}
            onTransitionEnd={this.leftNavTransitionFinished}
            {...leftNavProps}
          >
            <LeftNavHeader isExpanded={leftNavExpanded} toggleExpanded={layoutStore.toggleNavSize} />
            <LeftNavBody app={app} isExpanded={leftNavExpanded} headerItems={headerItems} items={items} />
            <LeftNavFooter isExpanded={leftNavExpanded} toggleExpanded={layoutStore.toggleNavSize} />
          </div>
        );
      }

      private leftNavTransitionFinished = () => {
        layoutStore.notifyLeftNavToggleFinished();
      };

      public render() {
        if (notFoundStore.is404) {
          return <PageNotFound />;
        }
        const { leftNavExpanded, leftNavDefaultsCollapsed, isMobile } = layoutStore;
        const { isNavBarOpen, isOverlayOpen, isModalOpen } = globalUIStore;
        const app = appStore.app;
        const headerItems = layoutStore.rootNavItems;
        const items = layoutStore.navItems;

        const leftNavContainerClass = classNames(styles["left-nav-container"], { [styles.newNav]: !isMobile });
        const leftNavStyles = !leftNavExpanded ? leftNavContainerClass : classNames(leftNavContainerClass, styles["expanded"]);
        const isCodensedExpanded = leftNavExpanded && leftNavDefaultsCollapsed;
        const condensedNavOverlay = isCodensedExpanded ? styles["small-window-expanded-nav-overlay"] : null;
        const inert = isCodensedExpanded ? { inert: "true" } : {};
        const leftNavProps = {
          "aria-hidden": !isMobile ? undefined : isOverlayOpen || isModalOpen || !isNavBarOpen,
        };

        const { ownerName, ownerType } = locationStore;
        const org = organizationStore.find(ownerName);

        const overlay = () => {
          return (
            <div
              aria-hidden={globalUIStore.isDialogOrPopoverOpen ? true : undefined}
              tabIndex={-1} // the underlying button itself is accessible by tab, therefore we don't want this extra element to also be accessible
              aria-label="Close Side Menu"
              role="button"
              className={condensedNavOverlay}
              onKeyDown={layoutStore.toggleNavSize}
              onClick={layoutStore.toggleNavSize}
            />
          );
        };

        return (
          <React.Suspense fallback={<GlobalProgress loading />}>
            {layoutStore.desktopViewOverride &&
            (deviceOs.name === "iOS" || deviceOs.name === "Android" || layoutStore.mobileSafariRequestedDesktopMode) ? (
              <MobileBanner />
            ) : null}
            <TopBar org={org} app={app} ownerType={ownerType} {...this.props.topBarProps} />
            {isMobile && isNavBarOpen ? overlay() : null}
            <div
              className={styles["shell"]}
              aria-hidden={globalUIStore.isDialogOrPopoverOpen ? true : undefined}
              tabIndex={globalUIStore.isDialogOrPopoverOpen ? -1 : undefined}
            >
              {isMobile
                ? createPortal(
                    this.renderNavBar(leftNavExpanded, leftNavStyles, leftNavProps, headerItems, items, app),
                    portalRootNode
                  )
                : this.renderNavBar(leftNavExpanded, leftNavStyles, leftNavProps, headerItems, items, app)}
              {!isMobile ? overlay() : null}
              <div id="layout-viewport" className={styles["view-port"]} {...inert} ref={this.setViewportElement}>
                {this.props.children}
                <Observer>
                  {() => (
                    <Toaster.Observer
                      transientToast={notificationStore.transientNotification}
                      persistentToasts={notificationStore.persistentNotifications}
                      screenReaderToast={notificationStore.screenReaderNotification}
                      onPerformedAction={notificationStore.removeNotification}
                      onDismissToast={notificationStore.dismissNotification}
                      onEnterTransientToast={notificationStore.unscheduleRemoval}
                      onLeaveTransientToast={notificationStore.scheduleRemoval}
                    />
                  )}
                </Observer>
              </div>
            </div>
          </React.Suspense>
        );
      }
    }
  )
);
