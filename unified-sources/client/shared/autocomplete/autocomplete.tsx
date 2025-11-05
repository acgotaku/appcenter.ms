import * as React from "react";
import * as classNames from "classnames";
import * as PropTypes from "prop-types";
import * as memoize from "memoizee";
import * as Fuse from "fuse.js";
import { PropTypes as MobxPropTypes } from "mobx-react";
import { chain, identity, curry, get as _get, debounce } from "lodash";
import { Menu, MenuProps, Action } from "../menu";
import { Trigger, TriggerProps } from "../trigger/trigger";
import { Keys } from "../utils/keys";
import { ScreenReaderSearchResult } from "../input/screen-reader-search-result";
import { LiveRegion } from "..";
const css = require("./autocomplete.scss");
const getFrom = curry(_get, 2);
const cache = <F extends Function>(fn: F): F => memoize(fn, { max: 1 });
const { cloneElement } = React;

const searchOptions: Fuse.FuseOptions<never> = {
  shouldSort: true,
  threshold: 0.2,
};

export interface AutocompleteProps<T> extends MenuProps {
  /** The value to filter items by. */
  value: string;
  /** The total set of possible autocompletion results, which will be filtered and sorted based on `value`. */
  items: T[];
  /** The total autocompletion results to be shown. If filtered results exceed this limit, the results will be concatenated. */
  itemLimit?: number;
  /** The initialization options to pass to the fuzzy search algorithm. (The `id` option is not supported.) See http://fusejs.io for documentation. */
  searchOptions?: Fuse.FuseOptions<T> & { id?: void }; // Specifying an `id` would change the type returned by `fuse.search()`, which would break typings for `renderItem`.
  /** Whether to show results immediately on first focus. If set, results will be shown on first focus even if the `value` is empty. */
  openOnFocus?: boolean;
  /** Whether to show results on an empty value. This value is ignored if `openOnFocus` is set & the user focuses on the element for the first time (or after blur). */
  showMatchesOnEmpty?: boolean;
  /** A custom renderer for each autocompletion result displayed in the list. Optional if `items` is an array of strings. */
  renderItem?(item: T, index: number, array: T[]): React.ReactElement<any>;
  /** Called when an autocomplete item is clicked/selected. Return `false` to indicate that the completion has been rejected so that the menu will remain open. */
  onSelectItem(item: T, event?: React.MouseEvent<HTMLElement>): false | void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement> & { currentTarget: HTMLInputElement }) => void;
  children: TriggerProps["children"];
}

export interface AutocompleteState {
  isFocused: boolean;
  isEscaped: boolean;
  focusedItemLabel?: string;
}

/**
 * Autocomplete takes a list of possible completions and a value to filter them by and renders a Menu with the suggested results.
 * It’s intended to be used in conjunction with some kind of text input, but rendering that input is up to you—
 * Autocomplete can be attached to anything.
 */
export class Autocomplete<T extends {}> extends React.PureComponent<AutocompleteProps<T>, AutocompleteState> {
  public static propTypes = {
    value: PropTypes.string.isRequired,
    items: MobxPropTypes.arrayOrObservableArray, // Let’s appease usage with QueryBuilder, where these might get transformed.
    searchOptions: PropTypes.object,
    openOnFocus: PropTypes.bool,
    showMatchesOnEmpty: PropTypes.bool,
    renderItem: PropTypes.func,
    onSelectItem: PropTypes.func.isRequired,
  };

  public static defaultProps = { searchOptions };
  public state: AutocompleteState = { isFocused: false, isEscaped: false, focusedItemLabel: undefined };
  private focusTime?: number;

  // Cache the Fuse instance for the life of the `items` (and options).
  private fuse = cache((items: T[], options: Fuse.FuseOptions<T>) => new Fuse(items, options));
  /** Track whether changes to the input have been made while the input has been focused */
  private hasChanges = false;
  /** True between clicking a Menu item and closing the Menu */
  private completing = false;
  /** True between Menu opening and making any changes have to the Input */
  private firstFocus = false;
  /** True for an event loop between when a blur event is first fired and when the Menu actually closes (which gives time to keep the Menu open long enough to process a click on an item) */
  private blurring = false;
  private blurTimer?: NodeJS.Timer;

