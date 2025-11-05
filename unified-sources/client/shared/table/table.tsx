import * as React from "react";
import * as PropTypes from "prop-types";
import * as memoize from "memoizee";
import * as classNames from "classnames";
import { isObservableArray, reaction } from "mobx";
import { observer, PropTypes as MobxPropTypes } from "mobx-react";
import { uniqueId, noop } from "lodash";
import { getPreviousFocusable, getFirstFocusable, mergeRefs } from "../utils";
import { UnstyledButton } from "../unstyled-button";
import { HeaderArea } from "../header-area";
import { Checkbox } from "../checkbox";
import { Icon, IconName, IconSize } from "../icon";
import { getFixedWidthColumns, verifyColumns, cellWidth, rowHeights } from "./utils";
import { Row } from "./row";
import { Cell } from "./cell";
import { TextCell } from "./text-cell";
import { Column, InjectedRowProps, SortOptions, TableState, RowHeight, TableProps, TooltipOptions } from "./types";
import { Card } from "../card";
import { PanelPosition } from "../panels/with-panel-position";
import { NavigationList, NavigationListItemInfo, NavigationListItemProps, NavigationListProps } from "../list";
import { layoutStore } from "@root/stores";
import { ArrowKeyFocuser } from "@root/shared/hooks/use-arrow-key-focus";
import { IconTooltip } from "../tooltip";

const css = require("./table.scss");
const rowStyles = require("./row.scss");
const cellStyles = require("./cell.scss");

type StaticPlaceholderRowProps = Pick<
  InjectedRowProps,
  "style" | "narrow" | "active" | Exclude<keyof InjectedRowProps, keyof NavigationListItemProps | keyof NavigationListItemInfo>
>;

type DefaultProps<T> = {
  rowHeight: RowHeight;
  selectable: boolean;
  onClickColumnHeader(sortBy?: SortOptions, event?: Event): void;
  onSelectAll(): void;
  onDeselectAll(): void;
  loadMoreRows(startIndex: number, stopIndex: number): Promise<void | any>;
  renderSelectionToolbar(selectedRows: Set<T>): JSX.Element;
  minimumBatchSize: number;
  styles: { [key: string]: string };
  titleAriaHidden: boolean;
};

type TablePropsWithDefaultProps<T> = TableProps<T> & DefaultProps<T>;

const defaultRenderPlaceholderRows = (
  visibleColumns: Column[],
  staticProps: StaticPlaceholderRowProps,
  props: NavigationListItemProps,
  info: NavigationListItemInfo
) => {
  return (
    <Row {...staticProps} {...props} index={info.index} isScrolling={info.isScrolling} onKeyDown={noop}>
      {visibleColumns.map((_, i) => (
        <TextCell key={i} skeleton>
          &nbsp;
        </TextCell>
      ))}
    </Row>
  );
};

class HeaderRow extends React.Component<React.HTMLAttributes<HTMLElement> & { elementRef: React.Ref<HTMLDivElement> }> {
  public static displayName = "HeaderRow";
  public render() {
    const { elementRef, ...props } = this.props;
    return (
      <ArrowKeyFocuser orientation="horizontal">
        {(arrowKeyFocusProps) => (
          <div
            data-table-header-row
            data-test-id="table-header"
            {...props}
            {...arrowKeyFocusProps}
            ref={mergeRefs(elementRef, arrowKeyFocusProps.ref)}
          />
        )}
      </ArrowKeyFocuser>
    );
  }
}

export class Table<T> extends React.Component<TableProps<T>, TableState<T>> {
  public static propTypes = {
    data: (props: TableProps<any>, key: string, componentName: string, ...rest: [any, any]) => {
      if (isObservableArray(props.data)) {
        return new Error(
          "Received an observable array for prop `data` in component `Table`. " + "Please use `Table.Observer` instead of `Table`."
        );
      }

      return PropTypes.array.isRequired(props, key, componentName, ...rest);
    },
  };

  public static defaultProps = {
    rowHeight: RowHeight.SingleLine,
    selectable: false,
    onClickColumnHeader: noop,
    onSelectAll: noop,
    onDeselectAll: noop,
    loadMoreRows: () => Promise.resolve(),
    renderSelectionToolbar: () => null,
    minimumBatchSize: 50,
    styles: css,
    titleAriaHidden: true,
  };

