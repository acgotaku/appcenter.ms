import * as React from "react";
import { UnstyledButton } from "@root/shared";
import { TabProps } from "./types";
const css = require("./vertical-tabs.scss");

export class Tab extends React.Component<Partial<TabProps> & React.HTMLAttributes<HTMLElement>, {}> {
  public static displayName = "VerticalTabs.Tab";
  public static defaultProps = { styles: css };

  public onClick = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    if (this.props.onClick) {
      this.props.onClick();
    }
  };

  public render() {
    const { className, styles, children, active, ...props } = this.props;
    const cn = [className, active ? styles.active : styles.tab].join(" ");
    return (
      <UnstyledButton role="link" aria-current={active} className={cn} {...props} onClick={this.onClick}>
        {children}
      </UnstyledButton>
    );
  }
}
