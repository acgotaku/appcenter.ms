import * as React from "react";
import * as classNames from "classnames/bind";
import { Observer } from "mobx-react";
const css = require("./tab-sections.scss");

export interface TabSectionProps extends React.HTMLAttributes<HTMLElement> {
  selected?: boolean;
  id: string;
  "aria-labelledby": string;
  styles?: any;
  children: React.ReactNode | (() => React.ReactElement<any>);
}

export class TabSection extends React.Component<TabSectionProps, {}> {
  public static defaultProps = { styles: css };

  public render() {
    const { styles, selected, className, children, ...passthrough } = this.props;

    return (
      <div
        {...passthrough}
        role="tabpanel"
        aria-hidden={!selected}
        tabIndex={!selected ? -1 : undefined}
        className={classNames.call(styles, selected ? "tab-section" : "tab-section-hidden", className)}
      >
        {typeof children === "function" ? (
          selected ? (
            <Observer>{children as () => React.ReactElement<any>}</Observer>
          ) : null
        ) : (
          children
        )}
      </div>
    );
  }
}
