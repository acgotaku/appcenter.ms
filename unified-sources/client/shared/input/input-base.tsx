import * as React from "react";
import { noop } from "lodash";
import { TestProps } from "../common-interfaces";
const classNames = require("classnames");
const css = require("./input.scss");

export enum InputVariant {
  Default,
  Card,
  Borderless,
}

export enum InputSize {
  Small,
  Normal,
  Large,
}

export interface InputBaseProps extends React.InputHTMLAttributes<HTMLInputElement>, TestProps {
  size?: InputSize;
  styles?: { [key: string]: string };
  variant?: InputVariant;
  inputRef?: (element: HTMLInputElement) => void;
}

export class InputBase extends React.Component<InputBaseProps, {}> {
  public static defaultProps = {
    variant: InputVariant.Default,
    size: InputSize.Normal,
    styles: css,
    inputRef: noop,
  };

  private setRef = (ref) => {
    if (this.props.inputRef) {
      this.props.inputRef(ref);
    }
  };

  public render() {
    const { size, className, styles, variant, inputRef, ...passthrough } = this.props;

    const classList: string = classNames(className, styles![InputSize[size!].toLowerCase()], {
      [styles!.card]: variant === InputVariant.Card,
      [styles!.borderless]: variant === InputVariant.Borderless,
    });

    return <input {...passthrough} className={classList} ref={this.setRef} />;
  }
}
