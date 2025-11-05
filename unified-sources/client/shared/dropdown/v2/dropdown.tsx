import * as React from "react";
import * as classNames from "classnames/bind";
import * as memoize from "memoizee";
import { t } from "@root/lib/i18n";
import { findDOMNode } from "react-dom";
import { debounce, noop, toUpper, deburr, trim } from "lodash";
import { DefaultizedOverlayPositionerProps, OverlayPositioner } from "../../overlay-positioner";
import { SearchInput, Input, InputSize } from "../../input";
import { IconName } from "../../icon";
import { OverlayTransition } from "../../overlay";
import { Keys, isAlphanumeric } from "../../utils";
import { ItemGroup } from "../item-group";
import * as detectSmallScreen from "../detect-small-screen";
import { PartialBy } from "@lib/common-interfaces";
import { Spinner } from "@root/shared/spinner";
const styles = require("../dropdown.scss");
const cx = classNames.bind(styles);

export interface DropdownItemInjectedProps extends React.RefAttributes<any> {
  onMouseEnter: React.MouseEventHandler<HTMLElement>;
  onMouseLeave: React.MouseEventHandler<HTMLElement>;
}

export interface CommonDropdownProps<T> extends DefaultizedOverlayPositionerProps {
  getValue: (item: T) => string;
  getText: (item: T) => string;
  isItemDisabled?: (item: T) => boolean;
  renderItem: (item: T, props: DropdownItemInjectedProps) => JSX.Element;
  compact?: boolean;
  minListWidth?: number;
  listClassName?: string;
  typeable?: boolean;
  searchable?: boolean;
  onSearch?: (query: string) => void;
  onMatchedItemWhileClosed?: (item: T) => void;
  getInitialFocusedItem?: () => T | undefined;
  header?: JSX.Element;
  spinning?: boolean;
  children?: never;
}

export type DefaultizedCommonDropdownProps<T> = PartialBy<CommonDropdownProps<T>, keyof typeof Dropdown.defaultProps>;

export type UngroupedDropdownPropsFragment<T> = {
  items: T[];
};

export type DropdownGroup<T> = {
  title?: string;
  items: T[];
};

export type GroupedDropdownPropsFragment<T> = {
  renderGroup?: (title: string | undefined, children: React.ReactNode) => JSX.Element;
  groups: DropdownGroup<T>[];
};

export type DropdownProps<T> = CommonDropdownProps<T> & (GroupedDropdownPropsFragment<T> | UngroupedDropdownPropsFragment<T>);

export interface DropdownState<T> {
  visible: boolean;
  query?: string;
  focusedItem?: T;
  shouldScroll?: boolean; // Determines auto scroll on focus
  typed?: string;
  results: number;
  portaled: boolean;
}

function isTextInputElement(element: Element | null) {
  return element && ((element instanceof HTMLInputElement && element["type"] === "text") || element instanceof HTMLTextAreaElement);
}

export class Dropdown<T> extends React.Component<DropdownProps<T>, DropdownState<T>> {
  public static defaultProps = {
    onClose: noop,
    onMatchedItemWhileClosed: noop,
    onSearch: noop,
    compact: false,
    searchable: false,
    typeable: true,
    transitionOut: OverlayTransition.Fade,
    minListWidth: styles.minWidth,
  };

  public state: DropdownState<T> = {
    results: 0,
    visible: false,
    query: "",
    typed: "",
    portaled: false,
  };

  private overlayPositioner = React.createRef<OverlayPositioner>();
  private inputComponent = React.createRef<Input>();
  private scrollContainer = React.createRef<HTMLDivElement>();
  private itemElements = new Map<string, HTMLElement>();
  private saveItemElement = (value: string) => (ref: HTMLElement | React.Component<any> | null) => {
    if (ref) {
      const element = ref instanceof HTMLElement ? ref : (findDOMNode(ref) as HTMLElement);
      this.itemElements.set(value, element);
    } else {
      this.itemElements.delete(value);
    }
  };

  private isGrouped(props: this["props"]): props is CommonDropdownProps<T> & GroupedDropdownPropsFragment<T> {
    return "groups" in props;
  }

  private shouldShowItem = (item: T, query: string = "") => {
    const { getText } = this.props;
    return deburr(getText(item).toLocaleLowerCase()).includes(deburr(query.toLocaleLowerCase()));
  };

  private getFilteredGroups = memoize(
    (props: GroupedDropdownPropsFragment<T>, query: string | undefined) => {
      return props.groups.reduce((groups: DropdownGroup<T>[], group) => {
        const items = group.items.filter((i) => this.shouldShowItem(i, query));
        return items.length ? [...groups, { ...group, items }] : groups;
      }, []);
    },
    { max: 1 }
  );

