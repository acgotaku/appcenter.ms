import * as React from "react";
import * as PropTypes from "prop-types";
import { uniqueId } from "lodash";
import { Icon, IconName, IconSize, IconArea } from "../icon/icon";
import { Input, InputProps, InputSize } from "../input";
import { StatusColor, TextColor } from "../utils";
import { Paragraph, Size } from "../typography";

const cx = require("classnames");
const css = require("./trailing-text-input.scss");

export interface TrailingTextInputProps extends InputProps {
  containerProps: React.HTMLAttributes<HTMLElement>;
  trailingText: string;
  size: InputSize;
  valid?: boolean;
  loading?: boolean;
  dirty?: boolean;
}

interface TrailingTextInputState {
  focus: boolean;
}

/**
 * Maps InputSize to IconSize
 */
const iconSize: { [key: number]: number } = {
  [InputSize.Small]: IconSize.Small,
  [InputSize.Normal]: IconSize.XMedium,
  [InputSize.Large]: IconSize.Medium,
};

/**
 * Creates an input element with an uneditable `trailingText` after the "input" box.
 */
export class TrailingTextInput extends React.Component<TrailingTextInputProps, TrailingTextInputState> {
  public input: Input | null = null;
  public static displayName = "TrailingTextInput";

  public static propTypes: React.ValidationMap<TrailingTextInputProps> = {
    trailingText: PropTypes.string.isRequired,
    containerProps: PropTypes.object.isRequired,
  };

  public static defaultProps = {
    trailingText: null,
    containerProps: {},
    size: InputSize.Normal,
  };

  constructor(props: TrailingTextInputProps) {
    super(props);
    this.state = { focus: false };
  }

  /**
   * This is here solely to make it work with Formsy.
   * Returns the current value of the actual HTML input in the DOM.
   * @returns {string}
   */
  public getValue(defaultValue: string) {
    const value = this.input ? this.input.getValue(defaultValue) : null;
    return value || (typeof defaultValue !== "undefined" ? defaultValue : "");
  }

  /**
   * Solely here to make this work with Formsy.
   * Resets the value of the input element.
   */
  public resetValue() {
    if (this.input) {
      this.input.resetValue();
    }
  }

  public render() {
    const { size, disabled } = this.props;
    const { focus } = this.state;
    const {
      styles,
      containerProps,
      trailingText,
      id,
      label,
      description,
      icon,
      copyable,
      showClearButton,
      valid,
      invalid,
      loading,
      dirty,
      ...props
    } = this.props;
    const className = cx(css.wrapper, css[InputSize[size].toLowerCase()], containerProps.className, {
      [css.focused]: focus,
      [css.invalid]: invalid,
    });
    const wrapperProps = Object.assign({}, containerProps, { disabled: disabled, tabIndex: disabled ? undefined : -1 });
    const wrapperId = id || uniqueId();

    let iconName;
    let iconColor;
    let descriptionColor;
    if (loading) {
      iconName = IconName.Loading;
      iconColor = StatusColor.Gray;
      descriptionColor = TextColor.Secondary;
    } else {
      iconColor = valid ? StatusColor.Green : StatusColor.Red;
      iconName = valid ? IconName.Check : IconName.Warning;
    }

    if (dirty) {
      descriptionColor = TextColor.Secondary;
    } else {
      if (!loading) {
        descriptionColor = valid ? TextColor.Secondary : TextColor.Danger;
      }
    }

    return (
      <div>
        {label && (
          <label id={`label-${wrapperId}`} htmlFor={wrapperId} className={css.label}>
            {label}
          </label>
        )}
        <div {...wrapperProps} className={className} onFocus={() => this.input && this.input.focus()}>
          <Input
            ref={(ref: any) => (this.input = ref)}
            type="text"
            id={wrapperId}
            aria-labelledby={label ? `label-${wrapperId}` : undefined}
            aria-describedby={description ? `description-${wrapperId}` : undefined}
            {...props}
            onFocus={this.handleOnFocus}
            onBlur={this.handleOnBlur}
          />
          <div>
            {trailingText}
            <Icon
              icon={iconName}
              color={iconColor}
              size={iconSize[size]}
              area={IconArea.Relaxed}
              className={cx(css.icon, { [css.hidden]: dirty })}
            />
          </div>
        </div>
        {description && (
          <Paragraph.asLabel color={descriptionColor} size={Size.Small} id={`description-${wrapperId}`} htmlFor={wrapperId}>
            {description}
          </Paragraph.asLabel>
        )}
      </div>
    );
  }

  private handleOnFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    const { onFocus } = this.props;

    this.setState({
      focus: true,
    });

    if (typeof onFocus === "function") {
      onFocus(event);
    }
  };

  private handleOnBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    const { onBlur } = this.props;

    this.setState({
      focus: false,
    });

    if (typeof onBlur === "function") {
      onBlur(event);
    }
  };
}
