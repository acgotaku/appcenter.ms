import * as React from "react";
import * as PropTypes from "prop-types";
import * as shallowEqual from "shallowequal";
import * as bigInt from "big-integer";
import { times, pick } from "lodash";
import { isObservableArray, reaction } from "mobx";
import { observer, PropTypes as MobxPropTypes } from "mobx-react";
import { WindowScroller, AutoSizer, InfiniteLoader, List as RVList, Grid } from "react-virtualized";
import {
  ListProps,
  ListVirtualization,
  ItemInfo,
  ReactVirtualizedList,
  ReactVirtualizedWindowScroller,
  ListItemInjectedProps,
} from "./types";
import { ItemRenderer } from "./item-renderer";
import { assertUnreachable, assertConstantProps } from "../utils";
import { binaryFill, binarySplit } from "./binary-utils";
import { layoutStore } from "@root/stores";
const css = require("./list.scss");

// Passing null into <RVList> throws errors in the console that
// it cannot pass "null" into these props through `react-virtualized`
// relevant user story: https://dev.azure.com/msmobilecenter/Mobile-Center/_workitems/edit/43568
// relevant pr to address user story: https://dev.azure.com/msmobilecenter/Mobile-Center/_git/bcd79acf-9383-4121-86d7-c5d443d9a72c/pullrequest/23359?_a=overview
Grid.propTypes = {
  "aria-label": PropTypes.any,
  role: PropTypes.any,
};

export class List<T> extends React.Component<ListProps<T>> {
  public static defaultProps = {
    renderContainer: (props) => <div {...props} />,
    renderPlaceholderItem: () => null,
    virtualize: ListVirtualization.Auto,
    virtualizationThreshold: 150,
    role: "list",
    styles: css,
  };

  public static propTypes = {
    items: (props: ListProps<any>, key: string, componentName: string, ...rest: [any, any]) => {
      if (isObservableArray(props.items)) {
        return new Error(
          "Received an observable array for prop `items` in component `List`. " + "Please use `List.Observer` instead of `List`."
        );
      }

      return PropTypes.array.isRequired(props, key, componentName, ...rest);
    },
  };

  public static contextTypes = { pageContext: PropTypes.object };

  public static ItemRenderer = ItemRenderer;
  public static Observer = observer(
    class<T> extends List<T> {
      public static ItemRenderer = ItemRenderer.Observer;
      public static displayName = "List.Observer";
      public static propTypes = { ...List.propTypes, items: PropTypes.oneOfType([PropTypes.array, MobxPropTypes.observableArray]) };
    }
  );

  public context!: { pageContext: { scrollElement: Element } };
  private requestedItemRange = bigInt(0);
  private rvList?: ReactVirtualizedList;
  private windowScroller?: ReactVirtualizedWindowScroller;
  private disposeReaction = reaction(
    () => layoutStore.isMobile,
    () => {
      this.forceUpdate();
      this.updateWindowScrollerPosition();
      this.recalculateScrollTop();
    }
  );

  constructor(props: ListProps<T>, context: any) {
    super(props, context);
    if (this.isVirtualized()) {
      this.loadMoreItems({ startIndex: 0, stopIndex: this.props.minimumBatchSize! - 1 }, true);
    }
  }

  public recalculateScrollTop(): void {
    const { scrollElement = this.context.pageContext.scrollElement } = this.props;
    scrollElement.dispatchEvent(new Event("scroll"));
  }

  public updateWindowScrollerPosition(): void {
    if (this.windowScroller) {
      this.windowScroller.updatePosition();
    }
  }

  private isVirtualized(props = this.props) {
    switch (props.virtualize) {
      case ListVirtualization.Never:
        return false;
      case ListVirtualization.Always:
        return true;
      case ListVirtualization.Auto:
        return props.items.length > props.virtualizationThreshold!;
      default:
        assertUnreachable(props.virtualize as never);
    }
  }

  private getItemCount(eventualRowCount = this.props.eventualItemCount, items = this.props.items) {
    return eventualRowCount || items.length;
  }

  private isItemLoaded = ({ index }: { index: number }) => {
    return Boolean(this.props.items[index]);
  };

  private loadMoreItems = ({ startIndex, stopIndex }: { startIndex: number; stopIndex: number }, forceLoad = false) => {
    const { minimumBatchSize, loadMoreItems } = this.props;
    if (!loadMoreItems || !minimumBatchSize || isNaN(startIndex) || isNaN(stopIndex)) {
      return Promise.resolve();
    }

    const start = Math.floor(startIndex / minimumBatchSize);
    const stop = Math.floor(stopIndex / minimumBatchSize);
    const newRowRange = binaryFill(start, stop, this.requestedItemRange);
    const rangeToRequest = newRowRange.minus(this.requestedItemRange);
    this.requestedItemRange = newRowRange;
    return Promise.all(
      binarySplit(rangeToRequest).map((range) => {
        let from = range[0] * minimumBatchSize;
        const to = (range[1] + 1) * minimumBatchSize;
        while (from < to && !forceLoad && this.isItemLoaded({ index: from })) {
          from += minimumBatchSize;
        }

        if (from === to) {
          return Promise.resolve();
        }
        return loadMoreItems(from, to - 1);
      })
    );
  };

