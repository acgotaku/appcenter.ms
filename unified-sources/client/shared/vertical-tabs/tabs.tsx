import * as React from "react";
import { RightInjectedProps, TabProps } from "./types";
import { wrapPrimitive } from "@root/shared/utils/wrapPrimitive";
const css = require("./vertical-tabs.scss");
const { Children, cloneElement } = React;

export interface TabsProps {
  children?: React.ReactElement<TabProps>[];
  styles?: {
    tabHeight: string;
    tabs: string;
    marker: string;
    [key: string]: string;
  };
}

type DefaultProps = {
  styles: {
    tabHeight: string;
    tabs: string;
    marker: string;
    [key: string]: string;
  };
};

type TabsPropsWithDefaultProps = TabsProps & RightInjectedProps & React.HTMLAttributes<HTMLElement> & DefaultProps;

export class Tabs extends React.Component<TabsProps & RightInjectedProps & React.HTMLAttributes<HTMLElement>, {}> {
  public static displayName = "VerticalTabs.Tabs";
  public static defaultProps = { styles: css };

  public render() {
    const { onClickTab, activeTab, styles, className, children, ...props } = this.props as TabsPropsWithDefaultProps;
    const tabHeight = parseInt(styles.tabHeight, 10);

    return (
      <div className={[className, styles.tabs].join(" ")} {...props}>
        <nav className={styles["list"]}>
          {Children.map(children, (child, index) =>
            cloneElement(wrapPrimitive(child), {
              key: index,
              active: index === activeTab,
              onClick: () => onClickTab(index),
            })
          )}
        </nav>
        <span key="marker" className={styles.marker} style={{ transform: `translateY(${activeTab * tabHeight}px)` }} />
      </div>
    );
  }
}
