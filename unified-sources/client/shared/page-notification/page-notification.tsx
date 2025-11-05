import * as React from "react";
import { NotificationType } from "@lib/common-interfaces";
import { IconSize } from "../common-interfaces";
import { Button, ButtonProps, ButtonSize } from "../button/button";
import { Icon, IconName } from "../icon/icon";
import { LiveRegion } from "../live-region";
import { Color, ButtonColor } from "../utils/color";
const css = require("./page-notification.scss");
const classNames = require("classnames");
const { cloneElement } = React;

const buttonColor: { [key: number]: ButtonColor } = {
  [NotificationType.Error]: Color.Red,
  [NotificationType.Warning]: Color.DarkGray,
  [NotificationType.Info]: Color.Blue,
  [NotificationType.Success]: Color.Green,
};

const iconColor: { [key: number]: Color } = {
  [NotificationType.Error]: Color.Red,
  [NotificationType.Warning]: Color.Gray,
  [NotificationType.Info]: Color.Blue,
  [NotificationType.Success]: Color.Green,
};

const icon: { [key: number]: IconName } = {
  [NotificationType.Error]: IconName.StatusFailed,
  [NotificationType.Warning]: IconName.StatusError,
  [NotificationType.Info]: IconName.InfoFilled,
  [NotificationType.Success]: IconName.StatusPassed,
};

export interface PageNotificationProps {
  type: NotificationType;
  button?: string | React.ReactElement<ButtonProps>;
  styles?: any;
  onAction?: React.EventHandler<React.MouseEvent<HTMLButtonElement>>;
  fullWithContent?: boolean;
}

/**
 * @deprecated
 * Use MessageBar to communicate status specific to the current page; use toasts (`notify()`) in response to user actions.
 */
export class PageNotification extends React.Component<PageNotificationProps, {}> {
  public static defaultProps = { styles: css };

  private renderButton() {
    const { button, type, onAction } = this.props;
    if (typeof button === "string") {
      return (
        <Button size={ButtonSize.Small} color={buttonColor[type]} onClick={onAction}>
          {button}
        </Button>
      );
    } else {
      return cloneElement(button!, {
        size: ButtonSize.Small,
        color: buttonColor[type],
        onClick: button!.props.onClick || onAction,
      } as ButtonProps);
    }
  }

  public render() {
    const { styles, type, button, children, fullWithContent } = this.props;
    const color = iconColor[type];
    const textClassName = classNames(styles.text, fullWithContent && styles.fullWidthText);
    return (
      <div className={styles[NotificationType[type].toLowerCase()]}>
        <div className={styles.content}>
          <Icon size={IconSize.Small} color={color} icon={icon[type]} />
          <LiveRegion role="alert" data-test-class="page-notification" className={textClassName}>
            {children}
          </LiveRegion>
        </div>
        {button ? <div className={styles.buttonContainer}>{this.renderButton()}</div> : null}
      </div>
    );
  }
}

export { NotificationType };
