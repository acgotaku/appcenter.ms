import * as React from "react";
import * as PropTypes from "prop-types";
import { Skeletal } from "../skeleton/skeleton";
const requiredIf = require("react-required-if");
const classNames = require("classnames");
const css = require("./info-label.scss");

export interface InfoLabelProps extends Skeletal, React.HTMLAttributes<HTMLElement> {
  label?: string;
  value?: string | React.ReactNode;
  constrainWidth?: boolean;
  styles?: any;
  uppercase?: boolean;
  withMargin?: boolean;
  canWrap?: boolean;
}

export class InfoLabel extends React.Component<InfoLabelProps, {}> {
  public static propTypes: React.ValidationMap<InfoLabelProps> = {
    label: requiredIf(PropTypes.string, (props) => !props.skeleton),
    value: requiredIf(PropTypes.node, (props) => !props.skeleton),
  };

  public static defaultProps = { styles: css, uppercase: false, withMargin: true };

  public render() {
    const { label, value, constrainWidth, styles, uppercase, skeleton, withMargin, canWrap, ...props } = this.props;
    if (skeleton) {
      const className = classNames(this.props.className, styles.infoLabelSkeleton, {
        [styles.ConstrainWidth]: constrainWidth,
        [styles.noMargin]: !withMargin,
      });
      return (
        <div {...props} className={className}>
          <div className={styles.labelSkeleton} />
          <div className={styles.valueSkeleton} />
        </div>
      );
    }

    const className = classNames(this.props.className, styles.infoLabel, {
      [styles.constrainWidth]: constrainWidth,
      [styles.noMargin]: !withMargin,
    });

    const labelClassNames = classNames(styles.value, { [styles["can-wrap"]]: canWrap });

    return (
      <div {...props} className={className} data-test-class="info-label">
        <div className={uppercase ? styles.labelUppercase : styles.label} data-test-class="info-label-label">
          {label}
        </div>
        <div className={labelClassNames} data-test-class="info-label-value">
          {value}
        </div>
      </div>
    );
  }
}
