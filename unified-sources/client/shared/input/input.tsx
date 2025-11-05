import * as React from "react";
import { noop, uniqueId } from "lodash";
import { Icon, IconName } from "../icon/icon";
import { ClickableIcon, CopyButton, ButtonSize } from "../button/button";
import { IconSize, ImageLike } from "../common-interfaces";
import { InputVariant, InputSize, InputBaseProps, InputBase } from "./input-base";
const classNames = require("classnames");
const css = require("./input.scss");
import { globalUIStore, NavigationMode } from "@root/stores/global-ui-store";

export interface AriaAttribute {
  [key: string]: string;
}

export interface InputProps extends InputBaseProps {
  autoFocus?: boolean;
  copyable?: boolean;
  clipboardData?: string | (() => string);
  onCopied?: () => void;
  label?: string;
  emphasized?: boolean;
  icon?: IconName | ImageLike;
  placeholder?: string;
  description?: string;
  showClearButton?: boolean;
  onClear?(event: Event): void;
  containerClassName?: string;
  invalid?: boolean;
  copiedMessage?: boolean;
  darkPlacholder?: boolean;
  required?: boolean;
}

interface DefaultProps {
  variant: InputVariant;
  size: InputSize;
  onChange: (...args: any[]) => void;
  onClear: (...args: any[]) => void;
  styles: any;
}

type InputPropsWithDefaultProps = InputProps & DefaultProps;

/**
 * Input component state
 */
export interface InputState {
  value?: string;
}

/**
 * Maps InputSize to IconSize
 */
const iconSize: { [key: number]: number } = {
  [InputSize.Small]: IconSize.Small,
  [InputSize.Normal]: IconSize.Small,
  [InputSize.Large]: IconSize.Medium,
};

/**
 * Base Input component
 */
export class Input<PropsT extends InputProps = InputProps> extends React.Component<PropsT, InputState> {
  /**
   * Unique identifier
   * @type {string}
   */
  public id: string;
  public input: HTMLInputElement | null = null;
  public isClickingClear: boolean = false;

  public static defaultProps = {
    variant: InputVariant.Default,
    size: InputSize.Normal,
    onChange: noop,
    onClear: noop,
    styles: css,
  };

  /**
   * Input component state
   * @type {InputState}
   */
  public state: InputState = {
    value: undefined,
  };

  /**
   * Creates an instance of Input with a unique identifier
   * @param {InputProps} props
   */
  constructor(props: PropsT) {
    super(props);
    this.id = uniqueId();
  }

  private get isControlled() {
    return this.props.hasOwnProperty("value");
  }

  private get value() {
    return this.isControlled ? this.props.value : this.state.value;
  }

  private get isFilled() {
    return Boolean(this.value);
  }

  /**
   * Generates identifier for an Input’s associated label
   * @returns {string}
   */
  public static genLabelId(id: string) {
    return `label-${id}`;
  }

  /**
   * Generates identifier for an Input’s associated description
   * @returns {string}
   */
  public static genDescriptionId(id: string) {
    return `desc-${id}`;
  }

  /**
   * Gets unique identifier for an Input’s associated label
   * @returns {string}
   */
  public getLabelId(): string {
    const { id = this.id } = this.props;
    return Input.genLabelId(id);
  }

  /**
   * Gets unique identifier for an Input’s associated description
   * @returns {string}
   */
  public getDescriptionId(): string {
    const { id = this.id } = this.props;
    return Input.genDescriptionId(id);
  }

  /**
   * Gets ARIA attribute for an Input’s accessible name
   * @returns {AriaAttribute}
   */
  public getAriaAttribute(): AriaAttribute | null {
    const { label, placeholder, description } = this.props;
    const attribute = {};
    switch (true) {
      case !!description:
        attribute["aria-describedby"] = this.props["aria-describedby"] || this.getDescriptionId();
      case !!label:
        attribute["aria-labelledby"] = this.isFilled ? this.props["aria-labelledby"] || this.getLabelId() : null;
      case !!placeholder:
        attribute["aria-label"] = this.props["aria-labelledby"] || label ? null : this.props["aria-label"] || placeholder; // placeholder as a last resort
        return attribute;
      default:
        return null;
    }
  }

  /**
   * This is here solely to make it work with Formsy.
   * Returns the current value of the actual HTML input in the DOM.
   * @returns {string}
   */
  public getValue(defaultValue?: string) {
    const value = this.input ? this.input.value : null;
    return value || (typeof defaultValue !== "undefined" ? defaultValue : "");
  }

  /**
   * Focus HTMLInputElement
   */
  public focus() {
    if (this.input) {
      this.input.focus();
    }
  }

