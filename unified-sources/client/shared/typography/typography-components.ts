import * as React from "react";
import * as classNames from "classnames/bind";
import { Space, spaceAboveClassNames, spaceBelowClassNames, spaceLeftClassNames } from "../common-interfaces";
import { TextColor, createSFC } from "../utils";
import { HTMLTagNames } from "@lib/common-interfaces/html-tag-names";
const { createElement } = React;
const css = require("../styles/utils.scss");

export enum Size {
  /**
   * Title: 14px / 20px
   */
  XSmall,
  /**
   * Paragraph: 14px / 20px,
   * Title: 20px / 24px
   */
  Small,
  /**
   * Paragraph: 15px / 20px,
   * Header: 34px / 40px,
   * Title: 24px / 28px
   */
  Medium,
  /**
   * Paragraph: 18px / 24px,
   * Title: 28px / 40px
   */
  Large,
  XLarge,
}

export enum TextAlignment {
  Left = "align-left",
  Center = "align-center",
  Right = "align-right",
}

export interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  size: Size;
  color?: TextColor;
  invert?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  bold?: boolean;
  italic?: boolean;
  uppercase?: boolean;
  capitalize?: boolean;
  ellipsize?: boolean;
  align?: TextAlignment;
  breakWord?: boolean;
  preWhiteSpace?: boolean;
  spaceAbove?: Space;
  spaceBelow?: Space;
  spaceLeft?: Space;
  tagName?: HTMLTagNames | React.ComponentClass<any>;
}

const sizes: { [K in Size]: string } = {
  [Size.XSmall]: "xs",
  [Size.Small]: "s",
  [Size.Medium]: "m",
  [Size.Large]: "l",
  [Size.XLarge]: "xl",
};

const omitProps: (keyof TypographyProps)[] = [
  "invert",
  "color",
  "underline",
  "strikethrough",
  "bold",
  "italic",
  "uppercase",
  "capitalize",
  "size",
  "ellipsize",
  "preWhiteSpace",
  "align",
  "breakWord",
  "spaceAbove",
  "spaceBelow",
  "spaceLeft",
];
const createTypographyComponent = <T extends TypographyProps>(
  displayName: string,
  stylePrefix: string,
  defaultTag: string,
  defaultProps?: Partial<TypographyProps>
) => {
  const SFC = createSFC<T & React.HTMLAttributes<HTMLElement>>(
    displayName,
    css,
    ({
      size,
      color,
      invert,
      bold,
      italic,
      uppercase,
      capitalize,
      underline,
      strikethrough,
      ellipsize,
      preWhiteSpace,
      align,
      breakWord,
      spaceAbove,
      spaceBelow,
      spaceLeft,
    }) =>
      classNames.call(
        css,
        spaceAboveClassNames[spaceAbove!],
        spaceBelowClassNames[spaceBelow!],
        spaceLeftClassNames[spaceLeft!],
        `${stylePrefix}-${sizes[size]}`,
        `${TextColor[color!].toLowerCase()}-text${invert ? "-invert" : ""}`,
        align,
        {
          bold: bold !== undefined ? bold : defaultProps && defaultProps.bold,
          italic,
          uppercase,
          capitalize,
          underline,
          strikethrough,
          ellipsize,
          preWhiteSpace,
          wordwrap: breakWord,
        }
      ),
    omitProps,
    {
      tagName: defaultProps?.tagName || defaultTag,
      color: TextColor.Primary,
    } as any
  );

  const asLabel = (() => {
    const WrapperSFC: React.SFC<T & React.LabelHTMLAttributes<HTMLLabelElement>> = (props: any) =>
      createElement(SFC, { ...props, tagName: "label" });
    WrapperSFC.displayName = `${displayName}.asLabel`;
    return WrapperSFC;
  })();

  return Object.assign(SFC, { asLabel });
};

export interface HeadingProps extends TypographyProps {
  size: Size.Medium;
}

export interface TitleProps extends TypographyProps {
  size: Size.XSmall | Size.Small | Size.Medium | Size.Large;
}

export interface ParagraphProps extends TypographyProps {
  size: Size.Small | Size.Medium | Size.Large;
}

export interface TextProps extends TypographyProps {
  size: Size.Small | Size.Medium | Size.Large;
}

export const Heading = createTypographyComponent<HeadingProps>("Header", "header", "div");
export const Title = createTypographyComponent<TitleProps>("Title", "title", "h2", { bold: true });
export const TitleH3 = createTypographyComponent<TitleProps>("TitleH3", "title", "h3", { bold: true });
export const Paragraph = createTypographyComponent<ParagraphProps>("Paragraph", "paragraph", "div");
export const Text = createTypographyComponent<TextProps>("Text", "inline-text", "span");
export { TextColor, Space };
