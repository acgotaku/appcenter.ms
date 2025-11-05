import * as React from "react";
import * as PropTypes from "prop-types";
import { Observer } from "mobx-react";
import { layoutStore } from "@root/stores";
import { Link } from "react-router";
import { PanelPosition } from "../panels";
import { maskMatches } from "../utils/bitmask";
import { GridSpacing } from "./grid";
import { FakeButton } from "../fake-button";
import { optionallyNavigationListItem } from "../list/navigation-list-item";
import { NavigationListItemProps } from "../list/navigation-list";
import { UseArrowKeyFocusOptions } from "../hooks";
import { omit } from "lodash";
const classNames = require("classnames/bind");
const css = require("./grid.scss");
const { createElement } = React;

export interface InternalRowProps<T extends HTMLElement = HTMLElement> extends React.HTMLAttributes<T> {
  reverse?: boolean | PanelPosition;
  start?: boolean | PanelPosition;
  center?: boolean | PanelPosition;
  end?: boolean | PanelPosition;
  top?: boolean | PanelPosition;
  middle?: boolean | PanelPosition;
  baseline?: boolean | PanelPosition;
  bottom?: boolean | PanelPosition;
  around?: boolean | PanelPosition;
  between?: boolean | PanelPosition;
  bordered?: boolean | PanelPosition;
  visible?: boolean | PanelPosition;
  responsive?: boolean | PanelPosition;
  columnSpacing?:
    | GridSpacing.None
    | GridSpacing.XXSmall
    | GridSpacing.XSmall
    | GridSpacing.Small
    | GridSpacing.Medium
    | GridSpacing.Large
    | GridSpacing.XLarge
    | GridSpacing.XXLarge; // GridSpacing.Page is not valid here. Can’t wait for subtractive types.
  tagName?: string | React.ComponentClass<any> | React.StatelessComponent<any>;
  href?: string;
  to?: string;
  /**
   * In Windows High Contrast Mode (WHCM), clickable Rows normally render with the `buttonText` color,
   * mirroring the way e.g. File Explorer shows rows (folders are basically link-like, right?).
   * In some cases, however, it may be necessary to preserve the default hyperlink color for Row.
   * Since there is no CSS `color` value for the correct hyperlink color, it’s impossible to set that
   * as a case-by-case override on components that render Row, so we have to hack this prop in here
   * in order for Row not to set `buttonText` as the color.
   */
  preserveHyperlinkWHCMColor?: boolean | PanelPosition;
  styles?: any;
  mouseOnly?: boolean; // only to be passed to the FakeButton component
}

export type RowProps<T extends HTMLElement = HTMLElement> = InternalRowProps<T> &
  Partial<NavigationListItemProps> &
  Partial<UseArrowKeyFocusOptions>;

export const Row = optionallyNavigationListItem({
  arrowKeyFocus: { orientation: "horizontal", enableArrowKeyFocus: PanelPosition.Secondary },
})(
  class GridRow extends React.PureComponent<InternalRowProps, {}> {
    public context!: {
      panelPosition?: PanelPosition;
    };

    public static displayName = "Row";

    public static defaultProps: Partial<InternalRowProps> = {
      tagName: "div",
      columnSpacing: GridSpacing.Medium,
      visible: true,
      responsive: false,
      styles: css,
    };

    public static contextTypes: React.ValidationMap<any> = {
      panelPosition: PropTypes.number,
    };

    get panelPosition() {
      return typeof this.context.panelPosition !== "undefined" ? this.context.panelPosition : PanelPosition.Primary;
    }

    get className() {
      const { panelPosition } = this;
      const cx = classNames.bind(this.props.styles);
      return cx(this.props["className"], "row", `space-${GridSpacing[this.props.columnSpacing!].toLowerCase()}`, {
        "reverse-xs": maskMatches(this.props.reverse!, panelPosition),
        "start-xs": maskMatches(this.props.start!, panelPosition),
        "center-xs": maskMatches(this.props.center!, panelPosition),
        "end-xs": maskMatches(this.props.end!, panelPosition),
        "top-xs": maskMatches(this.props.top!, panelPosition),
        "middle-xs": maskMatches(this.props.middle!, panelPosition),
        "baseline-xs": maskMatches(this.props.baseline!, panelPosition),
        "bottom-xs": maskMatches(this.props.bottom!, panelPosition),
        "around-xs": maskMatches(this.props.around!, panelPosition),
        "between-xs": maskMatches(this.props.between!, panelPosition),
        bordered: maskMatches(this.props.bordered!, panelPosition),
        hidden: !maskMatches(this.props.visible!, panelPosition),
        "preserve-whcm-hyperlink": maskMatches(this.props.preserveHyperlinkWHCMColor!, panelPosition),
        responsive: maskMatches(this.props.responsive!, panelPosition),
      });
    }

    public render() {
      let { tagName: TagName } = this.props;
      const {
        reverse,
        start,
        center,
        end,
        top,
        middle,
        baseline,
        bottom,
        around,
        between,
        bordered,
        visible,
        responsive,
        columnSpacing,
        tagName,
        href,
        preserveHyperlinkWHCMColor,
        to,
        styles,
        ...passthrough
      }: Omit<typeof this.props, "tReady"> = omit(this.props, "tReady");

      const { onClick, children } = this.props;
      if (href) {
        TagName = "a";
      } else if (to) {
        TagName = Link;
      } else if (onClick) {
        TagName = FakeButton;
      }

      const wrapWithRow = (children: React.ReactNode) => {
        return createElement(
          TagName!,
          { ...passthrough, className: this.className, to, href },
          <React.Suspense fallback={null}>{children}</React.Suspense>
        );
      };

      return !responsive || !layoutStore.isMobile ? (
        wrapWithRow(children)
      ) : (
        <Observer children={() => React.Children.map(children, wrapWithRow)} />
      );
    }
  }
);
