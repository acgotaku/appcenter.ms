import * as React from "react";
import * as PropTypes from "prop-types";
import { uniqueId } from "lodash";
import { Input, InputProps, InputSize } from "../input";
import { Paragraph, TextColor, Size } from "../typography";

const cx = require("classnames");
const css = require("./leading-text-input.scss");

export interface LeadingTextInputProps extends InputProps {
  containerProps: React.HTMLAttributes<HTMLElement>;
  leadingText: string;
  size: InputSize;
}

interface LeadingTextInputState {
  focus: boolean;
}

/**
 * Creates an input element with an uneditable `leadingText` before the "input" box.
 */
export class LeadingTextInput extends React.Component<LeadingTextInputProps, LeadingTextInputState> {
  public input: Input | null = null;
  public static displayName = "LeadingTextInput";

  public static propTypes: React.ValidationMap<LeadingTextInputProps> = {
    leadingText: PropTypes.string.isRequired,
    containerProps: PropTypes.object.isRequired,
  };

  public static defaultProps = {
    leadingText: null,
    containerProps: {},
    size: InputSize.Normal,
  };

  constructor(props: LeadingTextInputProps) {
    super(props);
    this.state = { focus: false };
  }

  /**
   * This is here solely to make it work with Formsy.
   * Returns the current value of the actual HTML input in the DOM.
   * @returns {string}
   */
  public getValue = (defaultValue: string) => {
    const value = this.input ? this.input.getValue(defaultValue) : null;
    return value || (typeof defaultValue !== "undefined" ? defaultValue : "");
  };

  public getClipboardData = () => {
    return (this.props.leadingText || "") + this.getValue("");
  };

  /**
   * Solely here to make this work with Formsy.
   * Resets the value of the input element.
   */
  public resetValue = () => {
    if (this.input) {
      this.input.resetValue();
    }
  };

  public render() {
    const { size, disabled } = this.props;
    const { focus } = this.state;
    const {
      styles,
      containerProps,
      leadingText,
      id,
      label,
      description,
      icon,
      ...props
    } = this.props; /** remove when we need icon support */
    const className = cx(css.wrapper, css[InputSize[size].toLowerCase()], containerProps.className, { [css.focused]: focus });
    const wrapperProps = Object.assign({}, containerProps, { disabled: disabled, tabIndex: disabled ? undefined : -1 });
    const wrapperId = id || uniqueId();

    return (
      <div>
        {label && (
          <label id={`label-${wrapperId}`} htmlFor={wrapperId} className={css.label}>
            {label}
          </label>
        )}
        <div {...wrapperProps} className={className} onFocus={(event) => this.input && this.input.focus()}>
          <div>{leadingText}</div>
          <Input
            ref={(ref: any) => (this.input = ref)}
            type="text"
            id={wrapperId}
            clipboardData={this.getClipboardData}
            {...props}
            onFocus={this._onFocus}
            onBlur={this._onBlur}
          />
        </div>
        {description && (
          <Paragraph.asLabel color={TextColor.Secondary} size={Size.Small} id={`description-${wrapperId}`} htmlFor={wrapperId}>
            {description}
          </Paragraph.asLabel>
        )}
      </div>
    );
  }

  private _onFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    const { onFocus } = this.props;

    this.setState({
      focus: true,
    });

    if (typeof onFocus === "function") {
      onFocus(event);
    }
  };

  private _onBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    const { onBlur } = this.props;

    this.setState({
      focus: false,
    });

    if (typeof onBlur === "function") {
      onBlur(event);
    }
  };
}
