import { IObservableArray } from "mobx";

export enum ListVirtualization {
  Never,
  Auto,
  Always,
}

export type ListItemInjectedProps = { style: React.CSSProperties };
export type ListContainerInjectedProps = {
  children: JSX.Element | JSX.Element[];
  role?: React.HTMLAttributes<HTMLElement>["role"];
};

export interface ReactVirtualizedList {
  /**
   * Forceful re-render the inner Grid component.
   * Calling forceUpdate on List may not re-render the inner Grid since it uses shallowCompare as a performance optimization. Use this method if you want to manually trigger a re-render. This may be appropriate if the underlying row data has changed but the row sizes themselves have not.
   */
  forceUpdateGrid(): void;

  /**
   * Pre-measure all rows in a List.
   * Typically rows are only measured as needed and estimated heights are used for cells that have not yet been measured. This method ensures that the next call to getTotalSize() returns an exact size (as opposed to just an estimated one).
   */
  measureAllRows(): void;

  /**
   * Recompute row heights and offsets after the specified index (defaults to 0).
   * List has no way of knowing when its underlying list data has changed since it only receives a rowHeight property. If the rowHeight is a number it can compare before and after values but if it is a function that comparison is error prone. In the event that a dynamic rowHeight function is in use and the row heights have changed this function should be manually called by the "smart" container parent.
   * This method will also force a render cycle (via forceUpdate) to ensure that the updated measurements are reflected in the rendered list.
   */
  recomputeRowHeights(index?: number): void;
}

export interface ReactVirtualizedWindowScroller {
  /**
   * Recalculates scroll position from the top of page.
   * This method is automatically triggered when the component mounts as well as when the browser resizes. It should be manually called if the page header (eg any items in the DOM "above" the `WindowScroller`) resizes or changes.
   */
  updatePosition(): void;

  forceUpdate(): void;
}

export interface ItemInfo {
  index: number;
  isScrolling?: boolean;
  isVisible?: boolean;
}

export interface NavigationListItemInfo extends ItemInfo {
  isNarrow: boolean;
}

export interface ListProps<T> {
  /**
   * Renders List’s root element.
   * @param props Props that should be spread over the returned element. Props include `children` as the list items to be rendered, so overriding `children` or failing to pass them to the returned element will result in no list items being rendered.
   * @example <List renderContainer={props => <Card {...props} />} />
   */
  renderContainer?: (props: ListContainerInjectedProps) => JSX.Element;
  /** Mounts and unmounts items on-demand when they enter and leave the viewport. */
  virtualize?: ListVirtualization;
  /** When `virtualize` is set to `ListVirtualization.Auto`, sets the upper limit of items that can be rendered before switching to virtualized rendering. */
  virtualizationThreshold?: number;
  /** The data that represent each item in the List. The array will be mapped over and each entry will be passed to `renderItem`. */
  items: T[] | IObservableArray<T>;
  /**
   * Called for each entry of `items` to determine how a row should render that entry.
   * @param item The entry from `items`.
   * @param props A collection of props calculated by List that must be passed to the item element, used for positioning.
   * @param info Contains the index of the entry in `items`. When `virtualized` is true, also contains additional information about the scrolling and visibility of the row.
   */
  renderItem: (item: T, props: ListItemInjectedProps & React.Attributes, info: ItemInfo) => JSX.Element;

  /** An estimate of how the size of `items` after all data has been fetched from the server. A number in excess of `data.length` will result in placeholder items being rendered. */
  eventualItemCount?: number;
  /**
   * Called for each placeholder item to determine how to display skeleton UI for a item whose data has not yet been fetched. Defaults to a pulsing gray block in each cell.
   * @param props A collection of props calculated by Table that must be passed to the item element, used for positioning during virtualized scrolling.
   * @param index The index of the placeholder item being rendered, relative to the 0th placeholder item.
   */
  renderPlaceholderItem?: (props: ListItemInjectedProps & React.Attributes, info: ItemInfo) => JSX.Element | null;

  /** Identifies the current projection of `data` so that List can avoid calling `loadMoreItems` on duplicate or overlapping ranges of the data. Only needed for infinite scrolling. */
  queryId?: any;
  /** When `virtualized` is true and rows must be dynamically sized, determines the height (in pixels) to render the row. */
  getItemHeight?: (info: { index: number }) => number;
  estimatedItemHeight?: number;
  overscanItemCount?: number;
  /** A reference to the ancestor Element that scrolls through List’s content. Since scrolling has special behavior because of virtualization, List needs to know what element it is contained in that is doing the scrolling. If the whole document scrolls as normal, you can just pass `window`. If List is contained in another `overflow: auto` scrolling container, you need to capture a ref of that somehow and pass it in. */
  scrollElement?: Element | Window;
  /**
   * Called when more items beyond what is present in `data` are about to scroll into view. `startIndex` and
   * `stopIndex` will be quantized to an interval of a multiple of `minimumBatchSize`, and `startIndex` will
   * only ever be a multiple of `minimumBatchSize`. Return a Promise which resolves (to anything or nothing)
   * once the items have been loaded. (This is a wrapper on top of react-virtualized InfiniteLoader’s
   * `loadMoreItems` prop, but with a slightly different signature and additional logic to filter and quantize
   * the indices to avoid many overlapping queries.) */
  loadMoreItems?(startIndex: number, stopIndex: number): Promise<void | any>;
  /** Passed through to react-virtualized InfiniteLoader.  */
  minimumBatchSize?: number;
  /** Passed through to react-virtualized InfiniteLoader. A threshold X means that data will start loading when a user scrolls within X items. */
  fetchThreshold?: number;
  /** The ARIA role to use on the container. Overrides react-virtualized’s default role for its List container. */
  role?: string;

  styles?: { [key: string]: string };
}
