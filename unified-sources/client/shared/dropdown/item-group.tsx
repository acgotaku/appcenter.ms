import * as React from "react";
import * as classNames from "classnames/bind";
import { ListItemContext } from "./list-item-context";
import { Text, Size, TextColor } from "../typography";
const css = require("./item-group.scss");

export interface ItemGroupProps extends React.HTMLAttributes<HTMLElement> {
  title?: string;
  dark?: boolean;
  styles?: any;
}

export class ItemGroup extends React.Component<ItemGroupProps, {}> {
  public context!: ListItemContext;
  public static defaultProps = { styles: css };

  public render() {
    const { className, children, title, styles, dark, ...props } = this.props;
    return (
      <div
        data-item-group
        className={classNames.call(styles, className, "item-group", { dark }, { "with-title": !!title })}
        {...props}
      >
        <Text invert={dark} size={Size.Medium} color={TextColor.Secondary} className={styles.title}>
          {title}
        </Text>
        {children}
      </div>
    );
  }
}

export const isItemGroup = (instance) => instance && instance.type === ItemGroup;
