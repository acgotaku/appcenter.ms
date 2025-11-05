import * as React from "react";
import { Link } from "react-router";
import { omit, noop } from "lodash";
import * as classNames from "classnames";
import { Color, ButtonColor } from "../utils";
import { Icon, IconName, iconReadableName, IconProps, IconSize, IconArea } from "../icon";
import { CopyProps, Copy } from "../copy";
import { shiftsRightAsLastChildInToolbar } from "../header-area";
import { ImageLike } from "../common-interfaces";
import { t } from "@root/lib/i18n";
import { Keys } from "../utils/keys";
import { HTMLTagNames } from "@lib/common-interfaces/html-tag-names";
import { replaceSpacesWithDashes } from "@root/lib/utils/strings";
const css = require("./button.scss");
const ariaIgnore = { role: "presentation", "aria-hidden": true };

/**
 * Enumeration of Button sizes
 */
export enum ButtonSize {
  XSmall,
  Small,
  Normal,
  Large,
}

/**
 * Props a Button component should include
 */
export interface ButtonProps<T = HTMLButtonElement | HTMLAnchorElement>
  extends React.ButtonHTMLAttributes<T>,
    React.AnchorHTMLAttributes<T> {
  /** Controls the amount of padding and the text size of the button. */
  size?: ButtonSize;
  color?: ButtonColor;
  icon?: IconName | ImageLike;
  /** Describes button children, used primarily by DropdownButton. */
  label?: string;
  /** For supported button sizes, renders the icon in the smaller of the two supported different icon sizes. */
  smallerIcon?: boolean;
  /** @internal */ styles?: any;
  /** @internal */ active?: boolean;
  /** Renders the button grayed out, and disables pointer-events on it. */
  disabled?: boolean;
  /** Renders an “open in new window” icon to the right of the button text. */
  newWindowIcon?: boolean;
  /** Disables clicks and renders an animated striped background. */
  progress?: boolean;
  /** Passed to the HTMLButtonElement. Use `type="submit"` inside forms. */
  type?: string;
  /** Renders the button stylistically similar to an Input, i.e., white and with a border. */
  input?: boolean;
  /** Renders the button as text without a background, similar to an unstyled link. */
  subtle?: boolean;
  target?: string;
  /** Passed through to react-router `Link` for internal navigation. */
  to?: any;
  /** Passed through to the HTMLAnchorElement for external navigation. */
  href?: string;
  /** Causes the button text to be aligned to the left rather than centered. */
  alignLeft?: boolean;
  /** @internal */ tagName?: string;
  ellipsize?: boolean;
  // What will be read by the screenreader when the button is in the "loading" state after it was clicked
  loadingAriaLabel?: string;
  /** Whether the button should be hidden until it is focused (by accessing it with a keyboard). Useful for example for the "skip link"
  which lets keyboard/screen-reader users skip right to the main content */
  hiddenUntilFocus?: boolean;
  /* This can be used when we need to change the default focus outline color, for example when the background is a similar color and so
      the contrast wouldn't be sufficient unless we use white color
  */
  whiteOutline?: boolean;
  /* When this is true, the label element on the button will be aria-hidden - this is useful when the button is a part
    of a bigger component, which already references the label as it's aria-labelledby. Otherwise, screenreaders would announce the label twice. */
  labelHidden?: boolean;
}

const iconSizes: { [buttonSize: number]: { size: IconSize; smallerSize: IconSize; area?: IconArea } } = {
  [ButtonSize.XSmall]: { size: IconSize.XSmall, smallerSize: IconSize.XXSmall },
  [ButtonSize.Small]: { size: IconSize.Small, smallerSize: IconSize.XSmall },
  [ButtonSize.Normal]: { size: IconSize.Small, smallerSize: IconSize.Small },
  [ButtonSize.Large]: { size: IconSize.Medium, smallerSize: IconSize.Medium, area: IconArea.Normal },
};

/**
 * Base Button component
 */
export class Button extends React.Component<ButtonProps, {}> {
  public static defaultProps = {
    size: ButtonSize.Normal,
    type: "button",
    styles: css,
  };

  private get tagName(): HTMLTagNames {
    const { tagName, type, href } = this.props;
    if (tagName) {
      return tagName;
    }
    if (type && type.toLowerCase() === "submit") {
      return "button";
    }
    if (href) {
      return "a";
    }
    return "button";
  }

