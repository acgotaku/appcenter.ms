import * as React from "react";
import { FakeButton } from "../fake-button";
import { Block, BlockProps, BlockPadding, MaterialBackground } from "../block";

export interface WellProps extends React.HTMLAttributes<HTMLElement> {
  header?: BlockProps["header"];
  dividedHeader?: BlockProps["dividedHeader"];
  bordered?: boolean;
  withoutPadding?: boolean;
  tagName?: BlockProps["tagName"];
}

export class Well extends React.Component<WellProps> {
  public static defaultProps = {
    bordered: true,
  };

  public render() {
    const { withoutPadding, tagName, ...props } = this.props;
    const isNavigable = !!props.onClick;
    const tag = tagName || (isNavigable ? FakeButton : "div");

    return (
      <Block
        tagName={tag}
        background={MaterialBackground.Gray}
        padding={withoutPadding ? BlockPadding.None : BlockPadding.Default}
        {...props}
      />
    );
  }
}
