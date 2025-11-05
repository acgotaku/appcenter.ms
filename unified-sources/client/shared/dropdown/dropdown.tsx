import * as React from "react";
import * as classNames from "classnames/bind";
import { observable } from "mobx";
import { observer } from "mobx-react";
import { debounce, deburr, noop, toUpper, trim } from "lodash";
import { getTriggerFromChildren, TriggerProps, TriggerInjectedProps, Trigger } from "../trigger/trigger";
import { OverlayTransition } from "../overlay/overlay";
import { IconName } from "../icon/icon";
import { SearchInput, Input, InputSize } from "../input";
import { Spinner } from "../spinner/spinner";
import { Keys, isAlphanumeric } from "../utils/keys";
import { OverlayPositioner, DefaultizedOverlayPositionerProps } from "../overlay-positioner/overlay-positioner";
import { ListItemContext, listItemContextTypes } from "./list-item-context";
import { InternalDropdownProps } from "./internal-types";
import { startsWith } from "lodash/fp";
import { t } from "@root/lib/i18n";
import * as detectSmallScreen from "./detect-small-screen";
import { Omit } from "@lib/common-interfaces";
import { Tooltip } from "..";
import * as mergeProps from "merge-props";
import { globalUIStore } from "@root/stores";

const css = require("./dropdown.scss");
const { Children } = React;

function isTriggerHTMLElement(trigger: Element): trigger is HTMLElement {
  return trigger instanceof HTMLElement;
}

function isTextInputElement(element: Element) {
  return element && ((element instanceof HTMLInputElement && element["type"] === "text") || element instanceof HTMLTextAreaElement);
}

const isNonDisabledItem = (e: HTMLElement) => e.hasAttribute("data-list-item-id") && !e.hasAttribute("data-disabled");
function walkSiblingsUntil(
  startingElement: Element | null,
  direction: "forward" | "backward",
  condition: (el: HTMLElement) => boolean
) {
  let element: Element | null = startingElement;
  while (element instanceof HTMLElement && !condition(element)) {
    element = direction === "forward" ? element.nextElementSibling : element.previousElementSibling;
  }

  return element as HTMLElement;
}

/**
 * Props passed to a Dropdown component
 */
export interface DropdownProps extends Omit<DefaultizedOverlayPositionerProps, "trigger"> {
  onClose?(): void;
  onActivateItem?(value: string, event: React.SyntheticEvent<HTMLElement>): void;
  onActivateItemWithKeyboard?(value: string, event: React.KeyboardEvent<HTMLElement>): void;
  onSearch(query: string): void;
  onFocusItem(focusedItem: HTMLElement | undefined): void;
  visible?: boolean;
  compact?: boolean;
  dark?: boolean;
  searchable?: boolean;
  spinning?: boolean;
  sizeListToTrigger?: boolean;
  minListWidth?: number | string;
  listClassName?: string;
  header?: React.ReactElement<any>;
  typeable?: boolean;
  firstItemFocus?: boolean;
  tooltip?: string | { text: string; alignRight?: boolean };
}

/**
 * Dropdown component state
 */
export interface DropdownState {
  visible: boolean;
  query?: string;
  focusedItem?: HTMLElement | null;
  shouldScroll?: boolean; // Determines auto scroll on focus
  typed?: string;
  results: number;
  portaled: boolean;
}

/**
 * @deprecated
 * Use @root/shared/dropdown/v2 instead
 */
@observer
export class Dropdown extends React.Component<DropdownProps & InternalDropdownProps, DropdownState> {
  /**
   * Fallback values used when props aren't passed to the Select component
   * @static
   */
  public static defaultProps = {
    onClose: noop,
    onActivateItemWithKeyboard: noop,
    onRegisterItem: noop,
    onUnregisterItem: noop,
    onSearch: noop,
    onFocusItem: noop,
    compact: false,
    searchable: false,
    typeable: true,
    transitionOut: OverlayTransition.Fade,
    minListWidth: css.minWidth,
    styles: css,
  };