  private handleSpacebarPress = (events) => {
    const { charCode } = events;
    if (charCode === Keys.Space) {
      events.target.click();
    }
  };

  /**
   * Renders a Button component
   * @returns {JSX.Element} Button component
   */
  public render(): JSX.Element {
    const {
      size,
      color,
      active,
      disabled,
      newWindowIcon,
      progress,
      styles,
      input,
      subtle,
      alignLeft,
      children,
      label,
      to,
      type,
      smallerIcon,
      ellipsize,
      tagName,
      hiddenUntilFocus,
      whiteOutline,
      ...passthrough
    } = this.props;

    /**
     * CSS class name(s) applied to the HTML button element
     * @constant {string}
     */
    const className = classNames(
      this.props.className,
      styles.button,
      color && !input && !subtle ? styles[Color[color].toLowerCase()] : null,
      styles[ButtonSize[size!].toLowerCase()],
      {
        [styles.active]: active,
        [styles.disabled]: disabled,
        [styles.progress]: progress,
        [styles.inputLike]: input,
        [styles.subtle]: subtle,
        [styles.buttonLike]: !input && !subtle,
        [styles.ellipsize]: ellipsize,
      },
      input ? styles.input : null,
      hiddenUntilFocus ? styles.hiddenUntilFocus : null,
      whiteOutline ? css.whiteOutline : css.normalOutline
    );

    let icon: ImageLike | null;
    let openNewWindowIcon: ImageLike | null = null;
    const iconSize = iconSizes[size!];
    const ariaConf = this.props.children ? ariaIgnore : null;

    if (progress) {
      icon = (
        <Icon
          data-test-id="button-loading-icon"
          key="icon"
          size={smallerIcon ? iconSize.smallerSize : iconSize.size}
          area={iconSizes[size!].area}
          icon={IconName.Loading}
          {...ariaConf}
        />
      ) as React.ComponentElement<IconProps, Icon>;
    } else if (typeof this.props.icon === "string") {
      icon = (
        <Icon
          key="icon"
          size={smallerIcon ? iconSize.smallerSize : iconSize.size}
          area={iconSizes[size!].area}
          icon={this.props.icon}
          {...ariaConf}
        />
      ) as React.ComponentElement<IconProps, Icon>;
    } else {
      icon = this.props.icon || null;
    }

    if (newWindowIcon && !progress) {
      openNewWindowIcon = (
        <Icon key="open" size={IconSize.XXSmall} area={iconSizes[IconSize.XXSmall].area} icon={IconName.OpenInNew} {...ariaConf} />
      ) as React.ComponentElement<IconProps, Icon>;
    }

    const Tag = this.tagName;
    const props = {
      ...passthrough,
      className,
      "data-test-class": classNames("button", passthrough["data-test-class"]),
      ...(disabled || progress ? { onClick: noop, "aria-disabled": !progress, tabIndex: -1, to: undefined } : null),
      ...(progress
        ? {
            "aria-label": this.props.loadingAriaLabel || "loading",
          }
        : null),
    };

    const wrapper = (
      <div
        className={classNames(styles.wrapper, {
          [styles["align-left"]]: alignLeft,
          [styles["wrapper-text-color"]]: typeof this.props.icon === "string" || progress,
        })}
      >
        {icon}
        {children ? (
          <span key="content" className={styles.content}>
            {label && (
              <span className={styles.label} id={`button-label-${replaceSpacesWithDashes(label)}`} aria-hidden={props.labelHidden}>
                {`${label}:`}&nbsp;
              </span>
            )}
            {children}
          </span>
        ) : null}
        {openNewWindowIcon}
      </div>
    );

    const tagProps = omit(props, "role");

    if (to) {
      return (
        <Link {...tagProps} to={to} onKeyPress={this.handleSpacebarPress} role={props.role || "button"}>
          {wrapper}
        </Link>
      );
    }
    if (Tag === "a") {
      return (
        <a {...props} onKeyPress={this.handleSpacebarPress}>
          {wrapper}
        </a>
      );
    }
    if (Tag === "button") {
      return (
        <button {...props} type={type}>
          {wrapper}
        </button>
      );
    }
    return (
      <Tag {...tagProps} role={props.role || "button"}>
        {wrapper}
      </Tag>
    );
  }
}

/**
 * Button component used for default or recommended actions
 */
export class PrimaryButton extends React.Component<ButtonProps, {}> {
  public render() {
    return (
      <Button color={Color.Blue} {...this.props}>
        {this.props.children}
      </Button>
    );
  }
}

