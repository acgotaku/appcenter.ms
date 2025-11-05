import * as React from "react";
import * as cx from "classnames";
import { Trigger } from "../trigger";
import { IconName, Icon, IconSize, IconArea } from "../icon";
import { ButtonProps, Button, ButtonSize } from "./button";
import { MenuProps } from "../menu/menu";
import { ButtonColor } from "../utils";

const styles = require("./split-dropdown-button.scss");

type InjectedButtonProps = Partial<ButtonProps>;
type InjectedMenuProps = Partial<MenuProps>;

export interface SplitDropdownButtonProps extends React.HTMLAttributes<HTMLElement> {
  size?: ButtonSize;
  color?: ButtonColor;
  renderButton?: (primaryButtonProps: InjectedButtonProps) => JSX.Element;
  renderMenu?: (menuProps: InjectedMenuProps, getTrigger: (menuButtonProps?: InjectedButtonProps) => JSX.Element) => JSX.Element;
}

export const SplitDropdownButton: React.FunctionComponent<SplitDropdownButtonProps> = (props: SplitDropdownButtonProps) => {
  const { className, size, color, renderButton, renderMenu } = props;
  const primaryButtonProps = {
    className: styles.primaryAction,
    size,
    color,
  };

  const menuProps = {
    className: styles.menu,
    preferRight: true,
  };

  const menuButtonProps = {
    className: cx(styles.secondaryAction, styles[ButtonSize[size!].toLowerCase()]),
    "aria-label": "Open dropdown menu",
    size,
    color,
    smallerIcon: true,
    icon: (
      <Icon
        icon={IconName.ButtonExpandMore}
        area={IconArea.Compact}
        size={size === ButtonSize.XSmall ? IconSize.XSmall : IconSize.Small}
      />
    ),
  };

  return (
    <div className={cx(className, styles.container)}>
      {renderButton ? renderButton(primaryButtonProps) : null}
      {renderMenu
        ? renderMenu(menuProps, (buttonProps: InjectedButtonProps = {}) => (
            <Trigger>
              <Button {...menuButtonProps} {...buttonProps} />
            </Trigger>
          ))
        : null}
    </div>
  );
};

SplitDropdownButton.defaultProps = {
  size: ButtonSize.Normal,
};
