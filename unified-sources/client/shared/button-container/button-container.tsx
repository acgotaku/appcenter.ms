import * as React from "react";
import * as classNames from "classnames/bind";
const css = require("./button-container.scss");

export interface ButtonContainerProps extends React.HTMLAttributes<HTMLElement> {
  /** Makes all Buttons equal-width. (Works for up to six buttons.) */
  equalize?: boolean;
  /** Aligns Buttons to the far right of the container. */
  right?: boolean;
  /** Distributes Buttons with space between. */
  between?: boolean;
  /** @internal */
  styles?: any;
  /** Distributes Buttons with same width within the entire container area. */
  fullWidth?: boolean;
}

/**
 * ButtonContainer provides the standard horizontal spacing between buttons.
 * It also optionally can size all of its buttons (up to 6) equal widths,
 * expanding all others match the intrinsic width of the largest button.
 */
export class ButtonContainer extends React.PureComponent<ButtonContainerProps, {}> {
  public static defaultProps = { styles: css };

  get children() {
    const { equalize } = this.props;
    if (!equalize) {
      return this.props.children;
    }
    // <ButtonContainer>’s children are <Button>s, which sometimes render <button>
    // 'equalize' requires 'display: table-cell' (CSS) which <button> doesn't support
    // As a workaround, wrap <ButtonContainer equalize>’s children in a <span>
    return React.Children.toArray(this.props.children).map((child, key) => React.createElement("span", { key }, child));
  }

  public render() {
    const { styles, equalize, right, className, fullWidth, between, ...props } = this.props;
    const styleName = equalize || fullWidth ? "equal-width" : "container";
    return (
      <div className={classNames.call(styles, styleName, className, { right, fullWidth, between })} {...props}>
        {this.children}
      </div>
    );
  }
}
