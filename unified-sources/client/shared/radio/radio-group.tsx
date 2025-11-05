import * as React from "react";
import { observable } from "mobx";
import { observer } from "mobx-react";
import { RadioGroupContext, radioGroupContextTypes } from "./radio-group-context";
import { noop, uniqueId } from "lodash";
const css = require("./radio-group.scss");
const classNames = require("classnames");

export interface RadioGroupProps {
  value?: string | number;
  name?: string;
  onChange?(value: string | number, event: React.ChangeEvent<HTMLInputElement>): void;
  defaultValue?: string | number;
  disabled?: boolean;
  horizontal?: boolean;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  [key: string]: any;
}

@observer
export class RadioGroup extends React.Component<RadioGroupProps, { value?: string | number }> {
  public static defaultProps = {
    onChange: noop,
    disabled: false,
    styles: css,
  };

  public static childContextTypes = radioGroupContextTypes;

  private onChange = (value: string | number, event: React.ChangeEvent<HTMLInputElement>) => {
    if (!this.isControlled) {
      this.setState({ value });
    }
    this.props.onChange!(value, event);
  };

  private uniqName = uniqueId("radio-group-");

  private childContext = {
    radioGroupContext: (() => {
      const self = this;
      return observable<RadioGroupContext["radioGroupContext"]>({
        get name() {
          return self.name;
        },
        get groupValue() {
          return self.value;
        },
        get groupDisabled() {
          return self.props.disabled!;
        },
        get onChange() {
          return self.onChange;
        },
      });
    })(),
  };

  public state = { value: this.isControlled ? undefined : this.props.defaultValue };

  public getChildContext() {
    return this.childContext;
  }

  private get isControlled() {
    return this.props.hasOwnProperty("value");
  }

  get name() {
    return this.props.name || this.uniqName;
  }

  get value() {
    const source = this.isControlled ? this.props : this.state;
    return source.value;
  }

  public resetValue() {
    if (!this.isControlled) {
      this.setState({ value: this.props.defaultValue });
    }
  }

  /**
   * This is here solely to make it work with Formsy.
   * Returns the current value of the actual HTML input in the DOM.
   * @returns {string}
   */
  public getValue(defaultValue: string) {
    return this.value || (typeof defaultValue !== "undefined" ? defaultValue : "");
  }

  /**
   * Renders a RadioGroup component
   * @returns {JSX.Element} RadioGroup component
   */
  public render(): JSX.Element {
    const { defaultChecked, defaultValue, onChange, value, styles, horizontal, className, ...passthrough } = this.props;

    return (
      <div
        role="radiogroup"
        {...passthrough}
        className={classNames(className, styles["radio-group"], horizontal && styles.horizontal)}
      >
        {this.props.children}
      </div>
    );
  }
}
