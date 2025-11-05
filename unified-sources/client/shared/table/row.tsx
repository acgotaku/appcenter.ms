import * as React from "react";
import * as PropTypes from "prop-types";
import { Checkbox } from "../checkbox";
import { InjectedRowProps, RowContext } from "./types";
import { UpdateBlocker } from "../update-blocker";
import { FakeLink, FakeLinkProps } from "../fake-link";
import { Omit } from "@lib/common-interfaces/omit";
import { navigationListItem, NavigationListItemProps, NavigationListItemInjectedProps } from "../list";
import { Cell } from "./cell";
import { ButtonContainer } from "../button-container";
import { preventBubbling } from "../utils";
const css = require("./row.scss");
const cellStyles = require("./cell.scss");

export interface InternalRowProps
  extends NavigationListItemInjectedProps,
    InjectedRowProps,
    Omit<
      React.HTMLAttributes<HTMLElement>,
      | "style"
      | "onSelect"
      | "onKeyDown"
      | "className"
      | "placeholder"
      | "onFocus"
      | "onFocusCapture"
      | "onBlurCapture"
      | "onMouseDownCapture"
    > {
  to?: string;
  href?: string;
  progress?: boolean;
  styles?: any;
}

export type RowProps = InternalRowProps & NavigationListItemProps;

export interface RowState {
  tabIndex: number;
}

const noop = () => undefined;

export const Row = navigationListItem({
  passthrough: ["narrow"],
})(
  class extends React.Component<InternalRowProps, RowState> {
    public static displayName = "Row";

    public static defaultProps: Partial<InternalRowProps> = {
      placeholder: false,
      onSelect: noop,
      onDeselect: noop,
      styles: css,
    };

    public static childContextTypes = {
      to: PropTypes.string,
      href: PropTypes.string,
    };

    public getChildContext(): RowContext {
      return {
        to: this.props.to,
        href: this.props.href,
      };
    }

    private onCheckboxClick = (event: React.SyntheticEvent<HTMLInputElement>) => {
      // since we might be wrapped in an @WackWack-simulated anchor, we need to prevent navigation
      event.stopPropagation();
    };

    private onCheckboxChange = (event: React.SyntheticEvent<HTMLInputElement>) => {
      event.stopPropagation();
      if (event.currentTarget.checked) {
        this.props.onSelect();
      } else {
        this.props.onDeselect();
      }
    };

    private get children() {
      const { selectable, selected, narrow, isList } = this.props;
      const children = React.Children.toArray(this.props.children) as React.ReactElement<any>[];
      return children.map((cell: React.ReactElement<any>, index: number) =>
        React.cloneElement(
          cell,
          !narrow
            ? {
                "aria-describedby": `${this.props.tableId}-header-${index + 1}`,
                "aria-selected": selectable ? selected : null,
                headers: isList ? undefined : `${this.props.tableId}-header-${index + 1}`,
                role: isList ? undefined : "gridcell",
                ...cell.props,
              }
            : cell.props
        )
      );
    }

    private get isNavigable() {
      return this.props.to || this.props.href || this.props.onClick;
    }

    private get ariaRowIndex(): number {
      // aria-rowindex is one based, and needs to include the header. So we will always need
      // to at least add 1 to the index, and if headers are present, we need to add one again.
      return this.props.tableWithoutHeader ? this.props.index + 1 : this.props.index + 2;
    }

    public render() {
      const {
        placeholder,
        selectable,
        selected,
        narrow,
        progress,
        label,
        className,
        isScrolling,
        selectionDisabled,
        index,
        href,
        to,
        active,
        actions,
        isList,
        rowHeight,
        onDeselect,
        styles,
        tableId,
        tableWithoutHeader,
        ...passthrough
      } = this.props;
      const styleModifier = selectable ? "-selectable" : "";
      const styleName = placeholder ? `placeholder-row${styleModifier}` : `row${styleModifier}`;
      const classNames = [
        className || "",
        styles[styleName],
        this.props.onClick || this.props.to ? styles.clickable : "",
        progress ? styles.progress : "",
        narrow ? styles.narrow : "",
        selected ? styles.selected : "",
      ].join(" ");
      const selectableAriaLabelledby = `${this.props.tableId}-header-0`;
      const Element = this.isNavigable ? FakeLink : "div";
      const fakeLinkProps: FakeLinkProps = { href, to };

      return (
        <Element
          {...passthrough}
          {...(Element === FakeLink ? fakeLinkProps : null)}
          {...(active ? { "data-akf-auto": true } : null)}
          className={classNames}
          role={narrow || isList ? "listitem" : "row"}
          data-table-row
          data-test-class={["row", this.props["data-test-class"]].join(" ")}
          data-test-index={(index || "").toString()}
          aria-rowindex={narrow || isList ? undefined : this.ariaRowIndex} // this attribute is not allowed for this role (role="listitem")
          {...(actions && actions.length ? { "data-has-actions": true } : null)}
        >
          <UpdateBlocker active={!!isScrolling}>
            {selectable ? (
              <div
                className={`${styles["checkbox-cell"]} ${cellStyles.checkboxCell}`}
                role="gridcell"
                aria-labelledby={selectableAriaLabelledby}
                aria-selected={selected}
              >
                <Checkbox
                  data-test-class="table-row-checkbox"
                  label={label}
                  checked={selected}
                  disabled={selectionDisabled || placeholder}
                  onChange={this.onCheckboxChange}
                  onClick={this.onCheckboxClick}
                />
              </div>
            ) : null}
            {this.children}
            {actions && actions.length && (
              <Cell
                hideUntilRowHover
                className={css.actions}
                data-is-actions="true"
                onClick={preventBubbling}
                role={isList ? undefined : "gridcell"}
                aria-describedby={`${this.props.tableId}-header-${React.Children.toArray(this.props.children).length + 1}`}
              >
                <ButtonContainer>{actions}</ButtonContainer>
              </Cell>
            )}
          </UpdateBlocker>
        </Element>
      );
    }
  }
);
