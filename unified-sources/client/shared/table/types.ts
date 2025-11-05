import { NavigationListProps, NavigationListItemProps, NavigationListItemInfo } from "../list";
import { CardProps } from "../card";
import { IconName } from "../icon";

export interface TooltipOptions {
  title: string;
  text?: string;
  iconName?: IconName;
}

export interface Column {
  title: string;
  width: number | string;
  sortable?: boolean;
  visible?: boolean;
  align?: "left" | "center" | "right";
  defaultSortDescending?: boolean;
  className?: string;
  ariaLabel?: string;
  ariaColindex?: string;
  tooltip?: TooltipOptions;
}

export interface RowContext {
  to?: string;
  href?: string;
}

export interface InjectedRowProps extends NavigationListItemProps, React.Attributes {
  index: number;
  narrow: boolean;
  label?: string;
  style: React.CSSProperties;
  selected: boolean;
  selectable: boolean;
  selectionDisabled: boolean;
  active: boolean;
  isScrolling?: boolean;
  onSelect(): void;
  onDeselect(): void;
  tableId: string;
  placeholder?: boolean;
  actions?: JSX.Element[];
  isList: boolean;
  rowHeight: RowHeight;
  tableWithoutHeader?: boolean;
}

export interface SortOptions {
  column?: number;
  descending?: boolean;
}

export interface TableState<T> {
  selectedRows: Set<T>;
  sortBy?: SortOptions;
}

export interface TableContext {
  rowHeight: RowHeight;
}

export enum RowHeight {
  /** Single-line rows, tightly packed */
  Compact = "Compact",
  /** Single-line rows with relaxed padding */
  SingleLine = "SingleLine",
  /** Multi-line rows */
  MultiLine = "MultiLine",
}

export interface TableProps<T> extends CardProps {
  // HEADER

  /** The title to display at the top-left of the Table. For more flexibility, use `header` instead. */
  title?: string;
  /** Sets aria-hidden attribute for the table title */
  titleAriaHidden?: boolean;
  /** The filters or actions to display at the top-right of the Table. Disappears during row selection in favor of `renderSelectionToolbar`. Using the lower-level `header` prop overrides this prop. */
  toolbar?: JSX.Element;
  /** Without header and column headers */
  withoutHeader?: boolean;

  // BASIC RENDERING

  /** Information about the title, layout, and behavior of each column. */
  columns: Column[];
  /** The data objects that represent each row in the Table. The array will be mapped over and each entry will be passed to `renderRow`. */
  data: NavigationListProps<T>["items"];
  /**
   * Called for each entry of `data` to determine how a row should render that entry.
   * @param item The entry from `data`.
   * @param props A collection of props calculated by Table that must be passed to Row, used for positioning and communicating state and actions between the components.
   * @param info Contains the index of the entry in `data`. When `virtualized` is true, also contains additional information about the scrolling and visibility of the row.
   */
  renderRow(item: T, props: InjectedRowProps, info: NavigationListItemInfo): JSX.Element | null;
  /** A preset controlling the height of each row. */
  rowHeight?: RowHeight;
  /** The number of actions for which Table will reserve space at the end of each row, as determined by the size of a standard ClickableIcon. */
  rowActionsCount?: number;
  /** If `rowActionsCount` is provided, called for each entry of `data` to render the triggers for whatever actions the row supports. Should return an array no longer than `rowActionsCount`, and each element should display as a ClickableIcon per the design specification. Do not wrap the elements in a Cell. */
  renderRowActions?(item: T): JSX.Element[];

  // ALTERNATE STATES

  /** The row that will be highlighted in Secondary Panels to indicate that it represents the current Primary Panel. */
  activeRow?: NavigationListProps<T>["activeItem"];
  /** An element to be displayed instead of any rows in the case that the row data could not be fetched. Do not use this simply to indicate that the data set is empty. */
  error?: React.ReactNode;
  /** An estimate of how the size of `data` after all data has been fetched from the server. A number in excess of `data.length` will result in placeholder rows being rendered. */
  eventualRowCount?: NavigationListProps<T>["eventualItemCount"];
  /**
   * Called for each placeholder row to determine how to display skeleton UI for a row whose data has not yet been fetched. Defaults to a pulsing gray block in each cell.
   * @param props A collection of props calculated by Table that must be passed to Row, used for positioning during virtualized scrolling.
   */
  renderPlaceholderRow?(props: InjectedRowProps & React.Attributes, info: NavigationListItemInfo): JSX.Element;

  // SELECTION

