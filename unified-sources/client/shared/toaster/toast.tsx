import * as React from "react";
import { Toasty } from "@lib/common-interfaces/toaster";
import { Paragraph, Size } from "../typography";
import { PrimaryButton, ButtonSize, ButtonProps } from "../button/button";
import { IconName } from "../icon/icon";
import { IconSize } from "../common-interfaces";
import { Color } from "../utils/color";
import { UnstyledButton, IconTooltip } from "@root/shared";
import { t } from "@root/lib/i18n";

export interface ToastProps extends Toasty {
  dismissable?: boolean;
  onPerformedAction(): void;
  onDismiss(): void;
  onEnter?(): void;
  onLeave?(): void;
  styles: any;
}

export class Toast extends React.Component<ToastProps, {}> {
  private onClickButton = (event: React.MouseEvent<HTMLButtonElement>) => {
    const { action } = this.props;
    if (typeof action === "function") {
      action(event);
    }

    this.props.onPerformedAction();
  };

  public render() {
    const { styles, onDismiss, dismissable, message, buttonText, action, onEnter, onLeave } = this.props;
    const buttonProps: Partial<ButtonProps> = typeof action === "string" ? { href: action } : { onClick: this.onClickButton };

    return (
      <div
        data-test-id={this.props["data-test-id"]}
        data-test-class={this.props["data-test-class"]}
        className={dismissable ? styles.dismissable : styles.toast}
        role={dismissable ? "status" : "alert"}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        onFocus={onEnter}
        onBlur={onLeave}
      >
        <Paragraph invert className={styles.message} size={Size.Medium}>
          {message}
        </Paragraph>
        {action && buttonText ? (
          <PrimaryButton {...buttonProps} className={styles.button} size={ButtonSize.XSmall}>
            {buttonText}
          </PrimaryButton>
        ) : null}
        {dismissable ? (
          <UnstyledButton onClick={onDismiss} className={styles.close} aria-label="Close">
            <IconTooltip icon={IconName.CloseSmall} size={IconSize.Small} color={Color.White}>
              {t("management:closeButtonText")}
            </IconTooltip>
          </UnstyledButton>
        ) : null}
      </div>
    );
  }
}