  public static contextTypes: React.ValidationMap<any> = {
    panelPosition: PropTypes.number,
  };

  public static childContextTypes = {
    rowHeight: PropTypes.string,
  };

  public static NavigationList = NavigationList;
  public static Observer = observer(
    class extends Table<any> {
      public static NavigationList = NavigationList.Observer;
      public static displayName = "Table.Observer";
      public static propTypes = { ...Table.propTypes, data: PropTypes.oneOfType([PropTypes.array, MobxPropTypes.observableArray]) };
    }
  );

  public context!: { panelPosition: PanelPosition };
  public props!: TableProps<T>;
  public state: TableState<T> = {
    selectedRows: this.props.defaultSelectedRows || new Set<T>([]),
    sortBy: this.props.defaultSortBy || undefined,
  };

  private headerRow = React.createRef<HTMLDivElement>();
  private focusContainer = React.createRef<HTMLDivElement>();
  private navigationList = React.createRef<NavigationList<T>>();
  private styleElement?: HTMLStyleElement;
  private stylesheet?: CSSStyleSheet;
  private id = uniqueId("table-");

  private elementIsFirstFocusableInRow = (element: Element) => {
    const rowParent = element.closest("[data-table-row]");
    if (rowParent) {
      return getFirstFocusable(rowParent) === element;
    }
  };

  private disposeLayoutReaction = reaction(
    () => layoutStore.isMobile,
    () => {
      this.forceUpdate();
    }
  );

  private elementIsFocusTarget = (element: Element) => {
    // Use `activeRow` as a proxy for “I have focusable rows” (not a perfect assumption but pretty good).
    // We need to do this because NavigationList is wrapped in ArrowKeyFocuser, and if the rows aren’t focusable,
    // there would be no way to focus interactive stuff inside them, so we focus the first thing inside instead
    // of trying to focus the row itself.
    if (!("activeRow" in this.props)) {
      return (
        element.hasAttribute("data-navigation-list-item") ||
        this.elementIsFirstFocusableInRow(element) ||
        (!!this.headerRow.current &&
          this.headerRow.current.contains(element) &&
          !getPreviousFocusable(element, this.headerRow.current))
      );
    }

    // Element is a row, or
    return (
      element.hasAttribute("data-navigation-list-item") ||
      // element is first focusable element in header row
      (!!this.headerRow.current && this.headerRow.current.contains(element) && !getPreviousFocusable(element, this.headerRow.current))
    );
  };

  private shouldRenderNarrow() {
    return this.context.panelPosition && this.context.panelPosition !== PanelPosition.Primary;
  }

  private getRowHeight = ({ index }: { index: number }) => {
    return this.props.getRowHeight ? this.props.getRowHeight({ index: index - 1 }) : rowHeights[this.props.rowHeight!];
  };

  private get isSelectControlled() {
    return this.props.hasOwnProperty("selectedRows");
  }

  get selectedRows(): Set<T> | undefined {
    const source = this.isSelectControlled ? this.props : this.state;
    return source.selectedRows;
  }

  private get isSortControlled() {
    return this.props.hasOwnProperty("sortBy");
  }

  private get sortBy(): SortOptions {
    const { sortBy } = this.isSortControlled ? this.props : this.state;
    return { ...(sortBy || { column: undefined }), descending: (sortBy && sortBy.descending) || false };
  }

  private get header() {
    const { header, toolbar, title, selectedItemsString, renderSelectionToolbar, styles, withoutHeader, titleAriaHidden } = this
      .props as TablePropsWithDefaultProps<T>;
    const hasSelectedRows = this.selectedRows && this.selectedRows.size > 0;

    if (withoutHeader && !hasSelectedRows) {
      return null;
    }

    if (header) {
      return typeof header === "object" && "type" in header ? React.cloneElement(header, { className: styles.headerArea }) : header;
    }

    return (
      <HeaderArea
        className={styles.headerArea}
        title={hasSelectedRows ? (selectedItemsString ? selectedItemsString(this.selectedRows!.size) : "") : title || ""}
        renderTitle={(Title, computedTitle) => (
          <>
            {hasSelectedRows ? (
              selectedItemsString ? (
                <Title className={styles.selectedRowsTitle}>{computedTitle}</Title>
              ) : null
            ) : (
              <Title aria-hidden={titleAriaHidden}>{computedTitle}</Title>
            )}
          </>
        )}
      >
        {hasSelectedRows ? renderSelectionToolbar(this.selectedRows!) : toolbar}
      </HeaderArea>
    );
  }

