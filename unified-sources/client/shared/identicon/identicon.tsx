import * as React from "react";
import * as spliddit from "spliddit";
import { getColorClassName, StyleTypes, ColorSets } from "./colors";
import { Icon, IconName, IconSize } from "../icon";
import { Skeletal } from "../skeleton/skeleton";

const classNames = require("classnames");
const css = require("./identicon.scss");

export interface IdenticonProps extends Skeletal, React.HTMLAttributes<Element> {
  value?: string;
  hashValue?: string;
  size?: number;
  icon?: IconName;
  src?: string;
  length?: number;
  styles?: any;
  defaultIconColor?: string;
}

export interface IdenticonState {
  srcError: boolean;
}

export class Identicon extends React.PureComponent<IdenticonProps, IdenticonState> {
  public static defaultProps: Object = {
    styles: css,
    length: 1,
  };

  constructor(props: IdenticonProps) {
    super(props);
    this.state = {
      srcError: false,
    };
  }

  private get style() {
    const { size, src } = this.props;

    const style = {
      width: size,
      height: size,
    };
    if (size && (!src || this.state.srcError)) {
      style["lineHeight"] = `${size - size * 0.075}px`;
    }

    return style;
  }

  private get containerClass() {
    const { hashValue, value, defaultIconColor } = this.props;
    const existedValue = hashValue || value;

    if (!!defaultIconColor && !hashValue && !value) {
      return defaultIconColor;
    } else if (existedValue) {
      return getColorClassName(existedValue, StyleTypes.Container, ColorSets.Light1Colors);
    }
    return null;
  }

  private get textStyle() {
    const { size } = this.props;
    if (size) {
      return {
        fontSize: Math.floor(size / 2.5),
      };
    }
  }

  private get textClass() {
    const { hashValue, value, defaultIconColor } = this.props;
    const existedValue = hashValue || value;

    if (!!defaultIconColor && !hashValue && !value) {
      return defaultIconColor;
    } else if (existedValue) {
      return getColorClassName(existedValue, StyleTypes.Text, ColorSets.Dark1Colors);
    }
    return null;
  }

  private get iconFillClass() {
    const { hashValue, value } = this.props;
    const existedValue = hashValue || value;

    if (existedValue) {
      return getColorClassName(existedValue, StyleTypes.Icon, ColorSets.Dark1Colors);
    }
    return null;
  }

  private get iconSize() {
    const { size } = this.props;
    if (size) {
      if (size <= 20) {
        return IconSize.XXSmall;
      } else if (size <= 40) {
        return IconSize.XSmall;
      } else if (size <= 80) {
        return IconSize.Medium;
      }
    }
    return IconSize.Large;
  }
  public render() {
    if (this.props.skeleton) {
      return <Icon skeleton style={{ width: this.props.size, height: this.props.size }} />;
    }
    const { styles, value, className, icon, src, length } = this.props;
    const iconClassName = classNames(className, styles.identicon);
    const containerClassName = classNames(className, styles.identicon, styles[this.containerClass || ""]);
    const letter = value ? (spliddit(value) as string[]).splice(0, length) : null;

    return src && !this.state.srcError ? (
      <Icon className={iconClassName} style={this.style} src={src} onError={this.setSrcError} />
    ) : (
      <div className={containerClassName} style={this.style}>
        {icon ? (
          <Icon icon={icon} className={styles[this.iconFillClass || ""]} size={this.iconSize} />
        ) : (
          <span className={styles[this.textClass || ""]} style={this.textStyle} aria-hidden="true">
            {letter}
          </span>
        )}
      </div>
    );
  }

  private setSrcError = (event: React.SyntheticEvent<Element>) => {
    this.setState({ srcError: true });
    if (this.props.onError) {
      this.props.onError(event);
    }
  };
}