  public static childContextTypes = listItemContextTypes;

  /**
   * Dropdown component state
   * @type {DropdownState}
   */
  public state: DropdownState = {
    results: 0,
    focusedItem: undefined,
    visible: false,
    query: "",
    typed: "",
    portaled: false,
  };

  private itemsByText = new Map<string, { value: string; getDOMNode: () => HTMLElement }>();
  private input = React.createRef<Input>();
  public overlaypositioner: OverlayPositioner | null = null;
  public scrollable: HTMLElement | null = null;

  private normalizeText(text: string) {
    return toUpper(deburr(trim(text)));
  }

  private registerItem = (text: string, value: string | null, getDOMNode: () => HTMLElement) => {
    this.itemsByText.set(this.normalizeText(text), { value: value || "", getDOMNode });
    this.props.onRegisterItem!(text, value || "", getDOMNode);
  };

  private unregisterItem = (text: string, value?: string) => {
    this.itemsByText.delete(text);
    this.props.onUnregisterItem!(text, value);
  };

  private getItemsFromChildren = (props?: DropdownProps) => {
    const childrenArray = Children.toArray(props?.children ?? this.props.children).slice(1);
    const numberOfItems = childrenArray.length;

    return childrenArray.map((child, i) => {
      if (React.isValidElement(child) && this.props.role !== "menu") {
        // menu is not supposed to have children with role other than "menuitem"

        // for making screenreaders correctly announce the current option's index and the total number of options in the list
        // @ts-ignore
        return React.cloneElement(child, { "aria-posinset": i + 1, "aria-setsize": numberOfItems, role: "option" });
      }
      return child;
    });
  };

  // TS doesn’t get the right typings for this, thinking that a
  // computed inside an observable object will still be boxed in an IComputedValue.
  private childContext: ListItemContext["dropdownContext"] = (() => {
    const { registerItem, unregisterItem } = this;
    const self = this;
    return observable({
      get compact() {
        return self.props.compact || false;
      },
      get dark() {
        return self.props.dark || false;
      },
      get onSearch() {
        return self.props.onSearch;
      },
      get searchable() {
        return self.props.searchable || false;
      },
      get query() {
        return self.props.searchable && self.props.onSearch === noop ? self.state.query : null;
      },
      get focusedItemId() {
        return self.state.focusedItem ? self.state.focusedItem.getAttribute("data-list-item-id") : null;
      },
      get onSelect() {
        return self.props.onActivateItem;
      },
      onMouseEnter: (e: React.MouseEvent<HTMLElement>) => self.setState({ focusedItem: e.currentTarget, shouldScroll: false }),
      onMouseLeave: (e: React.MouseEvent<HTMLElement>) => self.setState({ focusedItem: undefined }),
      registerItem,
      unregisterItem,
    });
  })();

  public getChildContext = (): ListItemContext => {
    return { dropdownContext: this.childContext };
  };

  /**
   * Toggles visibility of Dropdown
   */
  public toggleVisible = () => {
    this.state.visible ? this.hide() : this.show();
  };

  public hide = (event?: Event | React.SyntheticEvent<HTMLElement>, refocus?: boolean) => {
    if (!this.isControlled) {
      this.setState({ visible: false });
    }

    this.props.onClose!();

    if (refocus) {
      globalUIStore.returnFocus();
    }
  };

  /**
   * Set visibility and reset focusedIndex and query.
   */
  public show = () => {
    globalUIStore.setFocusReturnElement(document.activeElement);

    const { getInitialFocusedItem, firstItemFocus } = this.props;

    this.setState({
      visible: true,
      query: "",
      typed: "",
      focusedItem: getInitialFocusedItem ? getInitialFocusedItem() : undefined,
    });

    if (firstItemFocus && !this.isControlled) {
      this.focusFirst();
    }
  };

  private get isControlled() {
    return this.props.hasOwnProperty("visible");
  }

  private get visible() {
    return this.isControlled ? this.props.visible : this.state.visible;
  }

