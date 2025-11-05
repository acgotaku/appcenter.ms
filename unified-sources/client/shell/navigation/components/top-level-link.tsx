import * as React from "react";
import { Link } from "react-router";
import * as classNames from "classnames/bind";
import {
  IconName,
  IconSize,
  Icon,
  OverlayTransition,
  Tooltip,
  Trigger,
  OrganizationIcon,
  Gravatar,
  TextColor,
  UserInitialsAvatar,
} from "@root/shared";
import { INavigationItem } from "@lib/common-interfaces/navigation-item";
import { LinkProps } from "../types";
import { layoutStore } from "@root/stores";
import { observer } from "mobx-react";
const styles = require("./top-level-link.scss");

export interface TopLevelLinkProps extends LinkProps {
  // Content
  icon: INavigationItem["icon"];

  // Configuration
  isNavExpanded?: boolean;
  hasChildLinks?: boolean;
  isOuterResource?: boolean;
}

/**
 * TopLevelLinks are the top-level navigation items in the left nav,
 * linking either to beacons or to organizations.
 */
@observer
export class TopLevelLink extends React.Component<TopLevelLinkProps> {
  private get icon() {
    const { icon, title } = this.props;
    if (typeof icon === "object" && "organization" in icon) {
      return <OrganizationIcon organization={icon.organization} size={24} />;
    }
    if (typeof icon === "object" && "userEmail" in icon) {
      return <Gravatar email={icon.userEmail} size={24} fallback={<UserInitialsAvatar initialsName={title} size={24} />} />;
    }
    return icon;
  }

  private renderContents() {
    const { icon: _, active, hasChildLinks, route, title, isNavExpanded, isOuterResource, ...passthrough } = this.props;
    const withActiveIndicator = !isOuterResource && (!hasChildLinks || !isNavExpanded);
    const icon = this.icon;
    const iconColor = TextColor.Primary;
    const className = classNames.call(styles, "top-level-link", {
      withActiveIndicator,
      active: active,
      "child-active": isNavExpanded && hasChildLinks,
      "no-children": !hasChildLinks,
    });

    return (
      <Link
        {...passthrough}
        to={route}
        className={className}
        data-inverts-on-hover="high-contrast"
        data-inverted={active && withActiveIndicator ? "high-contrast" : null}
        data-test-id={title}
      >
        <div className={classNames.call(styles, "link-content", { expanded: isNavExpanded })}>
          {typeof icon === "string" ? <Icon icon={icon} color={iconColor} size={IconSize.Small} className={styles.icon} /> : icon}
          <div className={styles.linkText}>{title}</div>
          {hasChildLinks ? (
            <Icon icon={IconName.ButtonChevronRight} color={iconColor} size={IconSize.XSmall} className={styles.chevron} />
          ) : null}
        </div>
      </Link>
    );
  }

  public render() {
    const { isNavExpanded, active, title } = this.props;
    const { isMobile } = layoutStore;
    // 1. Don’t show a Tooltip when the nav is expanded
    // 2. Don’t show a Tooltip when you’re going to show a Menu instead
    if (isNavExpanded || active) {
      return this.renderContents();
    }

    if (!isNavExpanded && !isMobile) {
      return (
        <Tooltip
          portaled
          overlayClassName={styles.tooltip}
          horizontal
          preferRight
          preferCenter={false}
          transitionIn={OverlayTransition.SlightRight}
          transitionOut={OverlayTransition.SlightRight}
        >
          <Trigger mouseOutTime={0}>{this.renderContents()}</Trigger>
          {title}
        </Tooltip>
      );
    }

    return null;
  }
}