  /**
   * Solely here to make this work with Formsy.
   * Resets the value of the input element.
   */
  public resetValue() {
    const value = "";

    if (this.input) {
      this.input.value = value;
    }

    if (!this.isControlled) {
      this.setState({ value });
    }
  }

  public onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.currentTarget.value;
    if (!this.isControlled) {
      this.setState({ value });
    }

    this.props.onChange!(event);
  };

  private onClear = (event: Event) => {
    if (!this.isControlled) {
      this.resetValue();
    }

    this.props.onClear!(event);
    this.focus();
    this.isClickingClear = false;
  };

  private onBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    // If you're clicking clear, then don't call the onBlur passed by your parents.
    // This is so that we treat clear button as a first-class citizen and a part of the `Input` component.
    // Thus, clicking clear button shouldn't make Input lose focus.
    if (!this.isClickingClear && this.props.onBlur) {
      this.props.onBlur(event);
    } else {
      event.stopPropagation();
      event.preventDefault();
    }
  };

  private onClearButtonMouseDown = (event: React.MouseEvent<HTMLElement>) => {
    this.isClickingClear = true;
  };

  /**
   * Conditionally focus HTML input element when component is mounted.
   */
  public componentDidMount() {
    if (this.props.autoFocus && globalUIStore.navigationMode === NavigationMode.Mouse) {
      this.focus();
    }
  }

  private setRef = (ref) => {
    this.input = ref;
  };

  /**
   * Renders an Input component
   * @returns {JSX.Element} Input component
   */
  public render() {
    const { size, id = this.id, styles } = this.props as InputPropsWithDefaultProps;

    const {
      label,
      emphasized,
      icon: iconFromProps,
      className,
      containerClassName,
      onClear,
      showClearButton: isShowClearButton,
      description,
      children,
      copyable,
      clipboardData = this.value as string,
      onCopied,
      autoFocus,
      role,
      invalid,
      ...otherProps
    } = this.props as InputPropsWithDefaultProps;

    const showClearButton = isShowClearButton && onClear !== noop;
    const clearButtonIsVisible = showClearButton && this.isFilled;
    const wrapperClassNames = classNames(this.props.containerClassName, {
      [styles["icon-wrapper"]]: iconFromProps,
      [styles["clear-wrapper"]]: showClearButton,
      [styles["copy-button-wrapper"]]: this.props.copyable,
    });

    /**
     * Props not specifically handled by Input
     * These should be passed through to the HTML input element
     * @constant {*}
     */
    const passthrough = Object.assign(
      {},
      otherProps,
      {
        className: classNames(this.props.className, {
          [styles.filled]: this.isFilled,
          [styles.clearable]: showClearButton,
          [styles.invalid]: this.props.invalid,
          [styles.darkPlaceholder]: typeof this.props.darkPlacholder === "undefined" ? !this.props.label : this.props.darkPlacholder,
        }),
        inputRef: this.setRef,
        onChange: this.onChange,
        onBlur: this.onBlur,
        id,
      },
      this.getAriaAttribute()
    );

    const icon = (() => {
      switch (true) {
        case typeof iconFromProps === "string":
          return <Icon key={1} icon={iconFromProps as IconName} size={iconSize[size]} className={styles.icon} />;
        case !!iconFromProps:
          const imagelike = iconFromProps as ImageLike;
          return React.cloneElement(imagelike, {
            key: 1,
            className: classNames(imagelike.props.className, styles.icon),
          } as { className?: string } & React.Attributes) as ImageLike;
        default:
          return null;
      }
    })();

    const requiredClass = this.props.required ? styles.required : undefined;

    return (
      <div role={role}>
        {label ? (
          <label
            id={this.getLabelId()}
            htmlFor={id}
            className={classNames(styles.label, requiredClass, { [styles.emphasized]: emphasized })}
          >
            {label}
          </label>
        ) : null}
        <div className={wrapperClassNames}>
          <InputBase {...passthrough} aria-labelledby={this.getLabelId()} />
          {icon}
          {showClearButton ? (
            <ClickableIcon
              key={2}
              disabled={!clearButtonIsVisible}
              size={ButtonSize.XSmall}
              icon={IconName.Close}
              onMouseDown={this.onClearButtonMouseDown}
              onClick={(event: React.MouseEvent<HTMLElement>) => this.onClear(event.nativeEvent)}
              className={styles.clear}
            />
          ) : null}
          {copyable ? (
            <CopyButton
              key={3}
              clipboardData={clipboardData}
              onCopied={onCopied}
              className={styles["copy-button"]}
              data-test-class="input-copy-button"
            />
          ) : null}
        </div>
        {description ? (
          <div id={this.getDescriptionId()} className={styles.description}>
            {description}
          </div>
        ) : null}
      </div>
    );
  }
}
