import * as React from "react";
import * as PropTypes from "prop-types";
import { Link } from "react-router";
import * as classNames from "classnames/bind";
import { withPanelPosition, PanelPosition } from "../panels/with-panel-position";
import { BlockPadding } from "../block";
import { UnstyledButton } from "../unstyled-button";
const css = require("./footer-area.scss");

export interface FooterAreaProps extends React.HTMLAttributes<HTMLElement> {
  // Configuration
  inline?: boolean;
  centered?: boolean;
  alignRight?: boolean;
  to?: string;
  href?: string;
  onClick?: () => void;
  styles?: { [key: string]: string };
}

export const FooterArea = withPanelPosition(
  class FooterArea extends React.Component<FooterAreaProps & { panelPosition?: PanelPosition }> {
    public static defaultProps = {
      styles: css,
    };

    public static contextTypes = {
      blockContext: PropTypes.any,
    };

    public context!: { blockContext: { padding: BlockPadding; dividedFooter?: boolean } };

    public render() {
      const {
        className,
        inline,
        styles,
        children,
        panelPosition,
        to,
        href,
        onClick,
        centered,
        alignRight,
        ...passthrough
      } = this.props;
      const { blockContext: { padding = BlockPadding.Default, dividedFooter = false } = {} } = this.context;
      const classes = classNames.call(styles, "footer-area", className, {
        inline,
        dividedFooter,
        centered,
        alignRight,
        inSecondary: panelPosition === PanelPosition.Secondary,
        paddingPanel: padding === BlockPadding.Panel,
        paddingModal: padding === BlockPadding.Modal,
        unanchor: !!to,
      });
      const Tag = to ? Link : href ? "a" : onClick ? UnstyledButton : "div";

      return (
        <Tag className={classes} to={to!} href={href} onClick={onClick} {...passthrough}>
          {children}
        </Tag>
      );
    }
  }
);
