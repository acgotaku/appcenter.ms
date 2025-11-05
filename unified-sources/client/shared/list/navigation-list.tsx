import * as React from "react";
import * as PropTypes from "prop-types";
import * as classNames from "classnames/bind";
import { reaction } from "mobx";
import { ListProps, ListItemInjectedProps, ItemInfo, NavigationListItemInfo, ListContainerInjectedProps } from "./types";
import { List } from "./list";
import { PanelPosition } from "../panels/panel-position";
import { observer } from "mobx-react";
import { layoutStore } from "@root/stores";
import { Omit } from "@lib/common-interfaces";
import { ArrowKeyFocuser, UseArrowKeyFocusOptions, UseArrowKeyFocusProps } from "../hooks/use-arrow-key-focus";
const css = require("./navigation-list.scss");
const cx = classNames.bind(css);

export interface NavigationListItemProps extends ListItemInjectedProps {
  narrow: boolean;
  active: boolean;
  compact: boolean;
  "data-navigation-list-item": boolean;
  "aria-current"?: boolean | "false" | "true" | "page" | "step" | "location" | "date" | "time";
}

export interface NavigationListContainerInjectedProps extends ListContainerInjectedProps, Partial<UseArrowKeyFocusProps> {
  className: string;
}

// @ts-ignore
export interface NavigationListProps<T> extends Omit<ListProps<T>, keyof NavigationListProps<T>>, Partial<UseArrowKeyFocusOptions> {
  /**
   * Renders List’s root element.
   * @param props Props that should be spread over the returned element. Props include `children` as the list items to be rendered, so overriding `children` or failing to pass them to the returned element will result in no list items being rendered.
   * @example <List renderContainer={props => <Card {...props} />} />
   */
  renderContainer(props: NavigationListContainerInjectedProps): JSX.Element;
  /**
   * Called for each entry of `items` to determine how a row should render that entry.
   * @param item The entry from `items`.
   * @param props A collection of props calculated by List that must be passed to the item element, used for positioning and styling.
   * @param info Contains the index of the entry in `items`. When `virtualized` is true, also contains additional information about the scrolling and visibility of the row.
   * @returns An element composing the `navigationListItem()` higher order component, which accepts the injected props and converts them to a className to apply the correct styles.
   */
  renderItem: (item: T, props: NavigationListItemProps, info: NavigationListItemInfo) => JSX.Element;
  /**
   * Called for each placeholder item to determine how to display skeleton UI for a item whose data has not yet been fetched. Defaults to a pulsing gray block in each cell.
   * @param props A collection of props calculated by List that must be passed to the item element, used for positioning and styling.
   * @param info Contains the index of the entry in `items`. When `virtualized` is true, also contains additional information about the scrolling and visibility of the row.
   * @returns An element composing the `navigationListItem()` higher order component, which accepts the injected props and converts them to a className to apply the correct styles.
   */
  renderPlaceholderItem?: (props: NavigationListItemProps, info: NavigationListItemInfo) => JSX.Element;
  /** The row that should appear as active in secondary panels to indicate that it represents the current Primary Panel. */
  activeItem: null | T | ((item: T) => boolean);
  /** Passed through to each item to indicate that it should be rendered with less padding. */
  compact?: boolean;
  // Sometimes the ArrowKeyFocuser component causes accessibility issues. In that case, you can use this prop to not use it
  disableArrowKeyFocuser?: boolean;
}

export class NavigationList<T> extends React.Component<NavigationListProps<T>> {
  public static displayName = "NavigationList";
  public static List = List;
  public static Observer = observer(
    class<T> extends NavigationList<T> {
      public static displayName = "NavigationList.Observer";
      public static List = List.Observer;
    }
  );

  public static defaultProps = {
    orientation: "vertical",
    focusableElementFilter: (element) => element.hasAttribute("data-navigation-list-item"),
  };

  public static contextTypes = {
    panelPosition: PropTypes.number,
  };

  public list: List<T> | null = null;
  public context!: { panelPosition: PanelPosition };

  private disposeLayoutReaction = reaction(
    () => layoutStore.isMobile,
    () => {
      this.forceUpdate();
    }
  );

  private shouldRenderNarrow() {
    return this.context.panelPosition && this.context.panelPosition !== PanelPosition.Primary;
  }

  private enhanceListItemInjectedProps(item: T | null, props: ListItemInjectedProps): NavigationListItemProps {
    const { activeItem, compact } = this.props;
    const isActive = !!item && (activeItem === item || (typeof activeItem === "function" && (activeItem as Function)(item)));

    return {
      ...props,
      compact: !!compact,
      narrow: this.shouldRenderNarrow(),
      active: isActive,
      "aria-current": isActive ? "page" : undefined,
      "data-navigation-list-item": true,
    };
  }

  private renderItem = (item: T, props: ListItemInjectedProps, info: ItemInfo) => {
    return this.props.renderItem(item, this.enhanceListItemInjectedProps(item, props), {
      ...info,
      isNarrow: this.shouldRenderNarrow() || layoutStore.isMobile,
    });
  };

  private renderPlaceholderItem = (props: ListItemInjectedProps, info: ItemInfo) => {
    if (this.props.renderPlaceholderItem) {
      return this.props.renderPlaceholderItem(this.enhanceListItemInjectedProps(null, props), {
        ...info,
        isNarrow: this.shouldRenderNarrow() || layoutStore.isMobile,
      });
    }

    return null;
  };

  componentWillUnmount() {
    this.disposeLayoutReaction();
  }

  public render() {
    const List = (this.constructor as typeof NavigationList).List;
    const narrow = this.shouldRenderNarrow();
    const { focusableElementFilter, orientation, focusContainer, enableArrowKeyFocus, ...listPassthrough } = this.props;

    if (this.props.disableArrowKeyFocuser) {
      return (
        <List
          ref={(x) => (this.list = x)}
          {...listPassthrough}
          renderContainer={(props) =>
            this.props.renderContainer({
              ...props,
              className: cx(css.navigationList, { narrow }),
            })
          }
          renderItem={this.renderItem}
          renderPlaceholderItem={this.renderPlaceholderItem}
        />
      );
    }

    return (
      <ArrowKeyFocuser
        focusableElementFilter={focusableElementFilter}
        orientation={orientation!}
        focusContainer={focusContainer}
        enableArrowKeyFocus={enableArrowKeyFocus}
      >
        {(arrowKeyFocusProps) => (
          <List
            ref={(x) => (this.list = x)}
            {...listPassthrough}
            renderContainer={(props) =>
              this.props.renderContainer({
                ...props,
                ...arrowKeyFocusProps,
                className: cx(css.navigationList, { narrow }),
              })
            }
            renderItem={this.renderItem}
            renderPlaceholderItem={this.renderPlaceholderItem}
          />
        )}
      </ArrowKeyFocuser>
    );
  }
}
