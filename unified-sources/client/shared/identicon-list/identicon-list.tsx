import * as React from "react";
import { Skeletal } from "@root/shared/skeleton";
import { range } from "lodash";
import { Icon } from "@root/shared/icon";
const css = require("./identicon-list.scss");
import { Space, spaceValues } from "../common-interfaces/space";

type ItemProps<T> = { item: T; index: number; size: number };
export interface IdenticonListProps<T> extends Skeletal {
  /** Entities for which icons need to be displayed */
  data: T[];
  /** Render each identicon item */
  renderItem: (props: ItemProps<T>) => React.ReactNode;
  /** Expected identicon count. This count is used for rendering the given number of identicon skeletons if the `skeleton` prop is set. */
  eventualCount?: number;
  /** Size in pixels of each  identicon in the list */
  size?: number;
}

export class IdenticonList<T> extends React.Component<IdenticonListProps<T>, {}> {
  public static defaultProps = {
    data: [],
    eventualCount: 10,
    size: spaceValues[Space.Large],
    renderItem: () => null,
  };

  public render() {
    if (this.props.skeleton) {
      return (
        <div className={css.container}>
          {range(0, this.props.eventualCount).map((num) => (
            <Icon key={num} skeleton style={{ width: this.props.size, height: this.props.size }} />
          ))}
        </div>
      );
    }
    const { data, size, renderItem } = this.props;
    return <div className={css.container}>{data.map((item, index) => renderItem({ item, index, size: size! }))}</div>;
  }
}