  private getFlattenedFilteredItems = memoize(
    (props: DropdownProps<T>, query: string | undefined): T[] => {
      if (this.isGrouped(props)) {
        return this.getFilteredGroups(props, query).reduce((items: T[], group) => [...items, ...group.items], []);
      }
      return props.items.filter((i) => this.shouldShowItem(i, query));
    },
    { max: 1 }
  );

  private get isControlled() {
    return this.props.hasOwnProperty("visible");
  }

  private get visible() {
    return this.isControlled ? this.props.visible : this.state.visible;
  }

  private toggleVisible = () => {
    this.state.visible ? this.hide() : this.show();
  };

  private hide = () => {
    if (!this.isControlled) {
      this.setState({ visible: false });
    }
  };

  private show() {
    const { getInitialFocusedItem } = this.props;
    this.setState({
      visible: true,
      query: "",
      typed: "",
      focusedItem: getInitialFocusedItem ? getInitialFocusedItem() : undefined,
    });
  }

  private normalizeText(text: string) {
    return toUpper(deburr(trim(text)));
  }

  private getItemMatchingTypedText() {
    const { typed } = this.state;
    if (typed) {
      const { getText } = this.props;
      return this.getFlattenedFilteredItems(this.props, this.state.query).find((item) =>
        this.normalizeText(getText(item)).startsWith(typed)
      );
    }
  }

  private focusMatchIfExists() {
    const match = this.getItemMatchingTypedText();
    if (match) {
      this.setState({ focusedItem: match });
    }
  }

  private selectMatchIfExists() {
    if (this.props.onMatchedItemWhileClosed) {
      const match = this.getItemMatchingTypedText();
      if (match) {
        this.props.onMatchedItemWhileClosed(match);
      }
    }
  }

  private type(character: string, event: React.KeyboardEvent<HTMLElement>) {
    this.setState({ typed: this.state.typed + character }, () => {
      if (!this.visible) {
        this.selectMatchIfExists();
      } else {
        this.focusMatchIfExists();
      }

      this.clearTypedAfterInactivity();
    });
  }

  private clearTypedAfterInactivity = debounce(() => {
    this.setState({ typed: "" });
  }, 800);

  private get focusedElement(): HTMLElement | undefined {
    const { getValue } = this.props;
    return this.state.focusedItem && this.itemElements.get(getValue(this.state.focusedItem));
  }

  private focusSibling(offset: number) {
    const { isItemDisabled } = this.props;
    const { focusedItem } = this.state;
    const items = this.getFlattenedFilteredItems(this.props, this.state.query);
    const siblingItem = focusedItem && items[items.indexOf(focusedItem) + offset];
    if (siblingItem) {
      if (isItemDisabled && isItemDisabled(siblingItem)) {
        this.focusSibling(offset + Math.sign(offset));
      } else {
        this.setState({ focusedItem: siblingItem });
      }
    }
  }

  private focusNext() {
    if (this.state.focusedItem) {
      this.focusSibling(1);
    } else {
      this.setState({ focusedItem: this.getFlattenedFilteredItems(this.props, this.state.query)[0] });
    }
  }

  private focusPrevious() {
    if (this.state.focusedItem) {
      this.focusSibling(-1);
    } else {
      const items = this.getFlattenedFilteredItems(this.props, this.state.query);
      this.setState({ focusedItem: items[items.length - 1] });
    }
  }

