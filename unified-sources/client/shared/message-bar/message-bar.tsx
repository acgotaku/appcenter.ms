import * as React from "react";
import { IconSize } from "../common-interfaces";
import { NotificationType } from "@lib/common-interfaces";
import { Button, ButtonProps, ButtonSize } from "../button/button";
import { ButtonContainer } from "../button-container/button-container";
import { LiveRegion } from "../live-region";
import { Icon, IconName, IconProps } from "../icon/icon";
import { Color, ButtonColor } from "../utils";
import { Card } from "../card";
import { Well } from "../well";
import * as classNames from "classnames";
import { Stretch } from "../stretch";
import { Markdown } from "../markdown";

const css = require("./message-bar.scss");

/**
 * Mapping between notification type and action button color.
 */
const actionButtonColor: { [key: number]: ButtonColor | undefined } = {
  [NotificationType.Error]: Color.Red,
  [NotificationType.Warning]: undefined,
  [NotificationType.Info]: undefined,
};

/**
 * Mapping between notification type and icon color.
 */
const iconColor: { [key: number]: Color } = {
  [NotificationType.Error]: Color.Red,
  [NotificationType.Warning]: Color.Amber,
  [NotificationType.Info]: Color.Blue,
};

/**
 * Mapping between notification type and icon name.
 */
const iconName: { [key: number]: IconName } = {
  [NotificationType.Error]: IconName.StatusFailedOutline,
  [NotificationType.Warning]: IconName.Warning,
  [NotificationType.Info]: IconName.Info,
};

/**
 * Enumeration of icon alignment
 */
export enum IconAlignment {
  Top,
  Middle,
  Bottom,
}

export type InjectedButtonProps = Pick<ButtonProps, "size" | "color">;

export interface MessageBarProps {
  /** The name of the container component. Defaults to Card. */
  container?: "Card" | "Well";
  /** Render action buttons under the message */
  multiline?: boolean;
  /** The type of the notification. Acts as a preset controling the icon, button color, and background color. */
  type?: NotificationType.Info | NotificationType.Error | NotificationType.Warning;
  /** Renders a custom image (overriding the default icon provided by `type`) on the left of the Card. */
  image?: string | null;
  /** Renders a custom icon (overriding the default provided by `type`) on the left of the Card. */
  icon?: React.ReactElement<IconProps>;
  /** The text of the action button to display in the Card. Not compatible with `renderActionButton`, which can be used for more customization. */
  actionButtonText?: string;
  /** The `onClick` handler of the action button, if an action button is displayed. Not compatible with `renderActionButton`. */
  onAction?: React.MouseEventHandler<HTMLButtonElement>;
  /** Customizes the rendering of the action button. Size and color props are passed to your function, and must be passed to a Button for correct rendering. */
  renderActionButton?: (props: InjectedButtonProps) => JSX.Element;
  /** The text of the dismiss button to display in the Card. Not compatible with `renderDismissButton`, which can be used for more customization. */
  dismissButtonText?: string;
  /** The `onClick` handler of the dismiss button, if a dismiss button is displayed. Not compatible with `renderDismissButton`. */
  onDismiss?: React.MouseEventHandler<HTMLButtonElement>;
  /** Customizes the rendering of the action button. Size and color props are passed to your function, and must be passed to a Button for correct rendering. */
  renderDismissButton?: (props: InjectedButtonProps) => JSX.Element;
  /** Controls the visibility of the MessageBar with an animated transition. */
  visible?: boolean;
  /** Renders the component slighlty smaller. */
  compact?: boolean;
  /** Renders markdown */
  markdown?: boolean;
  /** Aligns icon when not `multiline`. Default is vertical middle. */
  alignIcon?: IconAlignment;
  /** Use filled in info icon */
  infoIconFilled?: boolean;
  /** Emphasize the color of the background */
  emphasizedBackground?: boolean;
  /** @internal */
  styles?: any;
  /** @internal */
  className?: string;
  withoutBorderRadius?: boolean;
}

/**
 * A MessageBar is a component used to display brief messages to the user, with optional call to actions.
 * It communicates a state that affects the current page or section, not the entire system.
 *
 * MessageBars stay visible indefinitely while in the page, but may include a “Dismiss” action that hides it.
 *
 * Custom MessageBars may include a rich content, with a title and illustration.
 */
export class MessageBar extends React.Component<MessageBarProps, {}> {
  public static defaultProps: Partial<MessageBarProps> = {
    styles: css,
    visible: true,
    compact: false,
    type: NotificationType.Info,
    container: "Card",
    alignIcon: IconAlignment.Middle,
  };