  /** When `virtualized` is true and rows must be dynamically sized, determines the height (in pixels) to render the row. */
  getRowHeight?: NavigationListProps<T>["getItemHeight"];
  /** Renders checkboxes at the beginning of each row. */
  selectable?: boolean;
  /** The entries from `data` whose rows are selected. Including this prop makes row selection _controlled_, so `onSelect` and `onDeselect` must be passed to each Row and `onDeselectAll` and `onSelectAll` must handled in order to react to changes. */
  selectedRows?: Set<T>;
  /** When `selectedRows` is not provided (i.e., row selection is _uncontrolled_), sets the initial state of which rows are selected upon first render. */
  defaultSelectedRows?: Set<T>;
  /** For a given entry from `data`, decides whether the row’s checkbox should be disabled. Omitting this prop assumes that every checkbox should be enabled. */
  isRowSelectionDisabled?: (item: T) => boolean;
  /** Called when the header checkbox is clicked with the intent to select all rows. */
  onSelectAll?(): void;
  /** Called when the header checkbox is clicked with the intent to deselect all rows. */
  onDeselectAll?(): void;
  /**
   * Replaces `toolbar` when rows are selected. Not compatible with the lower-level `header` prop.
   * @param selectedRows The set of items from `data` whose rows are selected.
   */
  renderSelectionToolbar?(selectedRows: Set<T>): JSX.Element;
  /**
   * Returns the translated string in the correct plural form to be rendered in the header when
   * rows are selected, e.g. “28 users selected.” Translation entries must provide a plural form.
   * @param selectedRowCount The number of currently selected rows.
   * @example selectedItemsString={count => t('crashes:groups.table.header.groupsSelected', { count })}
   */
  selectedItemsString?: (selectedRowCount: number) => string;
  /** The `aria-label` of the select-all / deselect-all checkbox in the header. */
  headerCheckboxAriaLabel?: string;

  // SORTING

  /** Which column, if any, is marked as the current sort order, and in which direction. Use `null` to indicate that no sort order is set. Including this prop makes sorting indication _controlled_, so `onClickColumnHeader` must be handled in order to react to changes. Note that Table does _not_ sort `data`; it simply displays UI indicating that the rows are sorted. */
  sortBy?: SortOptions | null;
  /** When `sortBy` is not provided (i.e., sorting indication is _uncontrolled_), sets the initial state of which column is marked as the current sort order, and in which direction, upon first render. */
  defaultSortBy?: SortOptions;
  /**
   * Indicates that the Table is sortable. Called when a column header is clicked with the intent to change the sort order.
   * @param sortBy The new SortOptions that _will_ be applied if sorting indication is _uncontrolled_, and that _should_ be applied (i.e. passed to `sortBy` if sorting indication is _controlled_).
   * @param event
   */
  onClickColumnHeader?(sortBy?: SortOptions, event?: Event): void;

  // VIRTUALIZATION

  /** Mounts and unmounts rows on-demand when they enter and leave the viewport. Defaults to true for Tables with 150 rows or more; false otherwise. */
  virtualize?: NavigationListProps<T>["virtualize"];
  /** When `virtualize` is set to `ListVirtualization.Auto`, sets the upper limit of items that can be rendered before switching to virtualized rendering. */
  virtualizationThreshold?: NavigationListProps<T>["virtualizationThreshold"];
  /** Identifies the current projection of `data` so that Table can avoid calling `loadMoreRows` on duplicate or overlapping ranges of the data. Only needed for infinite scrolling. */
  queryId?: any;
  estimatedRowHeight?: NavigationListProps<T>["estimatedItemHeight"];
  overscanRowCount?: NavigationListProps<T>["overscanItemCount"];
  /** A reference to the ancestor Element that scrolls through Table’s content. Since scrolling has special behavior because of virtualization, Table needs to know what element it is contained in that is doing the scrolling. If the whole document scrolls as normal, you can just pass `window`. If Table is contained in another `overflow: auto` scrolling container, you need to capture a ref of that somehow and pass it in. */
  scrollElement?: NavigationListProps<T>["scrollElement"];
  /**
   * Called when more rows beyond what is present in `data` are about to scroll into view. `startIndex` and
   * `stopIndex` will be quantized to an interval of a multiple of `minimumBatchSize`, and `startIndex` will
   * only ever be a multiple of `minimumBatchSize`. Return a Promise which resolves (to anything or nothing)
   * once the rows have been loaded. (This is a wrapper on top of react-virtualized InfiniteLoader’s
   * `loadMoreRows` prop, but with a slightly different signature and additional logic to filter and quantize
   * the indices to avoid many overlapping queries.)
   */
  loadMoreRows?(startIndex: number, stopIndex: number): Promise<void | any>;
  minimumBatchSize?: NavigationListProps<T>["minimumBatchSize"];
  fetchThreshold?: NavigationListProps<T>["fetchThreshold"];

  styles?: { [key: string]: string };

  /**  Sometimes the ArrowKeyFocuser used within the NavigationList component rendered in Table causes accessibility issues.
  You can use this prop to not use it if that is the case. */
  disableArrowKeyFocuser?: boolean;

  isList?: boolean; // Whether this is a proper table in the form of a grid, or just a list. In case of list,
  // we set the element's role to "list" and don't use the "aria-rowcount" attribute as it is not allowed for lists
}