  private shouldResetRequestedItemRange(nextProps: ListProps<T>) {
    if (typeof nextProps.queryId !== "undefined") {
      if (this.props.queryId !== nextProps.queryId) {
        return true;
      }
    } else if (this.props.items !== nextProps.items) {
      return true;
    }

    return false;
  }

  private renderList = ({ height, scrollTop, isScrolling }) => {
    const { overscanItemCount, estimatedItemHeight, minimumBatchSize, getItemHeight, fetchThreshold } = this.props;
    const itemCount = this.getItemCount();

    return (
      <AutoSizer disableHeight>
        {({ width }) => (
          <InfiniteLoader
            isRowLoaded={this.isItemLoaded}
            loadMoreRows={this.loadMoreItems}
            rowCount={itemCount}
            minimumBatchSize={minimumBatchSize}
            threshold={fetchThreshold}
          >
            {({ onRowsRendered, registerChild }) => (
              <RVList
                ref={(x) => registerChild((this.rvList = x))}
                // eslint-disable-next-line jsx-a11y/aria-role
                role={null}
                aria-label={null}
                aria-readonly={null}
                tabIndex={null}
                containerRole="presentation"
                className={this.props.styles!.rvList}
                autoHeight
                height={height}
                width={width}
                overscanRowCount={overscanItemCount}
                rowCount={itemCount}
                rowHeight={getItemHeight}
                rowRenderer={isScrolling ? this.renderItemScrolling : this.renderItem}
                scrollTop={scrollTop}
                onRowsRendered={onRowsRendered}
                estimatedRowSize={estimatedItemHeight}
              />
            )}
          </InfiniteLoader>
        )}
      </AutoSizer>
    );
  };

  private renderItemScrolling = (opts: ItemInfo & Pick<ListItemInjectedProps, "style"> & React.Attributes) => {
    return this.renderItem({ ...opts, isScrolling: true });
  };

  private renderItem = ({
    index,
    style,
    key,
    isScrolling,
    isVisible,
  }: ItemInfo & Pick<ListItemInjectedProps, "style"> & React.Attributes) => {
    const { items, renderPlaceholderItem } = this.props;
    const info = { index, isScrolling, isVisible };

    const item = index != null && items[index];
    if (!item) {
      return renderPlaceholderItem!({ key, style }, info);
    }

    const Renderer = (this.constructor as typeof List).ItemRenderer;
    return <Renderer key={key} item={item} renderItem={this.props.renderItem} injectProps={{ style }} itemInfo={info} />;
  };

  private renderItemsUnvirtualized = () => {
    const { eventualItemCount = 0, items } = this.props;
    const nonHeaderRowCount = Math.max(eventualItemCount, items.length);
    const key = (index) => `${index > items.length ? "placeholder-" : ""}${index}`;
    return times(nonHeaderRowCount, (index) => this.renderItem({ index, style: {}, key: key(index) })).filter(
      (item): item is JSX.Element => item != null
    );
  };

  private renderContents() {
    if (!this.isVirtualized()) {
      return this.renderItemsUnvirtualized();
    }

    const { pageContext } = this.context;
    const { scrollElement } = this.props;
    return (
      <WindowScroller
        scrollElement={scrollElement || pageContext.scrollElement}
        ref={(x) => (this.windowScroller = x)}
        key={this.windowScroller}
      >
        {this.renderList}
      </WindowScroller>
    );
  }

  public UNSAFE_componentWillUpdate(nextProps: ListProps<T>) {
    assertConstantProps(this.props, nextProps, "virtualize");
  }

  public componentDidUpdate(prevProps: ListProps<T>) {
    if (this.shouldResetRequestedItemRange(prevProps)) {
      this.requestedItemRange = bigInt(0);
      this.loadMoreItems({ startIndex: 0, stopIndex: this.props.minimumBatchSize! - 1 }, true);
    }

    if (this.isVirtualized()) {
      const reloadWindowScrollerProps = ["minimumBatchSize", "fetchThreshold"];
      if (
        this.windowScroller &&
        (this.getItemCount(prevProps.eventualItemCount, prevProps.items) !== this.getItemCount() ||
          !shallowEqual(pick(this.props, reloadWindowScrollerProps), pick(prevProps, reloadWindowScrollerProps)))
      ) {
        this.windowScroller.forceUpdate();
      } else if (this.rvList) {
        this.rvList.forceUpdateGrid();
      }

      // This is a huge pain to keep track of, and I don’t think it’s
      // very expensive, so we’re just going to call it all the time.
      this.windowScroller!.updatePosition();
    }
  }

  componentWillUnmount() {
    this.disposeReaction();
  }

  public render() {
    return (
      this.props.renderContainer &&
      this.props.renderContainer({
        children: this.renderContents(),
        role: this.props.role,
      })
    );
  }
}
