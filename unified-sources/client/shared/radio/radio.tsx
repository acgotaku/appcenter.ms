import * as React from "react";
import { uniqueId } from "lodash";
import * as classNames from "classnames/bind";
import { radioGroupContextTypes, RadioGroupContext } from "./radio-group-context";
const css = require("./radio.scss");

export interface Attribute {
  [key: string]: string;
}

/**
 * Props a Radio component should include
 */
export interface RadioProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string | number;
  label?: string;
  disabled?: boolean;
  styles?: any;
  // Prevent these props from being passed
  name?: void & string;
  defaultChecked?: void & boolean;
  checked?: void & boolean;
  onChange?: void & React.ChangeEventHandler<any>;
  isRequired?: boolean;
}

export class Radio extends React.Component<RadioProps, {}> {
  public static contextTypes = radioGroupContextTypes;
  public static defaultProps = { styles: css };

  public context!: RadioGroupContext;
  private id = uniqueId("radio-");
  private input: HTMLInputElement | null = null;

  get labelId(): string | undefined {
    if (this.props.children) {
      return `label-${this.id}`;
    }
  }

  get ariaAttributes(): Attribute | undefined {
    const { children, label } = this.props;
    const attribute = {};
    switch (true) {
      case !!label:
        attribute["aria-label"] = label;
        return attribute;
      case !!children:
        attribute["aria-labelledby"] = this.labelId;
        return attribute;
      default:
        return undefined;
    }
  }

  private get labelProps(): Attribute | undefined {
    if (this.props.children && this.labelId) {
      return {
        id: this.labelId,
      };
    }
  }

  private onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.context.radioGroupContext.onChange(this.props.value, event);
  };

  public render(): JSX.Element {
    const { children, value, disabled, styles, className, isRequired } = this.props;
    const { groupValue, name, groupDisabled } = this.context.radioGroupContext;
    const checked = value === groupValue;
    const Tag = children ? "label" : "span";
    return (
      <div className={classNames(className, styles.radioContainer)} data-test-class="radio">
        <input
          ref={(x) => (this.input = x)}
          type="radio"
          name={name}
          onChange={this.onChange}
          value={value}
          checked={checked}
          required={isRequired}
          aria-checked={checked}
          disabled={disabled || groupDisabled}
          {...this.ariaAttributes}
        />
        <Tag
          onClick={() => this.input && this.input.click()}
          {...this.labelProps}
          className={styles.radio}
          data-test-class="radio-label"
        >
          {children}
        </Tag>
      </div>
    );
  }
}
