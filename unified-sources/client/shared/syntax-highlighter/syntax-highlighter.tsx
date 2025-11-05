import * as React from "react";
import * as Prism from "prismjs";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-swift";
import "prismjs/components/prism-c";
import "prismjs/components/prism-objectivec";
import "prismjs/components/prism-csharp";
import "prismjs/components/prism-java";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-json";
import "prismjs/components/prism-markup";
import "prismjs/components/prism-yaml";
const css = require("./syntax-highlighter.scss");

export type Language = "javascript" | "java" | "json" | "swift" | "csharp" | "objectivec" | "bash" | "xml" | "yaml";

export interface SyntaxHighlighterProps extends React.HTMLAttributes<HTMLElement> {
  language?: Language;
  code: string;
  inline?: boolean;
  invert?: boolean;
}

export class SyntaxHighlighter extends React.PureComponent<SyntaxHighlighterProps, {}> {
  private element: Element | null = null;

  private highlight() {
    if (this.props.language) {
      const language = Prism.languages[this.props.language];
      if (language) {
        const html = Prism.highlight(this.props.code, language);
        if (this.element) {
          // tslint:disable-next-line:no-inner-html
          this.element.innerHTML = html;
        }
      }
    }
  }

  private extend() {
    Prism.languages.xml = Prism.languages.extend("markup", { string: /msal.*/ });
    Prism.languages.objectivec = Prism.languages.extend("objectivec", { function: /[a-z0-9_]+(?=\()| [a-z0-9_]+(?=\]|:)/i });
  }

  public componentDidMount() {
    this.extend();
    this.highlight();
  }

  public componentDidUpdate(prevProps: SyntaxHighlighterProps) {
    if (prevProps.language !== this.props.language || prevProps.code !== this.props.code) {
      this.highlight();
    }
  }

  public render() {
    const { code, inline, language, className, invert, ...props } = this.props;
    const Tag = inline ? "span" : "div";
    const cn = [className, invert ? css.dark : css.light].join(" ");
    return (
      <Tag ref={(x) => (this.element = x)} {...props} className={cn}>
        {code}
      </Tag>
    );
  }
}
