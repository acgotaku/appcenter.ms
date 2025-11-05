import * as React from "react";
import * as classNames from "classnames";
import { Dropdown, DropdownProps } from "../dropdown/dropdown";
const css = require("./menu.scss");

export type MenuProps = Partial<DropdownProps>;

export class Menu extends React.Component<MenuProps, {}> {
  public static defaultProps: React.ValidationMap<MenuProps> = { styles: css };

  public render() {
    /**
     * Props not specifically handled by Menu
     * These should be passed through to the Dropdown component
     */
    const { styles, children, className, listClassName, ...passthrough } = this.props;

    return (
      <Dropdown
        {...passthrough}
        className={classNames(className, styles.menu)}
        listClassName={classNames(styles.list, listClassName)}
        role="menu"
        firstItemFocus
      >
        {this.props.children}
      </Dropdown>
    );
  }
}