  private get triggerElement() {
    if (!this.overlaypositioner || !this.overlaypositioner.element || this.overlaypositioner.element.childElementCount === 0) {
      return undefined;
    }

    return this.overlaypositioner.element.children[0];
  }

  /**
   * Store typed character. Used to determine focused list item.
   */
  private type = (character: string, event: React.KeyboardEvent<HTMLElement>) => {
    this.setState({ typed: this.state.typed + character }, () => {
      if (!this.visible) {
        this.selectMatch(event);
      } else {
        this.focusMatch();
      }

      this.clearTypedAfterInactivity();
    });
  };

  private focusPrevious = () => {
    const { focusedItem } = this.state;
    if (!focusedItem || !focusedItem.offsetParent) {
      const lastChild = this.scrollable && this.scrollable.children.item(this.scrollable.childElementCount - 1);
      if (lastChild) {
        const lastItemInLastGroup = lastChild.hasAttribute("data-item-group")
          ? lastChild.children.item(lastChild.childElementCount - 1)
          : lastChild;
        const lastNonDisabledItem = walkSiblingsUntil(lastItemInLastGroup, "backward", isNonDisabledItem);
        if (lastNonDisabledItem) {
          this.setState({ focusedItem: lastNonDisabledItem, shouldScroll: true });
        }
      }
    } else {
      const prevItem = focusedItem.previousElementSibling;
      const nonDisabled = walkSiblingsUntil(prevItem, "backward", isNonDisabledItem);
      if (nonDisabled) {
        this.setState({ focusedItem: nonDisabled, shouldScroll: true });
      } else {
        const prevGroup = focusedItem.parentElement && focusedItem.parentElement.previousElementSibling;
        if (prevGroup && prevGroup.hasAttribute("data-item-group")) {
          const lastItemInPrevGroup = prevGroup.children.item(prevGroup.childElementCount - 1);
          const lastNonDisabledItem = walkSiblingsUntil(lastItemInPrevGroup, "backward", isNonDisabledItem);
          if (lastNonDisabledItem) {
            this.setState({ focusedItem: lastNonDisabledItem, shouldScroll: true });
          }
        }
      }
    }
  };

  private focusFirst = () => {
    const firstChild = this.scrollable && this.scrollable.children.item(0);
    if (firstChild) {
      const firstItemInFirstGroup = firstChild.hasAttribute("data-item-group")
        ? firstChild.children.item(1) // 1 because 0 is the group title
        : firstChild;
      const firstNonDisabledItem = walkSiblingsUntil(firstItemInFirstGroup, "forward", isNonDisabledItem);
      if (firstNonDisabledItem) {
        this.setState({ focusedItem: firstNonDisabledItem, shouldScroll: true });
      }
    }
  };

  private focusNext = () => {
    const { focusedItem } = this.state;
    if (!focusedItem || !focusedItem.offsetParent) {
      this.focusFirst();
    } else {
      const next = focusedItem.nextElementSibling;
      const nonDisabled = walkSiblingsUntil(next, "forward", isNonDisabledItem);
      if (nonDisabled) {
        this.setState({ focusedItem: nonDisabled, shouldScroll: true });
      } else {
        const nextGroup = focusedItem.parentElement && focusedItem.parentElement.nextElementSibling;
        if (nextGroup && nextGroup.hasAttribute("data-item-group")) {
          const firstItemInNextGroup = nextGroup.children.item(1) as HTMLElement; // 1 because 0 is the group title
          const firstNonDisabledItem = walkSiblingsUntil(firstItemInNextGroup, "forward", isNonDisabledItem);
          if (firstNonDisabledItem) {
            this.setState({ focusedItem: firstNonDisabledItem, shouldScroll: true });
          }
        }
      }
    }
  };

  /**
   * Get text for each list item
   */
  private get texts() {
    return Array.from(this.itemsByText.keys());
  }

  /**
   * Get first list item matching stored characters
   */
  private get match() {
    const match = this.texts.find(startsWith(this.state.typed!));
    return this.state.typed && match ? match : null;
  }