  private setFocused = (event: React.FocusEvent<HTMLElement>) => {
    if (window["%hammerhead%"]) {
      this.focusTime = Date.now();
    }

    // Happens when the Trigger is focused.
    // if firstFocus and blurring are true at the same time, it means the focus was lost abruptly (undesired behavior)
    // isFocused true means autocomplete is visible if openOnFocus is passed
    // isEscaped false means a previous escape is discarded and openOnFocus can be used again
    if (this.firstFocus && this.blurring) {
      this.blurring = false;
      this.firstFocus = false;
    }
    this.setState({ isFocused: true, isEscaped: false });
  };

  private setBlurred = (event?: React.FocusEvent<HTMLElement>, force?: boolean) => {
    // TestCafe refuses to leave this stupid thing focused, this is awful
    if (window["%hammerhead%"] && this.focusTime && Date.now() - this.focusTime < 100 && event) {
      event.preventDefault();
      event.stopPropagation();
      event.target.focus();
      return;
    }

    // Happens when the Trigger is blurred.
    // if firstFocus and blurring aren't false at the same time, it means the blur
    // happened correctly (autocomplete still clickable)
    if (!this.firstFocus || !this.blurring || force) {
      this.blurring = true;
      this.blurTimer = setTimeout(() => {
        this.setState({ isFocused: false, isEscaped: false });
        this.blurring = false;
        this.firstFocus = false;
      }, 0);
    }
  };

