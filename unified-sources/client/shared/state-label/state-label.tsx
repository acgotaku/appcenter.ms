import * as React from "react";
import * as classNames from "classnames";
import { StatusIconState } from "@lib/constants/icon-name";
import { Text, TextProps, TextColor, Size } from "../typography";

const css = require("./state-label.scss");
export { StatusIconState };

export interface StateLabelProps extends Partial<TextProps>, React.HTMLAttributes<HTMLElement> {
  text: string;
  status?: StatusIconState;
  roundedCorners?: boolean;
  color?: TextColor;
}

type DefaultProps = {
  status: StatusIconState;
  size: Size;
  roundedCorners: boolean;
  ellipsize: boolean;
};

type StateLabelPropsWithDefaultProps = StateLabelProps & DefaultProps;

export class StateLabel extends React.Component<StateLabelProps, {}> {
  public static defaultProps: StateLabelProps = {
    text: "",
    size: 0,
    status: StatusIconState.None,
    roundedCorners: false,
    ellipsize: true,
  };

  public render() {
    const { text, size, status, roundedCorners, ellipsize, ...passthrough } = this.props as StateLabelPropsWithDefaultProps;

    const stateClassName: string = this.classNameForStatus(status);
    const className = classNames(this.props.className, css["state-label"], css[stateClassName], {
      [css["rounded-corners"]]: roundedCorners,
    });

    return (
      <Text {...passthrough} className={className} size={size} ellipsize={ellipsize}>
        {text}
      </Text>
    );
  }

  private classNameForStatus(status: StatusIconState): string {
    const statusIconState = StatusIconState[status];
    const prefix = "state-";
    switch (status) {
      case StatusIconState.Distributed:
        return prefix + "succeeded";
      case StatusIconState.Error:
        return prefix + "failed";
      default:
        return prefix + (statusIconState ? statusIconState.toString().toLowerCase() : "none");
    }
  }
}
