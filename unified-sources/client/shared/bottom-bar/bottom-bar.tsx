import * as React from "react";
import * as classNames from "classnames";
const css = require("./bottom-bar.scss");

export interface BottomBarProps extends React.HTMLAttributes<HTMLElement> {
  /** Aligns the contents to the far right of the bar. */
  alignRight?: boolean;
  /** Shrinks to contents instead of enforcing a fixed height. */
  autoHeight?: boolean;
  /** @internal */
  styles?: any;
}

/**
 * @deprecated
 * Use `<FooterArea>` as the `footer` prop of `Page` instead.
 */
export class BottomBar extends React.Component<BottomBarProps, {}> {
  public static defaultProps: Object = { styles: css };
  public render() {
    const { alignRight, styles, autoHeight, ...props } = this.props;
    const className = classNames(alignRight ? styles.right : styles.bottomBar, this.props.className, {
      [styles.autoHeight]: autoHeight,
    });

    return (
      <div {...props} className={className}>
        {this.props.children}
      </div>
    );
  }
}