  private get isList() {
    return this.props.isList || layoutStore.isMobile;
  }

  private get visibleColumns() {
    return this.props.columns.filter((c) => c.visible !== false);
  }

  private get shouldNotRenderColumnHeaders() {
    const { withoutHeader, selectable, rowActionsCount } = this.props;
    return withoutHeader && !selectable && !rowActionsCount;
  }

  get renderPlaceholderRow(): NavigationListProps<T>["renderPlaceholderItem"] {
    const { renderPlaceholderRow } = this.props;
    return renderPlaceholderRow
      ? (props, info) =>
          renderPlaceholderRow(
            { ...this.makePlaceholderRowProps(props, info), ...props, index: info.index, isScrolling: info.isScrolling },
            info
          )
      : (props, info) => defaultRenderPlaceholderRows(this.visibleColumns, this.makePlaceholderRowProps(props, info), props, info);
  }

  private onCheckboxChange(headerCheckboxIsChecked = this.getHeaderCheckboxState()) {
    if (headerCheckboxIsChecked) {
      this.onDeselectAll();
    } else {
      this.onSelectAll();
    }
  }

  private onSelectRow = memoize((item: T) => () => {
    if (!this.isSelectControlled && !this.isSelectDisabled(item)) {
      const selectedRows = new Set(this.state.selectedRows);
      selectedRows.add(item);
      this.setState({ selectedRows });
    }
  });

  private onDeselectRow = memoize((item: T) => () => {
    if (!this.isSelectControlled && !this.isSelectDisabled(item)) {
      const selectedRows = new Set(this.state.selectedRows);
      selectedRows.delete(item);
      this.setState({ selectedRows });
    }
  });

  private getHeightStyle(props: NavigationListItemProps, info: NavigationListItemInfo) {
    return (props.style && props.style.height) || this.shouldRenderNarrow()
      ? undefined
      : { height: this.getRowHeight({ index: info.index }) };
  }

  private makePlaceholderRowProps(props: NavigationListItemProps, info: NavigationListItemInfo): StaticPlaceholderRowProps {
    return {
      style: this.getHeightStyle(props, info) || {},
      active: false,
      selectable: !!this.props.selectable,
      narrow: this.shouldRenderNarrow(),
      placeholder: true,
      selected: false,
      selectionDisabled: true,
      onSelect: noop,
      onDeselect: noop,
      tableId: this.id,
      isList: this.isList,
      rowHeight: this.props.rowHeight!,
    };
  }

  private renderRow = (item: T, props: NavigationListItemProps & React.Attributes, info: NavigationListItemInfo) => {
    const { selectable, rowActionsCount, renderRowActions, rowHeight } = this.props as TablePropsWithDefaultProps<T>;
    return this.props.renderRow(
      item,
      {
        ...props,
        style: { ...props.style, ...this.getHeightStyle(props, info) },
        index: info.index,
        selectable,
        narrow: this.shouldRenderNarrow(),
        isScrolling: info.isScrolling,
        selected: selectable ? !!this.selectedRows && this.selectedRows.has(item) : false,
        selectionDisabled: this.isSelectDisabled(item),
        onSelect: this.onSelectRow(item),
        onDeselect: this.onDeselectRow(item),
        tableId: this.id,
        actions: rowActionsCount && renderRowActions ? renderRowActions(item) : undefined,
        isList: this.isList,
        tableWithoutHeader: this.shouldNotRenderColumnHeaders,
        rowHeight,
      },
      info
    );
  };

  private getAriaSortProp(columnIndex: number): Partial<Pick<React.HTMLAttributes<HTMLElement>, "aria-sort">> {
    return this.sortBy.column !== columnIndex
      ? {}
      : {
          "aria-sort": this.sortBy.descending ? "descending" : "ascending",
        };
  }

