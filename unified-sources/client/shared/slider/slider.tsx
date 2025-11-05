import * as React from "react";
import * as classNames from "classnames";
import { Text, Size } from "../typography";
import { Color } from "../utils/color";
import { pick, uniqueId } from "lodash";
import { Omit } from "@lib/common-interfaces";
const css = require("./slider.scss");

interface Attribute {
  [key: string]: any;
}

/**
 * Props a Slider component should include
 */
export interface SliderProps extends Omit<React.HTMLAttributes<HTMLElement>, "onChange"> {
  value: number;
  valueLabel?: string;
  name?: string;
  max?: number;
  min?: number;
  step?: number;
  disabled?: boolean;
  id?: string;
  color?: Color.DarkGreen | Color.Green | Color.Violet | Color.DarkViolet | Color.Blue | Color.Gray;
  onChange(value: number, event: React.ChangeEvent<HTMLInputElement>): void;
  styles?: { [key: string]: string };
}

type DefaultProps = {
  valueLabel: string;
  max: number;
  min: number;
  color: Color.DarkGreen | Color.Green | Color.Violet | Color.DarkViolet | Color.Blue | Color.Gray;
  styles: { [key: string]: string };
};

type SliderPropsWithDefaultProps = SliderProps & DefaultProps;

export class Slider extends React.Component<SliderProps, {}> {
  public static defaultProps = {
    styles: css,
    valueLabel: "",
    min: 0,
    max: 100,
    color: Color.Blue,
  };

  private labelId: string = uniqueId("label-");

  private get ariaAttributes(): Attribute {
    const { value, min, max } = this.props;
    const restAttributes = pick(this.props, "aria-label", "aria-describedby");
    return {
      "aria-valuemax": max,
      "aria-valuemin": min,
      "aria-valuenow": value.toString(),
      "aria-labelledby": this.props["aria-labelledby"] || this.labelId,
      ...restAttributes,
    };
  }

  public onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.props.onChange(event.currentTarget.valueAsNumber, event);
  };

  public render() {
    const { name, value, valueLabel, min, max, disabled, step, className, styles, id, color, onChange, ...passthrough } = this
      .props as SliderPropsWithDefaultProps;
    const thumbRadius = parseInt(styles.thumbRadius, 10);

    return (
      <div {...passthrough} className={classNames(className, styles["wrapper"])}>
        <div className={styles.input}>
          <input
            {...this.ariaAttributes}
            className={classNames(styles.slider, styles[`${Color[color].toLowerCase()}-slider`])}
            type="range"
            name={name}
            id={id}
            onChange={this.onChange}
            min={min}
            max={max}
            value={value.toString()}
            step={step}
            disabled={disabled}
            data-test-class="input"
          />
          <div
            className={classNames(styles.trackFilled, styles[`${Color[color].toLowerCase()}-track`])}
            style={{ width: `calc(${(value - min) / (max - min)} * (100% - ${2 * thumbRadius}px))` }}
          >
            {" "}
          </div>
        </div>
        {valueLabel ? (
          <Text data-test-class="label" id={this.labelId} size={Size.Medium} className={styles.label}>
            {valueLabel}
          </Text>
        ) : null}
      </div>
    );
  }
}
