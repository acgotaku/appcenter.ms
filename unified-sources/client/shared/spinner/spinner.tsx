import * as React from "react";
import * as PropTypes from "prop-types";
import { IconSize } from "../icon/icon";
const css = require("./spinner.scss");
const classNames = require("classnames");

/**
 * Props an Spinner component should include
 */
export interface SpinnerProps {
  size?: IconSize;
  className?: any;
  styles?: any;
}

type DefaultProps = {
  size: IconSize;
  styles: { [key: string]: string };
};

type SpinnerPropsWithDefaultProps = SpinnerProps & DefaultProps;

/**
 * @deprecated
 * Just don’t do it. Set `loading` on PageHeader instead.
 */
export class Spinner extends React.Component<SpinnerProps, {}> {
  public static propTypes: React.ValidationMap<SpinnerProps> = {
    className: PropTypes.oneOfType([PropTypes.array, PropTypes.string, PropTypes.object]),
  };

  public static defaultProps = {
    styles: css,
    size: IconSize.Large,
  };

  /**
   * Renders an Spinner component
   */
  public render() {
    const { styles, size } = this.props as SpinnerPropsWithDefaultProps;
    const sizeClass = IconSize[size].toLowerCase();
    const spinnerClassName = classNames(this.props.className, styles[sizeClass], styles.spinner);
    return (
      <div className={styles.container}>
        <div className={spinnerClassName}></div>
      </div>
    );
  }
}