  private renderTooltip = (tooltipOptions: TooltipOptions) => (
    <IconTooltip
      aria-label={tooltipOptions?.title}
      size={IconSize.XXSmall}
      icon={tooltipOptions?.iconName || IconName.Info}
      title={tooltipOptions.title}
    >
      {tooltipOptions?.text}
    </IconTooltip>
  );

  private renderColumnHeaders() {
    const { selectable, error, data, onClickColumnHeader, headerCheckboxAriaLabel, styles, rowActionsCount } = this
      .props as TablePropsWithDefaultProps<T>;
    const headerCheckboxState = this.getHeaderCheckboxState();
    const columns = this.visibleColumns;

    if (this.shouldNotRenderColumnHeaders) {
      return null;
    }

    return (
      <HeaderRow elementRef={this.headerRow} className={styles.headerRow} role={this.isList ? "listitem" : "row"}>
        {selectable && !error ? (
          <Cell
            className={styles.headerCheckboxCell}
            id={`${this.id}-header-0`}
            role={this.isList ? "" : "columnheader"}
            aria-label="Checkbox"
          >
            <Checkbox
              data-test-class="table-header-checkbox"
              disabled={data.length === 1 || Boolean(error)}
              indeterminate={headerCheckboxState === null}
              checked={headerCheckboxState || false}
              onChange={() => this.onCheckboxChange(headerCheckboxState)}
              label={headerCheckboxAriaLabel}
            />
          </Cell>
        ) : null}
        {columns.map((c, i) => (
          <TextCell
            key={i}
            className={classNames(styles.headerCell, {
              [styles.sort]: this.sortBy.column === i,
              [styles.headerIconTooltip]: !!c.tooltip,
            })}
            id={`${this.id}-header-${i + 1}`}
            role={this.isList ? "" : "columnheader"}
            // Hide cell for screenreaders when there is no text for it
            // Can delete after moving all actions to `renderRowActions`
            aria-hidden={!c.title && !c.ariaLabel}
            tabIndex={!c.title ? -1 : 0}
            aria-label={c.ariaLabel}
            {...this.getAriaSortProp(i)}
            data-test-class={`table-header-cell-${i + 1}`}
          >
            {onClickColumnHeader !== noop && c.sortable !== false && c.title ? (
              c.tooltip ? (
                <div style={{ cursor: "pointer" }} onClick={(e) => this.onClickColumnHeader(c, e)}>
                  {c.title}
                  {this.renderTooltip(c.tooltip)}
                  {this.sortBy.column === i ? (
                    <>
                      <span className={styles.sortOrder}>, sorted {this.sortBy.descending ? "descending" : "ascending"}</span>
                      <Icon icon={this.sortBy.descending ? IconName.SortDown : IconName.SortUp} />
                    </>
                  ) : null}
                </div>
              ) : (
                <UnstyledButton
                  onClick={(e) => this.onClickColumnHeader(c, e)}
                  className={styles.sortButton}
                  style={{ textAlign: c.align || "left" }}
                  aria-live="assertive"
                  autoFocus={this.sortBy.column === i}
                >
                  {c.title}
                  {this.sortBy.column === i ? (
                    <>
                      <span className={styles.sortOrder}>, sorted {this.sortBy.descending ? "descending" : "ascending"}</span>
                      <Icon icon={this.sortBy.descending ? IconName.SortDown : IconName.SortUp} />
                    </>
                  ) : null}
                </UnstyledButton>
              )
            ) : c.title ? (
              <span className={styles.focusable} aria-label={c.title}>
                {c.title}
                {!!c.tooltip && this.renderTooltip(c.tooltip)}
              </span>
            ) : null}
          </TextCell>
        ))}
        {rowActionsCount ? (
          <TextCell
            role="columnheader"
            id={`${this.id}-header-${columns.length + 1}`}
            className={classNames(styles.headerCell)}
            hideUntilKeyboardNav
          >
            <span className={styles.focusable} tabIndex={0} aria-label="Actions">
              Actions
            </span>
          </TextCell>
        ) : null}
      </HeaderRow>
    );
  }

  private getCurrentDataSet = (props = this.props) => props.data;

