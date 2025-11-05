import * as React from "react";
import { observer } from "mobx-react";
import { ListProps } from "./types";
import { ListItemInjectedProps, ItemInfo } from "./types";

export interface RowsProps<T> {
  item: T;
  injectProps: ListItemInjectedProps;
  itemInfo: ItemInfo;
  renderItem: ListProps<T>["renderItem"];
}

/**
 * This component exists purely to prevent any observables accessed inside `renderItem`
 * from being tracked by `List.Observer`.
 */
export class ItemRenderer<T> extends React.Component<RowsProps<T>> {
  public static Observer = observer(
    class<T> extends ItemRenderer<T> {
      public static displayName = "ItemRenderer.Observer";
    }
  );

  public render() {
    return this.props.renderItem(this.props.item, this.props.injectProps, this.props.itemInfo);
  }
}
