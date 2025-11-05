import * as React from "react";
import * as classNames from "classnames/bind";
import { omit } from "lodash";

export interface SFCProps extends React.HTMLAttributes<HTMLElement> {
  tagName?: string | React.ComponentClass<any> | React.StatelessComponent<any>;
  styles?: any;
}

export function createSFC<P extends {}>(
  displayName: string,
  styles: any,
  styleName: string | ((props: SFCProps & P) => string),
  omitProps?: (keyof P)[],
  defaultProps: Partial<SFCProps & P> = {} as any
) {
  const Component: React.SFC<SFCProps & P> = (props) => {
    const { className, styles, tagName, ...passthrough } = props as SFCProps;
    const s = typeof styleName === "function" ? styleName(props) : styleName;
    return React.createElement(tagName as any, {
      className: classNames.call(styles, s, className),
      ...omit(passthrough, omitProps || []),
    });
  };

  Component.displayName = displayName;
  Component.defaultProps = { styles, tagName: "div", ...(defaultProps as any) };
  return Component;
}