  /**
   * Get index of first list item matching stored characters
   */
  private get matchingItem() {
    return this.match ? this.itemsByText.get(this.match) : undefined;
  }

  /**
   * Focus first list item matching stored characters. Emulates HTMLSelectElement behavior.
   */
  private focusMatch = () => {
    const match = this.match;
    if (match) {
      const matchingItem = this.itemsByText.get(match);
      this.setState({ focusedItem: matchingItem!.getDOMNode() });
    }
  };

  /**
   * Select first list item matching stored characters. Emulates HTMLSelectElement behavior.
   */
  private selectMatch = (event: React.KeyboardEvent<HTMLElement>) => {
    if (this.props.onActivateItem) {
      const matchingItem = this.matchingItem;
      if (matchingItem) {
        this.props.onActivateItem(matchingItem.value, event);
      }
    }
  };

  /**
   * Clear stored characters after a period of activity
   */
  private clearTypedAfterInactivity = debounce(() => {
    this.setState({ typed: "" });
  }, 800);

  private scrollToFocused = () => {
    const scrollable = this.scrollable;
    const focused = this.state.focusedItem;
    if (!scrollable || !focused || focused.offsetTop === null) {
      return;
    }
    const offsetTop = focused.getBoundingClientRect().top - scrollable.getBoundingClientRect().top;

    // Item is below: scroll down
    if (offsetTop + focused.offsetHeight > scrollable.offsetHeight) {
      scrollable.scrollTop += offsetTop + focused.offsetHeight - scrollable.offsetHeight;
      // Item is above: scroll up
    } else if (offsetTop < 0) {
      scrollable.scrollTop += offsetTop;
    }
  };