  private getHeaderCheckboxState() {
    const selectedRowsLength = this.selectedRows && this.selectedRows.size;
    if (selectedRowsLength === 0) {
      return false;
    }
    if (selectedRowsLength === this.getCurrentDataSet().length) {
      return true;
    }
    return null;
  }

  private getSelectableDataSet() {
    const { isRowSelectionDisabled } = this.props;
    if (typeof isRowSelectionDisabled !== "function") {
      return this.getCurrentDataSet();
    }
    return this.getCurrentDataSet().filter((item) => !this.isSelectDisabled(item));
  }

  private onSelectAll() {
    if (!this.isSelectControlled) {
      const selectableDataSet = this.getSelectableDataSet();
      const { selectedRows } = this.state;
      if (selectableDataSet.length === selectedRows.size) {
        this.onDeselectAll();
      } else {
        const selectedRows = new Set(this.getSelectableDataSet());
        this.setState({ selectedRows });
      }
    }

    this.props.onSelectAll!();
  }

  private onDeselectAll() {
    if (!this.isSelectControlled) {
      this.setState({ selectedRows: new Set([]) });
    }

    this.props.onDeselectAll!();
  }

  private isSelectDisabled(item: T): boolean {
    const { isRowSelectionDisabled } = this.props;
    if (typeof isRowSelectionDisabled !== "function") {
      return false;
    }
    return isRowSelectionDisabled(item);
  }

  private onClickColumnHeader(column, event) {
    event.preventDefault();
    const index = this.props.columns.indexOf(column);
    const descending = this.sortBy && this.sortBy.column === index ? !this.sortBy.descending : column.defaultSortDescending;

    if (!this.isSortControlled) {
      this.setState({ sortBy: { column: index, descending } });
    }

    this.props.onClickColumnHeader!({ column: index, descending }, event);
  }

  public recalculateScrollTop(): void {
    if (this.navigationList.current && this.navigationList.current.list) {
      this.navigationList.current.list.recalculateScrollTop();
    }
  }

  public updateWindowScrollerPosition(): void {
    if (this.navigationList.current && this.navigationList.current.list) {
      this.navigationList.current.list.updateWindowScrollerPosition();
    }
  }

  public getChildContext() {
    return { rowHeight: this.props.rowHeight };
  }

  private addColumnWidthStyles(columns, selectable) {
    const { styles, rowActionsCount } = this.props as TablePropsWithDefaultProps<T>;
    const row = rowStyles.row.split(" ")[0];
    const cell = cellStyles.cell.split(" ")[0];
    const narrow = styles.narrowTable.split(" ")[0];
    const offset = Number(selectable && !this.props.error);
    const { count, total } = getFixedWidthColumns(columns, selectable);
    if (process.env.NODE_ENV !== "production") {
      verifyColumns(columns, count);
    }

    columns.forEach((c, i) => {
      const n = i + offset;
      const selector = `[data-id='${this.id}']:not(.${narrow}) .${row} > .${cell}:nth-child(${n + 1})`;
      const rule = `{ width: ${cellWidth(c.width, total, columns.length - count, rowActionsCount)}; }`;
      if (this.stylesheet) {
        this.stylesheet.insertRule(`${selector} ${rule}`, 0);
      }
    });
  }

  public componentDidMount() {
    this.styleElement = document.createElement("style");
    document.head.appendChild(this.styleElement);
    this.stylesheet = this.styleElement.sheet as CSSStyleSheet;
    this.addColumnWidthStyles(this.visibleColumns, this.props.selectable);
  }

  public UNSAFE_componentWillReceiveProps(nextProps) {
    if (!this.isSelectControlled && this.selectedRows && this.selectedRows.size > 0 && this.props.data !== nextProps.data) {
      const selectedRows = new Set(Array.from(this.selectedRows).filter((row) => nextProps.data.includes(row)));

      this.setState({ selectedRows });
    }
  }

  public componentDidUpdate(prevProps: TableProps<T>) {
    const { columns, selectable, error } = this.props;

    if (prevProps.columns !== columns || prevProps.selectable !== selectable || Boolean(prevProps.error) !== Boolean(error)) {
      while (this.stylesheet && this.stylesheet.cssRules.length) {
        this.stylesheet.deleteRule(0);
      }
      this.addColumnWidthStyles(this.visibleColumns, selectable);
    }
  }