  private onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const { onKeyDown } = this.props;
    if (onKeyDown) {
      onKeyDown(event);
    }
    if (event.which === Keys.Escape) {
      this.setState({ isEscaped: true });
      event.preventDefault();
      event.stopPropagation();
    }
  };

  // Don’t close the menu if you’re clicking an item in it.
  private onMouseDown = () => {
    setTimeout(() => {
      if (this.blurring) {
        clearTimeout(this.blurTimer!);
      }
    }, 0);
  };

  // If you were about to close the menu but you started clicking an item,
  // close the menu once you’re done clicking it.
  private onMouseUp = () => {
    if (this.blurring) {
      this.setBlurred(undefined, true);
    }
  };

  private attachHandler = ([item, element]: [T, React.ReactElement<any>]) => {
    return cloneElement(element, {
      onClick: (e: React.MouseEvent<HTMLElement>) => {
        if (this.props.onSelectItem(item) !== false) {
          this.completing = true;
        }
      },
      // exception to prevent an issue with list items not working properly
      dontSetTabIndex: true,
    });
  };

  private showOnFocus = (props: AutocompleteProps<T>) => {
    return props.openOnFocus && this.firstFocus;
  };

  private setFocusedItemLabel = debounce((focusedItem: HTMLElement | undefined) => {
    this.setState({
      focusedItemLabel: focusedItem ? focusedItem.getAttribute("aria-label") ?? focusedItem.innerText : undefined,
    });
  }, 400);

  private shouldShow(props: AutocompleteProps<T>) {
    // Evaluate from easiest to hardest: search is never evaluated unless it has to.
    return Boolean(
      this.state.isFocused && !this.state.isEscaped && (this.hasChanges || this.showOnFocus(props)) && this.getItems(props).length
    );
  }

  // This isn’t a defaultProp because it relies on `T`,
  // even though `T` isn’t super useful to us here. But
  // it’s more future-proof in case the default render
  // ever wants to inspect `this.props` or something.
  private defaultRenderItem(item: T) {
    if (typeof item === "string") {
      return <Action key={item} text={item} />;
    }

    throw new Error(
      "Item was not a string or number and no `renderItem` prop was provided. " +
        "Complex item types must be accompanied by a function that takes an item " +
        "and returns a React element to render."
    );
  }

  private getItems = (props: AutocompleteProps<T>) => {
    const { items, value, showMatchesOnEmpty } = props;
    const shouldShowAllItems = !value && (showMatchesOnEmpty || this.showOnFocus(props));
    return shouldShowAllItems ? this.getDefaultItems(items) : this.getMatchingItems(props);
  };

  // Cache the default items set
  private getDefaultItems = cache((items: T[]) => {
    return this.itemsAreStrings() ? items.map((_, i) => i) : items;
  });

  // Cache the result set between `shouldShow` and `render`
  private getMatchingItems = cache((props: AutocompleteProps<T>) => {
    const { items, value, searchOptions } = props;
    return this.fuse(items, searchOptions!).search<T>(value);
  });

  // We need a way to know if items are strings or not because fuse returns an array of indices
  // when the items are primitives.
  private itemsAreStrings = () => this.props.items.length > 0 && typeof this.props.items[0] === "string";

  public UNSAFE_componentWillReceiveProps(nextProps: AutocompleteProps<T>) {
    if (this.completing) {
      this.setState({ isEscaped: true });
      this.completing = false;
    } else if (nextProps.value !== this.props.value) {
      this.setState({ isEscaped: false });
    }
  }

  public UNSAFE_componentWillUpdate(nextProps: AutocompleteProps<T>, nextState: AutocompleteState) {
    if (!this.state.isFocused && nextState.isFocused) {
      // New focus session: reset `hasChanges`
      this.hasChanges = false;
      this.firstFocus = true;
    } else if (nextProps.value !== this.props.value && nextState.isFocused) {
      // Maintained focus and value changed
      this.hasChanges = true;
      this.firstFocus = false;
    } else if (this.firstFocus && !nextState.isFocused) {
      // FocusOut happened
      this.firstFocus = false;
    }
  }

  public componentWillUnmount() {
    clearTimeout(this.blurTimer!);
  }

  public render() {
    const { children, listClassName } = this.props;
    const {
      value,
      items,
      itemLimit,
      searchOptions,
      openOnFocus,
      showMatchesOnEmpty,
      renderItem = this.defaultRenderItem,
      onSelectItem,
      ...passthrough
    } = this.props;
    const { isFocused, focusedItemLabel } = this.state;
    const visible = this.shouldShow(this.props);
    const cn = [css.autocomplete, listClassName].join(" ");
    const processedItems = chain(this.getItems(this.props))
      // When the items are primitives, fuse returns an array of indices,
      // so in that case we map over `get(items)` to transform them back.
      .map<T | number>(this.itemsAreStrings() ? getFrom(items) : identity)
      .map((item: T, i, arr: T[]) => [item, renderItem(item, i, Array.from(arr))])
      .map(this.attachHandler)
      .value();

    let limittedItems = processedItems;
    if (itemLimit !== null && itemLimit !== undefined && limittedItems.length > itemLimit) {
      limittedItems = limittedItems.slice(0, itemLimit);
    }
    return (
      <>
        <Menu
          compact
          visible={visible}
          portaled
          {...passthrough}
          listClassName={cn}
          onMouseDown={this.onMouseDown}
          onMouseUp={this.onMouseUp}
          onFocusItem={(item) => this.setFocusedItemLabel(item)}
          typeable={false}
        >
          <Trigger disabled onFocus={this.setFocused} onBlur={this.setBlurred} onKeyDown={this.onKeyDown} className={css.input}>
            {children}
          </Trigger>
          {visible ? limittedItems : null}
        </Menu>
        <ScreenReaderSearchResult resultsCount={limittedItems.length} active={isFocused} />
        <LiveRegion active={!!focusedItemLabel} role="alert" className={css.srText}>
          {focusedItemLabel}
        </LiveRegion>
      </>
    );
  }
}

export class AutocompleteComboboxWrapper extends React.Component<React.InputHTMLAttributes<HTMLInputElement>> {
  render() {
    const {
      "aria-expanded": expanded,
      "aria-owns": owns,
      className,
      "aria-hidden": hidden, //removed this prop because of Edge Chromiun aria-live bug (LiveRegion doesn't announce item when more than one letter is in Input).
      ...passthrough
    } = this.props;
    const child = React.Children.only(this.props.children);
    const clonedInput = cloneElement(
      child,
      {
        "aria-autocomplete": "list",
        ...passthrough,
      },
      child.props.children
    );
    const cx = classNames(css.autocompleteInputWrapper, className);
    return (
      <div role="combobox" aria-expanded={expanded} aria-owns={owns} className={cx}>
        {clonedInput}
      </div>
    );
  }
}