  private onKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    switch (event.which) {
      case Keys.Space:
        // Trigger might be something you can type into; you should be able to type a space
        if (document.activeElement && isTextInputElement(document.activeElement) && event.which === Keys.Space) {
          return;
        }
      case Keys.Enter:
        if (this.visible && this.state.focusedItem) {
          this.state.focusedItem.click();
          if (!this.props.sticky) {
            this.hide();
          }
          event.preventDefault();
          event.stopPropagation();
        }
        break;
      case Keys.Tab:
        /** If this dropdown has a search field, and "Tab" key is pressed in combination with "Shift", then we don't want to hide the
         dropdown options, but instead allow the default behavior (focusing the previous focusable field).
         However, when focusedItem is undefined, that means that the focus is currently on the search field, 
         and so we want to allow the default behavior as there is no need to navigate to the search field.
        */
        if (this.visible && (!this.props.searchable || !(event.shiftKey && this.state.focusedItem))) {
          this.hide();
        }
        break;
      case Keys.Down:
        event.preventDefault();
        event.stopPropagation();
        if (!this.visible) {
          this.show();
        } else {
          this.focusNext();
        }
        break;
      case Keys.Up:
        event.preventDefault();
        event.stopPropagation();
        if (this.visible) {
          this.focusPrevious();
        }
        break;
      case Keys.Shift:
        // we don't want to focus the search field when "Shift" is pressed,
        // as that would present an accessibility issue (preventing user from using SHIFT + TAB)
        break;
      case Keys.Escape:
        if (this.visible) {
          // we only want to take full control of the escape behavior when the dropdown is open,
          // otherwise we shouldn't interfere with the default behavior
          event.stopPropagation();
        }
        this.hide();
        break;
      default:
        if (this.props.typeable && !this.props.searchable && isAlphanumeric(event.which)) {
          event.stopPropagation();
          this.type(String.fromCharCode(event.which), event);
        } else if (this.props.typeable && !this.props.searchable && event.which !== Keys.Escape && this.visible) {
          event.preventDefault();
          event.stopPropagation();
        }

        if (this.props.searchable && this.input.current) {
          this.input.current.focus();
        }
    }
  };

  private onSearch = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const query = event.target.value;
    const normalizedQuery = this.normalizeText(query);
    const results = this.texts.filter((text) => text.includes(normalizedQuery)).length;
    this.setState({ query, results });
    this.props.onSearch!(query);
  };

  private handleSmallScreen = debounce((event: MediaQueryList | MediaQueryListEvent) => {
    if (this.state.portaled !== event.matches) {
      this.setState({ portaled: event.matches });
    }
  }, 200);

  public UNSAFE_componentWillMount() {
    detectSmallScreen.register(this.handleSmallScreen);
  }

  public UNSAFE_componentWillReceiveProps(nextProps: DropdownProps) {
    if (!this.props.visible && nextProps.visible) {
      this.setState({ typed: "" });
    }
  }

  public componentDidUpdate(prevProps: DropdownProps, prevState: DropdownState) {
    const { triggerElement } = this;
    const { shouldScroll, focusedItem } = this.state;
    const wasVisible = prevState.visible || prevProps.visible;
    // When an open Dropdown is closed, reset its focusedItem to null and focus trigger
    if (!this.visible && wasVisible) {
      if (focusedItem) {
        this.setState({ focusedItem: undefined });
      }
      if (triggerElement && isTriggerHTMLElement(triggerElement)) {
        triggerElement.focus();
      }
    }
    // When a closed Dropdown is first opened, focus its search input (if exists)
    if (this.visible && !wasVisible) {
      if (this.input.current) {
        // Setting focus leads to scrolling element into view
        // Edge/Chrome needs additional time to calculate scroll position properly right after dropdown was opened
        setTimeout(() => this.input.current!.focus());
      } else if (triggerElement && isTriggerHTMLElement(triggerElement)) {
        triggerElement.focus();
      }

      // read first menu item by ScreenReader
      if (this.isControlled && this.props.firstItemFocus) {
        this.focusFirst();
      }
    }

    // read first menu item by ScreenReader when items has changed
    if (
      this.props.firstItemFocus &&
      this.isControlled &&
      this.visible &&
      wasVisible &&
      (this.getItemsFromChildren().shift() as React.ReactChild & { key }).key !==
        (this.getItemsFromChildren(prevProps).shift() as React.ReactChild & { key })?.key
    ) {
      this.focusFirst();
    }

    if (
      // When a closed Dropdown is first opened, scroll to its focused item
      (this.visible && !wasVisible) ||
      // When a new item is focused, scroll to it, but only if focus is achived using the keyboard
      (shouldScroll && focusedItem !== prevState.focusedItem)
    ) {
      this.scrollToFocused();
    }

    // Below is required for accessibility case
    // When search input is focused screen reader doesn't announce dropdown items
    if (focusedItem && focusedItem !== prevState.focusedItem) {
      // Setting focus leads to scrolling element into view
      // Edge/Chrome needs additional time to calculate scroll position properly right after dropdown was opened
      if (wasVisible) {
        focusedItem.focus();
      } else {
        setTimeout(() => focusedItem.focus());
      }

      this.props.onFocusItem(focusedItem);
    }
  }

  public componentWillUnmount() {
    detectSmallScreen.unregister(this.handleSmallScreen);
    this.handleSmallScreen.cancel();
  }

  private getTrigger(tooltipTriggerProps?: TriggerInjectedProps) {
    const trigger = getTriggerFromChildren(this.props.children, "Dropdown");
    const triggerChildren = trigger.props.children;
    const childRef = React.createRef<Element>();
    const ariaProps: Partial<TriggerProps> = {
      "aria-haspopup": "listbox",
    };

    const newChildren = tooltipTriggerProps
      ? (menuTriggerProps: TriggerInjectedProps) => {
          if (typeof triggerChildren === "function") {
            return triggerChildren;
          }
          const { "data-test-class": dataTestClassSkip, active: activeSkip, ...tooltipClearProps } = tooltipTriggerProps;
          const { "data-test-class": dataTestClass, "aria-expanded": expanded, active, ...menuTriggerClearProps } = menuTriggerProps;
          const mergedProps = mergeProps(tooltipClearProps, menuTriggerClearProps, triggerChildren.props);

          return React.cloneElement(
            triggerChildren,
            {
              ...mergedProps,
              active,
              tabIndex: trigger.props.tabIndex,
              "data-test-id": trigger.props.hasOwnProperty("data-test-id") && trigger.props["data-test-id"],
              "data-test-class": dataTestClass,
              "aria-haspopup": "listbox",
              "aria-expanded": expanded,
              ref: childRef,
            },
            mergedProps.children
          );
        }
      : triggerChildren;

    return React.cloneElement(
      trigger,
      {
        ...trigger.props,
        ...ariaProps,
        childRef,
      },
      newChildren
    );
  }

  private renderOverlayPositioner(tooltipTriggerProps?: TriggerInjectedProps): JSX.Element {
    const { query, results } = this.state;
    const { sticky, className } = this.props;
    const {
      onClose,
      onActivateItem,
      onActivateItemWithKeyboard,
      onRegisterItem,
      onUnregisterItem,
      onSearch,
      getInitialFocusedItem,
      onFocusItem,
      compact,
      dark,
      searchable,
      spinning,
      visible,
      listClassName,
      header,
      typeable,
      sizeListToTrigger,
      minListWidth,
      styles,
      firstItemFocus,
      ...passthrough
    } = this.props;

    const cx = classNames.bind(styles);
    const portaled = typeof this.props.portaled !== "undefined" ? this.props.portaled : this.state.portaled;

    return (
      <OverlayPositioner
        {...passthrough}
        aria-activedescendant={this.state.focusedItem ? this.state.focusedItem.id : undefined}
        portaled={portaled}
        trigger={this.getTrigger(tooltipTriggerProps)}
        onKeyDown={this.onKeyDown}
        onToggleVisible={this.isControlled ? noop : this.toggleVisible}
        onRequestClose={(e, refocus) => this.hide(e, refocus)}
        onInsideClick={sticky ? noop : this.hide}
        className={cx("dropdown", className)}
        overlayClassName={cx(listClassName, "list", { dark, portaled })}
        style={{ minWidth: minListWidth }}
        sizeOverlayToTrigger={sizeListToTrigger}
        visible={this.visible}
        aria-expanded={this.visible}
        ref={(x) => (this.overlaypositioner = x)}
        tabTrap={false}
        isDropdown={true}
      >
        {searchable || header ? (
          <div className={styles.headerContainer} onClick={(e) => e.stopPropagation()}>
            {header ? <div className={styles.header}>{header}</div> : null}
            {searchable ? (
              <SearchInput
                role="search"
                resultsCount={results}
                setRef={this.input}
                icon={IconName.Search}
                size={InputSize.Small}
                placeholder={t("common:placeholder.search")}
                onChange={this.onSearch}
                className={styles.search}
                value={query}
                autoFocus
              />
            ) : null}
          </div>
        ) : null}
        <div
          className={styles.scrollable}
          ref={(x) => (this.scrollable = x)}
          role={
            searchable ? "presentation" : undefined
          } /** role needs to be "presentation" for search suggestions to be read, 
          but if normal dropdown will have this, then all items will be announced, which is not necessary */
          data-test-class="dropdown-list-items"
        >
          {this.getItemsFromChildren()}
          {spinning ? <Spinner /> : null}
        </div>
      </OverlayPositioner>
    );
  }

  /**
   * Renders a Dropdown component
   * @returns {JSX.Element} Dropdown component
   */
  public render() {
    const { tooltip } = this.props;

    if (tooltip) {
      const [tooltipText, forceRight] = typeof tooltip === "string" ? [tooltip] : [tooltip.text, tooltip.alignRight];

      return (
        <Tooltip forceRight={forceRight}>
          <Trigger>{(tooltipTriggerProps: TriggerInjectedProps) => this.renderOverlayPositioner(tooltipTriggerProps)}</Trigger>
          {tooltipText}
        </Tooltip>
      );
    }

    return this.renderOverlayPositioner();
  }
}