  private onSearch: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const query = event.target.value;
    this.setState({ query });
    this.props.onSearch?.(query);
  };

  private onKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    switch (event.which) {
      case Keys.Space:
        // Trigger might be something you can type into; you should be able to type a space
        if (isTextInputElement(document.activeElement) && event.which === Keys.Space) {
          return;
        }
      case Keys.Enter:
        if (this.visible && this.focusedElement) {
          this.focusedElement.click();
          if (!this.props.sticky) {
            this.hide();
          }
          event.preventDefault();
          event.stopPropagation();
        }
        break;
      case Keys.Tab:
        if (this.visible) {
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
      default:
        if (this.props.typeable && !this.props.searchable && isAlphanumeric(event.which)) {
          event.stopPropagation();
          this.type(String.fromCharCode(event.which), event);
        }
        if (this.props.searchable && this.inputComponent.current) {
          this.inputComponent.current.focus();
        }
    }
  };

  private renderGroup = (title: string | undefined, children: React.ReactNode) => {
    return (
      <ItemGroup key={title} title={title}>
        {children}
      </ItemGroup>
    );
  };

  private renderItems(items: T[]) {
    const { getValue, renderItem, isItemDisabled } = this.props;
    return items.map((item) =>
      renderItem(item, {
        key: getValue(item),
        ref: this.saveItemElement(getValue(item)),
        onMouseEnter: () => {
          if (!isItemDisabled || !isItemDisabled(item)) {
            this.setState({ focusedItem: item, shouldScroll: false });
          }
        },
        onMouseLeave: () => this.setState({ focusedItem: undefined }),
      })
    );
  }

  private handleSmallScreen = debounce((event: MediaQueryList | MediaQueryListEvent) => {
    if (this.state.portaled !== event.matches) {
      this.setState({ portaled: event.matches });
    }
  }, 200);

  private scrollToFocused() {
    const { getValue } = this.props;
    const { focusedItem } = this.state;
    const scrollContainer = this.scrollContainer.current;
    const focusedElement = focusedItem && this.itemElements.get(getValue(focusedItem));
    if (!scrollContainer || !focusedElement || focusedElement.offsetTop == null) {
      return;
    }
    const offsetTop = focusedElement.getBoundingClientRect().top - scrollContainer.getBoundingClientRect().top;

    // Item is below: scroll down
    if (offsetTop + focusedElement.offsetHeight > scrollContainer.offsetHeight) {
      scrollContainer.scrollTop += offsetTop + focusedElement.offsetHeight - scrollContainer.offsetHeight;
      // Item is above: scroll up
    } else if (offsetTop < 0) {
      scrollContainer.scrollTop += offsetTop;
    }
  }

  public UNSAFE_componentWillMount() {
    detectSmallScreen.register(this.handleSmallScreen);
  }

  public UNSAFE_componentWillReceiveProps(nextProps: DropdownProps<T>) {
    if (!this.props.visible && nextProps.visible) {
      this.setState({ typed: "" });
    }
  }

  public componentDidUpdate(prevProps: DropdownProps<T>, prevState: DropdownState<T>) {
    const triggerElement =
      this.overlayPositioner.current &&
      this.overlayPositioner.current.trigger.current &&
      this.overlayPositioner.current.trigger.current.child;
    const { shouldScroll, focusedItem } = this.state;
    const wasVisible = prevState.visible || prevProps.visible;
    // When an open Dropdown is closed, reset its focusedItem and focus trigger
    if (!this.visible && wasVisible) {
      if (focusedItem) {
        this.setState({ focusedItem: undefined });
      }
      if (triggerElement) {
        triggerElement.focus();
      }
    }
    // When a closed Dropdown is first opened, focus its search input (if exists)
    if (this.visible && !wasVisible) {
      if (this.inputComponent.current) {
        // Setting focus leads to scrolling element into view
        // Edge/Chrome needs additional time to calculate scroll position properly right after dropdown was opened
        setTimeout(() => this.inputComponent.current!.focus());
      } else if (triggerElement) {
        triggerElement.focus();
      }
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
      const focusedElement = this.itemElements.get(this.props.getValue(focusedItem));
      if (focusedElement && wasVisible) {
        focusedElement.focus();
      } else if (focusedElement) {
        setTimeout(() => focusedElement.focus());
      }
    } else if (!focusedItem && prevState.focusedItem && triggerElement) {
      setTimeout(() => triggerElement.focus());
    }
  }

  public componentWillUnmount() {
    detectSmallScreen.unregister(this.handleSmallScreen);
    this.handleSmallScreen.cancel();
  }

  render() {
    const { props } = this;
    const {
      getText,
      spinning,
      getValue,
      renderItem,
      compact,
      minListWidth,
      listClassName,
      searchable,
      onSearch,
      header,
      portaled,
      sticky,
      className,
      onMatchedItemWhileClosed,
      typeable,
      items,
      groups,
      getInitialFocusedItem,
      isItemDisabled,
      ...passthrough
    } = { items: undefined, groups: undefined, ...props };
    const { query } = this.state;
    const filteredItems = this.getFlattenedFilteredItems(props, query);
    return (
      <OverlayPositioner
        {...passthrough}
        role="listbox"
        aria-label={t("navigation.dropdownListItems")}
        visible={this.visible}
        aria-expanded={this.visible}
        portaled={portaled}
        onKeyDown={this.onKeyDown}
        onToggleVisible={this.isControlled ? noop : this.toggleVisible}
        onRequestClose={this.hide}
        onInsideClick={sticky ? noop : this.hide}
        className={cx("dropdown", className)}
        overlayClassName={cx(listClassName, "list", { portaled })}
        style={{ minWidth: minListWidth }}
        tabTrap={false}
        ref={this.overlayPositioner}
      >
        {searchable || header ? (
          <div className={styles.headerContainer} onClick={(e) => e.stopPropagation()}>
            {header ? <div className={styles.header}>{header}</div> : null}
            {searchable ? (
              <SearchInput
                resultsCount={filteredItems.length}
                setRef={this.inputComponent}
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
        <div className={styles.scrollable} ref={this.scrollContainer} role="presentation" data-test-class="dropdown-list-items">
          {this.isGrouped(props)
            ? this.getFilteredGroups(props, query).map((group) =>
                (props.renderGroup || this.renderGroup)(group.title, this.renderItems(group.items))
              )
            : this.renderItems(filteredItems)}
          {spinning ? <Spinner /> : null}
        </div>
      </OverlayPositioner>
    );
  }
}