  /**
   * Return `true` if the MessageBar is a notification message bar. Return `false` otherwise.
   */
  private get isNotificationMessageBar(): boolean {
    return this.props.image == null && this.props.icon == null;
  }

  /**
   * Render the action button.
   */
  private renderActionButton() {
    const { actionButtonText, onAction, type, renderActionButton } = this.props;
    return this.renderButton(
      actionButtonText || renderActionButton || "",
      this.isNotificationMessageBar ? actionButtonColor[type!] : undefined,
      onAction
    );
  }

  /**
   * Render the dismiss button.
   */
  private renderDismissButton() {
    const { dismissButtonText, onDismiss, renderDismissButton } = this.props;
    return this.renderButton(dismissButtonText || renderDismissButton || "", undefined, onDismiss);
  }

  /**
   * Render a button.
   *
   * @param {string | React.ReactElement<ButtonProps>} button button to render. It can a string or a <Button /> component.
   * @param {ButtonColor} color color to use for the button.
   * @param {React.EventHandler<React.MouseEvent<HTMLButtonElement>>} onClick onClick function for the button.
   */
  private renderButton(
    button: string | ((props: InjectedButtonProps) => JSX.Element),
    color?: ButtonColor,
    onClick?: React.MouseEventHandler<HTMLButtonElement>
  ) {
    const buttonProps: InjectedButtonProps = { size: ButtonSize.Small, color };
    if (typeof button === "string") {
      return (
        <Button {...buttonProps} onClick={onClick}>
          {button}
        </Button>
      );
    } else {
      return button(buttonProps);
    }
  }

  public render() {
    const {
      styles,
      type,
      actionButtonText,
      dismissButtonText,
      renderActionButton,
      renderDismissButton,
      children,
      compact,
      visible,
      image,
      icon,
      container,
      markdown,
      multiline,
      className,
      alignIcon,
      infoIconFilled,
      emphasizedBackground,
      withoutBorderRadius,
    } = this.props;
    const Tag = { Card, Well }[container!] || Card;
    const wrapperClassName = classNames(
      this.isNotificationMessageBar ? styles[NotificationType[type!].toLowerCase()] || "" : null,
      compact ? styles.compact : styles.normal,
      className,
      {
        [styles.withIllustration]: image,
        [styles.withoutImage]: image === null,
        [styles.markdown]: markdown,
      },
      this.isNotificationMessageBar && type === NotificationType.Info && emphasizedBackground ? styles.infoEmphasized : null
    );
    const color = iconColor[type!];
    const heading = (() => {
      if (image) {
        return <img alt="" className={styles.illustration} role="presentation" src={image} />;
      } else if (icon) {
        return icon;
      } else if (image === null) {
        return null;
      } else {
        const finalIcon = type === NotificationType.Info && infoIconFilled ? IconName.InfoFilled : iconName[type!];
        return <Icon size={IconSize.Small} color={color} icon={finalIcon} />;
      }
    })();
    const iconAlignment = (() => {
      if (!multiline && alignIcon === IconAlignment.Top) {
        return styles.alignIconTop;
      } else if (!multiline && alignIcon === IconAlignment.Bottom) {
        return styles.alignIconBottom;
      } else {
        return null;
      }
    })();

    const liveRegionClassName = classNames(styles.liveRegion, multiline && styles.multiline, iconAlignment);

    return visible ? (
      <Tag
        withoutBorderRadius={withoutBorderRadius}
        withoutPadding
        bordered={false}
        className={wrapperClassName}
        data-test-id="message-bar"
      >
        <LiveRegion tagName={Stretch} role="alert" className={liveRegionClassName}>
          <div className={styles.content}>
            {heading}
            {markdown && typeof children === "string" ? (
              <Markdown className={styles.text}>{children}</Markdown>
            ) : (
              <div className={styles.text} data-test-class="message-bar-text">
                {children}
              </div>
            )}
          </div>
          {actionButtonText || dismissButtonText || renderActionButton || renderDismissButton ? (
            <ButtonContainer className={styles.buttonContainer}>
              {dismissButtonText || renderDismissButton ? this.renderDismissButton() : null}
              {actionButtonText || renderActionButton ? this.renderActionButton() : null}
            </ButtonContainer>
          ) : null}
        </LiveRegion>
      </Tag>
    ) : null;
  }
}
