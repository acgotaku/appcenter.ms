import * as React from "react";
import * as PropTypes from "prop-types";
import { PanelPosition, withPanelPosition } from "../panels";
const classNames = require("classnames/bind");
const css = require("./grid.scss");
const { createElement } = React;

export enum GridSpacing {
  None,
  /** Automatically determines row spacing depending on context and viewport size. Not supported for `columnSpacing`. */
  Page,
  /** 4px */
  XXSmall,
  /** 8px */
  XSmall,
  /** 16px */
  Small,
  /** 20px */
  Medium,
  /** 24px */
  XMedium,
  /** 32px */
  Large,
  /** 40px */
  XLarge,
  /** 60px */
  XXLarge,
}

export interface GridProps extends React.HTMLAttributes<HTMLElement> {
  tagName?: string;
  bordered?: boolean | PanelPosition;
  padded?: boolean | PanelPosition;
  rowSpacing?: GridSpacing;
  panelPosition?: PanelPosition;
  styles?: any;
}

export const Grid = withPanelPosition(
  class Grid extends React.Component<GridProps, {}> {
    public context!: { inModal: boolean };

    public static defaultProps = {
      tagName: "div",
      rowSpacing: GridSpacing.Medium,
      panelPosition: PanelPosition.Primary,
      styles: css,
    };

    public static contextTypes = {
      inModal: PropTypes.bool,
    };

    public render() {
      const { inModal } = this.context;
      const { className, tagName, bordered, padded, rowSpacing, panelPosition, styles, ...passthrough } = this.props;

      const cx = classNames.bind(styles);
      return createElement<React.HTMLAttributes<HTMLElement>, HTMLElement>(
        tagName!,
        Object.assign({}, passthrough, {
          className: cx(className, "container-fluid", `space-${GridSpacing[rowSpacing!].toLowerCase()}`, {
            bordered,
            padded,
            inModal,
            primary: panelPosition === PanelPosition.Primary,
          }),
        }),
        this.props.children
      );
    }
  }
);
