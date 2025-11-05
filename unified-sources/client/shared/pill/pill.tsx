import * as React from "react";
import * as classNames from "classnames";
import { Color, TextColor, Keys } from "../utils";
import { Text, Size } from "../typography";
import { Icon, IconArea, IconName, IconSize, UnstyledButton } from "@root/shared";

const css = require("./pill.scss");

export interface PillProps extends React.HTMLAttributes<HTMLElement> {
  color?: Color.Red | Color.Amber | Color.Gray | Color.Blue | Color.Green;
  subtle?: boolean;
  styles?: { [key: string]: string };
  closeButton?: boolean;
  closeButtonAriaLabel?: string;
  onClickClose?: React.MouseEventHandler<HTMLButtonElement>;
  tabIndex?: number;
}

type DefaultProps = {
  color: Color.Red | Color.Amber | Color.Gray | Color.Blue | Color.Green;
  styles: { [key: string]: string };
};

export const Pill = class Pill extends React.Component<PillProps & DefaultProps, {}> {
  public static defaultProps: DefaultProps = { styles: css, color: Color.Gray };

  handleDeleteKeyPress = (event) => {
    if (event.keyCode === Keys.Delete || event.keyCode === Keys.Enter || event.keyCode === Keys.Space) {
      if (this.props.onClickClose) {
        this.props.onClickClose(event);
      }
    }
  };

  closeButton = () => {
    const { closeButton, onClickClose, closeButtonAriaLabel } = this.props;
    if (!closeButton) {
      return null;
    }

    return (
      <UnstyledButton aria-label={closeButtonAriaLabel} onClick={onClickClose} className={css.closeButton} tabIndex={-1}>
        <Icon color={TextColor.Secondary} area={IconArea.Normal} size={IconSize.XXSmall} icon={IconName.Close} />
      </UnstyledButton>
    );
  };

  public render() {
    const { styles, children, className, subtle, color, tabIndex, ...props } = this.props;
    const { onClickClose, closeButtonAriaLabel, closeButton, ...passthrough } = props;
    // const invert = color === Color.Red;
    const invert = color === Color.Red || color === Color.Blue;
    const cn = classNames(
      styles.tag,
      className,
      {
        [styles.interactive]: this.props.onClick,
        [styles.buttonized]: this.props.closeButton,
        [styles.subtle]: subtle,
      },
      styles[Color[color].toLowerCase()]
    );
    return (
      <Text
        size={Size.Small}
        className={cn}
        invert={invert}
        {...passthrough}
        onKeyDown={this.handleDeleteKeyPress}
        tabIndex={tabIndex ?? -1}
      >
        {children}
        {this.closeButton()}
      </Text>
    );
  }
} as React.ComponentClass<PillProps>;