/**
 * Button component used for actions that are less-commonly performed
 */
export class SecondaryButton extends React.Component<ButtonProps, {}> {
  public render() {
    return <Button {...omit(this.props, "color")}>{this.props.children}</Button>;
  }
}

/**
 * Button component used to navigate back to a previous set of data
 */
export class BackButton extends React.Component<ButtonProps, {}> {
  public static defaultProps = { styles: css };
  public render() {
    const { styles } = this.props;
    const className = classNames(styles.back, this.props.className);
    return (
      <Button icon={IconName.ButtonChevronLeft} {...this.props} className={className}>
        {this.props.children || t("button.back")}
      </Button>
    );
  }
}

/**
 * Button component used to navigate forward to a new set of data
 */
export class NextButton extends React.Component<ButtonProps, {}> {
  public static defaultProps = { styles: css };
  public render() {
    const { styles } = this.props;
    const className = classNames(styles.next, this.props.className);
    return (
      <Button icon={IconName.ButtonChevronRight} {...this.props} className={className}>
        {this.props.children || t("button.next")}
      </Button>
    );
  }
}

export interface DropdownButtonProps extends ButtonProps {
  error?: boolean;
}
export class DropdownButton extends React.Component<DropdownButtonProps, {}> {
  public static defaultProps = { styles: css };
  public render() {
    const { styles, error } = this.props;

    const icon = (() => {
      switch (true) {
        case typeof this.props.icon === "string":
          return <Icon className={this.props.styles.icon} icon={this.props.icon as IconName} {...ariaIgnore} />;
        case !!this.props.icon:
          const imagelike = this.props.icon as ImageLike; // TypeScript
          return React.cloneElement(imagelike, {
            className: classNames(imagelike.props.className, this.props.styles.icon),
          }) as ImageLike;
        default:
          return null;
      }
    })();

    const passthrough = omit(this.props, "icon", "error", "role");
    const className = classNames(styles[error ? "dropdown-error" : "dropdown"], this.props.className);
    const tagName = "div";
    return (
      <Button icon={IconName.ButtonExpandMore} tagName={tagName} {...passthrough} className={className} role="combobox">
        {icon}
        {this.props.children}
      </Button>
    );
  }
}

@shiftsRightAsLastChildInToolbar
export class ClickableIcon extends React.Component<ButtonProps & { large?: boolean }, {}> {
  public static defaultProps: Partial<ButtonProps & { large?: boolean }> = { styles: css, large: false };
  public render() {
    const { disabled, styles, icon, large } = this.props;
    const className = classNames(this.props.className, styles[!disabled ? "clickable-icon" : "disabled-clickable-icon"]);
    const iconPassed = typeof icon === "string" ? <Icon icon={icon} size={large ? IconSize.Small : IconSize.XSmall} /> : icon;
    const label = this.props.label || (typeof icon === "string" ? iconReadableName[icon] : undefined);
    const passthrough = omit(this.props, "large");
    return <Button aria-label={label} {...passthrough} icon={iconPassed} className={className} />;
  }
}

export class LinkButton extends React.Component<ButtonProps & { danger?: boolean }, {}> {
  public static defaultProps = { styles: css };
  public render() {
    const { styles, danger } = this.props;
    const passthrough = omit(this.props, "danger");
    const className = classNames(styles[danger ? "danger-link" : "link"], this.props.className);

    return <Button {...passthrough} className={className} />;
  }
}

export class CopyButton extends React.Component<CopyProps & ButtonProps, {}> {
  public static defaultProps = { styles: css };
  public render() {
    const { className, styles, ...props } = this.props;
    const passthrough = omit(props, "icon") as CopyProps & ButtonProps;
    return (
      <Copy {...passthrough}>
        <Button aria-label="Copy to clipboard" icon={IconName.Copy} className={className} styles={styles} />
      </Copy>
    );
  }
}

/**
 * Returns true if the given element is one of the button types.
 * **Please remember to update this if you add a button.**
 */
export function isButton(element: React.ReactElement<any>) {
  return (
    element.type === Button ||
    element.type === PrimaryButton ||
    element.type === SecondaryButton ||
    element.type === BackButton ||
    element.type === NextButton ||
    element.type === DropdownButton ||
    element.type === ClickableIcon ||
    element.type === LinkButton
  );
}
