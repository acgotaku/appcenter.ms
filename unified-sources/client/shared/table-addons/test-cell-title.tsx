import * as React from "react";
import { TextHighlight } from "./text-highlight";

const css = require("./test-cell-title.scss");

export interface ITestCellTitleProps extends React.HTMLAttributes<HTMLElement> {
  title: string;
  useHighlight?: boolean;
  styles?: { [key: string]: string };
}

export class TestCellTitle extends React.PureComponent<ITestCellTitleProps, {}> {
  public static defaultProps = { styles: css, useHighlight: false };

  public static textInQuotes: RegExp = /"(.*?)"/;

  public render() {
    return (
      <span className={this.props.styles!["step-text"]}>
        {this.props.useHighlight ? (
          <TextHighlight text={this.props.title} regexPattern={TestCellTitle.textInQuotes} />
        ) : (
          this.props.title
        )}
      </span>
    );
  }
}
