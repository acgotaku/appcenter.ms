import * as React from "react";
import { SyntaxHighlighter, Language } from "../syntax-highlighter/syntax-highlighter";
import { Card } from "../card/card";
import { ClickableIcon } from "../button/button";
import * as classNames from "classnames";
import { Color } from "../utils/color";
import { IconName, IconSize, Icon } from "../icon";
import { Tooltip } from "../tooltip";
import { Copy } from "../copy/copy";
import { Stretch } from "../stretch/stretch";
import { t } from "@root/lib/i18n";
import { Trigger } from "../trigger";
const css = require("./code-block.scss");

export interface CodeBlockProps extends React.HTMLAttributes<HTMLElement> {
  code: string;
  language?: Language;
  terminal?: boolean;
  onCopy?(): void;
}

export class CodeBlock extends React.Component<CodeBlockProps, {}> {
  public static defaultProps = {
    terminal: false,
  };

  public renderTerminalCode() {
    const lines = this.props.code.trim().split("\n");

    return (
      <div>
        {lines.map((line, index) => (
          <div key={index} className={css.terminal}>
            {line}
          </div>
        ))}
      </div>
    );
  }

  public render() {
    const { language, code, terminal } = this.props;
    const className = classNames(this.props.className, css["code-block"], terminal ? css.dark : null);
    const buttonColor = terminal ? Color.White : Color.Gray;
    const codeContainer = terminal ? this.renderTerminalCode() : <SyntaxHighlighter code={code} language={language} />;

    return (
      <Card className={className} withoutPadding>
        <Stretch>
          <div className={css.code}>{codeContainer}</div>
          <Copy clipboardData={code} copiedMessage={t("codeBlock.copiedMessage")}>
            <Tooltip>
              <Trigger>
                <ClickableIcon
                  aria-label={t("codeBlock.copyBtnLabel")}
                  icon={<Icon icon={IconName.Copy} size={IconSize.XSmall} color={buttonColor} />}
                  onClick={this.props?.onCopy}
                />
              </Trigger>
              {t("codeBlock.copyBtnLabel")}
            </Tooltip>
          </Copy>
        </Stretch>
      </Card>
    );
  }
}

export interface CodeProps extends React.HTMLAttributes<HTMLElement> {
  language?: Language;
  terminal?: boolean;
  code?: string;
  children?: string;
}

export class Code extends React.Component<CodeProps, {}> {
  public static defaultProps = {
    terminal: false,
  };

  public render() {
    const { children, code = children, terminal, language, ...props } = this.props;
    const className = classNames(
      this.props.className,
      css["inline-code-block"],
      terminal ? css.dark : css.light,
      terminal ? css.terminal : null
    );

    return (
      <span data-test-class="platform-code" {...props} className={className}>
        {language ? <SyntaxHighlighter code={code!} language={language} /> : code}
      </span>
    );
  }
}
