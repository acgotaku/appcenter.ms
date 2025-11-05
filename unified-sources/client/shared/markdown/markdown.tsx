import * as React from "react";
import * as ReactMarkdown from "react-markdown";
import { Link } from "react-router";
import { kebabCase, deburr } from "lodash";
import { SyntaxHighlighter, Well, Code, CodeBlock, Language } from "@root/shared";
import { MessageBar } from "../message-bar";
const remarkGfm = require("remark-gfm");

const css = require("./markdown.scss");

const languageAliases = {
  js: "javascript",
  ts: "typescript",
  tsx: "jsx",
};

const renderers = {
  code: ({ language, value }) => (
    <Well className={css.codeBlock}>
      <pre>
        <code>
          <SyntaxHighlighter code={value} language={languageAliases[language] || language} />
        </code>
      </pre>
    </Well>
  ),
  inlineCode: ({ children }) => <Code>{children}</Code>,
  link: ({ href, children }) => {
    // We're going to make an assumtion that all absolute URLs are pointing to "external"
    // resources (i.e. not something that is React routable) and set a target of "_blank"
    const isAbsolute = new RegExp("([a-z]+://|//)", "i");

    if (isAbsolute.test(href)) {
      return (
        <a href={href} target="_blank">
          {children}
        </a>
      );
    } else if (href.startsWith("#")) {
      return <a href={href}>{children}</a>;
    }

    return <Link to={href}>{children}</Link>;
  },
};

function getTextChildren(children: React.ReactChildren | React.ReactChild) {
  return React.Children.map(children, (child) =>
    typeof child === "object" ? getTextChildren(child.props.children) : child.toString()
  ).join(" ");
}

const makeLinkifiedHeadingRenderer = ({ removeH1 }: Pick<MarkdownProps, "removeH1">) => ({
  heading: ({ children, level }: { children: string; level: number }) => {
    if (removeH1 && level === 1) {
      return null;
    }

    const slug = kebabCase(deburr(getTextChildren(children)))
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-{2,}/g, "");
    const TagName: any = `h${level}`;
    return (
      <TagName className={css.heading} id={slug}>
        <a href={`#${slug}`} className={css.linkIcon}>
          <img src={require("./link-icon.svg")} />
        </a>
        {children}
      </TagName>
    );
  },
});

const copyableCodeRenderer = {
  code: ({ language, value }) => {
    const langWithOpts = (language || "bash:").split(":");
    // Don't actually care what the second argument is for "bash" language, just always assume
    // it means no terminal
    const lang = langWithOpts[0] as Language;
    const terminal = langWithOpts[0] === "bash" && langWithOpts.length === 1;

    if (language === "info") {
      return (
        <MessageBar container="Well" markdown className={css.padded}>
          {value || ""}
        </MessageBar>
      );
    } else {
      return <CodeBlock language={lang} terminal={terminal} code={value || ""} />;
    }
  },
};

export interface MarkdownProps {
  children: string;
  className?: string;
  linkifyHeadings?: boolean;
  removeH1?: boolean;
  copyableCode?: boolean;
}

export const Markdown: React.FunctionComponent<MarkdownProps> = ({ className, children, linkifyHeadings, copyableCode, removeH1 }) => {
  const compiledRenderers = {
    ...renderers,
    ...(copyableCode ? copyableCodeRenderer : null),
    ...(linkifyHeadings ? makeLinkifiedHeadingRenderer({ removeH1 }) : null),
  };

  return (
    <ReactMarkdown
      plugins={[remarkGfm]}
      className={[css.markdown, className].join(" ")}
      source={children}
      renderers={compiledRenderers}
    />
  );
};
