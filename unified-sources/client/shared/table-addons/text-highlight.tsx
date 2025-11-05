import * as React from "react";

const css = require("./text-highlight.scss");

export interface ITextHighlightProps extends React.HTMLAttributes<HTMLElement> {
  text: string;
  regexPattern: RegExp;
  styles?: { [key: string]: string };
}

export class TextHighlight extends React.PureComponent<ITextHighlightProps, {}> {
  public static defaultProps = { styles: css };

  public shouldHighlight(index: number): boolean {
    return !!(index % 2);
  }

  public getHighlightedText = (text: string): JSX.Element => {
    const splitText = text.split(this.props.regexPattern);
    return (
      <span>
        {splitText.map((t: string, i: number) => (
          <span key={`highlight-${i}`} className={this.shouldHighlight(i) ? this.props.styles!["highlight"] : ""}>
            {t}
          </span>
        ))}
      </span>
    );
  };

  public render() {
    return this.getHighlightedText(this.props.text);
  }
}