  public componentWillUnmount() {
    if (this.styleElement) {
      document.head.removeChild(this.styleElement);
    }
    this.disposeLayoutReaction();
  }

  /**
   * Count of all the rows, with the header row factored in, based on the rules of aria-rowcount
   */
  public get ariaRowCount(): number {
    const { eventualRowCount, data, withoutHeader } = this.props;
    // Header row is included in the overall row count
    return (eventualRowCount || data.length) + (withoutHeader ? 0 : 1);
  }

  public render() {
    const {
      className,
      scrollElement,
      error,
      styles,
      data,
      virtualize,
      virtualizationThreshold,
      eventualRowCount,
      queryId,
      getRowHeight,
      estimatedRowHeight,
      overscanRowCount,
      loadMoreRows,
      minimumBatchSize,
      fetchThreshold,
      title,
      header,
      toolbar,
      activeRow,
      columns,
      isRowSelectionDisabled,
      renderPlaceholderRow,
      renderRow,
      rowActionsCount,
      renderRowActions,
      selectedItemsString,
      renderSelectionToolbar,
      rowHeight,
      selectable,
      selectedRows,
      defaultSelectedRows,
      sortBy,
      defaultSortBy,
      onClickColumnHeader,
      onSelectAll,
      onDeselectAll,
      headerCheckboxAriaLabel,
      withoutHeader,
      disableArrowKeyFocuser,
      ...passthrough
    } = this.props as TablePropsWithDefaultProps<T>;
    const cardClassName = classNames(className, styles[this.shouldRenderNarrow() ? "narrow-table" : "table"]);
    const narrow = this.shouldRenderNarrow();
    const NavigationList = (this.constructor as typeof Table).NavigationList;
    const hasSelectionToolbar = this.selectedRows && this.selectedRows.size > 0 && renderSelectionToolbar;

    return (
      <NavigationList
        ref={this.navigationList}
        focusContainer={this.focusContainer.current}
        focusableElementFilter={this.elementIsFocusTarget}
        enableArrowKeyFocus={!error}
        items={data}
        scrollElement={scrollElement}
        virtualize={virtualize}
        virtualizationThreshold={virtualizationThreshold}
        eventualItemCount={eventualRowCount}
        queryId={queryId}
        getItemHeight={getRowHeight || this.getRowHeight}
        estimatedItemHeight={estimatedRowHeight}
        overscanItemCount={overscanRowCount}
        loadMoreItems={loadMoreRows}
        minimumBatchSize={minimumBatchSize}
        fetchThreshold={fetchThreshold}
        activeItem={activeRow || null}
        renderItem={this.renderRow as any}
        renderPlaceholderItem={this.renderPlaceholderRow}
        disableArrowKeyFocuser={disableArrowKeyFocuser}
        role="none"
        renderContainer={({ onKeyDown, onFocus, onFocusCapture, onBlurCapture, onMouseDownCapture, className, ...props }) => (
          <Card
            withoutPadding
            header={this.header}
            data-id={this.id}
            data-hastopbar={!!(toolbar || hasSelectionToolbar)}
            aria-label={title}
            {...passthrough}
            className={[className, cardClassName].join(" ")}
            {...props}
          >
            <div
              onKeyDown={onKeyDown}
              onFocus={onFocus}
              onFocusCapture={onFocusCapture}
              onBlurCapture={selectable ? undefined : onBlurCapture}
              onMouseDownCapture={onMouseDownCapture}
              ref={this.focusContainer}
              role={this.isList ? "list" : narrow ? undefined : data.length ? "grid" : ""} // if we have no data, we wanna force role to empty, because otherwise, listitem or row children are required always
              aria-rowcount={narrow || this.isList ? undefined : error ? undefined : this.ariaRowCount} // this attribute is not allowed for lists (role="list")
            >
              {
                Boolean(data.length) &&
                  this.renderColumnHeaders() /** we don't want to show the column headers if there is no data, otherwise it would just cause confusion */
              }
              {error ? <div className={styles.error}>{error}</div> : props.children}
            </div>
          </Card>
        )}
      />
    );
  }
}
