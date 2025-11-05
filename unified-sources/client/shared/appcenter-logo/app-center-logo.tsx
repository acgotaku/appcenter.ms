import * as React from "react";
import { Link } from "react-router";
import { Icon, IconName, IconSize, Paragraph, Size, Stretch, TextColor } from "@root/shared";

const classNames = require("classnames");
const css = require("./app-center-logo.scss");

const appCenterLogoText = "App Center";

const Logo: React.SFC<{ collapsed: boolean; mobile: boolean }> = ({ collapsed, mobile }) => (
  <Stretch
    centered
    className={classNames({
      [css.logoExpanded]: !collapsed && !mobile,
      [css.logoCollapsed]: collapsed,
    })}
  >
    <Icon
      icon={IconName.AppCenter}
      color={TextColor.Brand}
      size={IconSize.XMedium}
      className={mobile ? css.mobilePaddedIcon : css.paddedIcon}
      area-hidden={(!!!collapsed).toString()}
    />
    {!collapsed && (
      <Paragraph color={TextColor.Brand} bold underline={false} size={Size.Medium}>
        {appCenterLogoText}
      </Paragraph>
    )}
  </Stretch>
);
Logo.displayName = "Logo";

export interface AppCenterLogoProps {
  collapsed?: boolean;
  mobile?: boolean;
  to?: string;
  href?: string;
}

export class AppCenterLogo extends React.PureComponent<AppCenterLogoProps, {}> {
  render() {
    const { collapsed, mobile, to, href } = this.props;
    const logoFixedWidth = !mobile ? css.logoFixedWidth : null;
    return href ? (
      <a aria-label={appCenterLogoText} className={`${css.link} ${collapsed ? css.logoDefault : logoFixedWidth}`} href={href}>
        <Logo collapsed={!!collapsed} mobile={!!mobile} />
      </a>
    ) : to ? (
      <Link aria-label={appCenterLogoText} className={`${css.link} ${collapsed ? css.logoDefault : logoFixedWidth}`} to={to}>
        <Logo collapsed={!!collapsed} mobile={!!mobile} />
      </Link>
    ) : (
      <Logo collapsed={!!collapsed} mobile={!!mobile} />
    );
  }
}
