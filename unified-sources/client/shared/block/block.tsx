import * as React from "react";
import * as PropTypes from "prop-types";
import * as memoize from "memoizee";
import * as classNames from "classnames/bind";
import { Progress, ProgressDirection } from "../progress";
import { createSFC, Color } from "../utils";
import { HeaderArea } from "../header-area";
import { FooterArea } from "../footer-area";
import { HTMLTagNames } from "@lib/common-interfaces/html-tag-names";
import { omit } from "lodash";
const css = require("./block.scss");

export enum MaterialShadow {
  CardSubtle,
  CardIntense,
  OverlaySubtle,
  OverlayMedium,
  OverlayIntense,
}

export enum MaterialBackground {
  None,
  White,
  Gray,
}

/** Standard Block paddings that may or may not be responsive to media queries */
export enum BlockPadding {
  /** Special case for scenarios like padded Grids inside Cards */
  None = "None",
  /** Used for Cards, Tiles, Wells, Dialogs, and other content blocks */
  Default = "Default",
  /** Special value reserved for Panels */
  Panel = "Panel",
  /** Special value reserved for Modals */
  Modal = "Modal",
}

export enum BlockBorderRadius {
  None,
  /** No standard blocks use a small border radius right now */
  Small,
  /** Used for Cards, Tiles, Wells, and Dropdowns */
  Medium,
  /** Used for Dialogs and Modals */
  Large,
}

interface HeroProps {
  hero: JSX.Element | string;
  heroBackground?: string;
}

export interface BlockProps extends Partial<HeroProps>, React.HTMLAttributes<HTMLElement> {
  // Configuration
  shadow?: MaterialShadow;
  background?: MaterialBackground;
  padding?: BlockPadding;
  borderRadius?: BlockBorderRadius;
  bordered?: boolean;
  dividedHeader?: boolean;
  dividedFooter?: boolean;
  tagName?: React.ComponentClass<any> | React.SFC<any> | HTMLTagNames;
  styles?: { [key: string]: string };

  // Content
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children?: React.ReactNode | ((BlockPadding: React.SFC<BlockPaddingProps>) => React.ReactNode);
  loading?: boolean;
}

interface DefaultProps {
  tagName: string;
  styles: any;
  background: MaterialBackground;
  padding: BlockPadding;
  borderRadius: BlockBorderRadius;
}

type BlockPropsWithDefaults = BlockProps & DefaultProps;

export type BlockPaddingProps = React.HTMLAttributes<HTMLElement>;

const Hero: React.SFC<HeroProps> = ({ hero, heroBackground }) => (
  <div className={css.hero} style={heroBackground ? { background: heroBackground } : undefined}>
    {typeof hero === "string" ? <img src={hero} alt="" role="presentation" /> : hero}
  </div>
);
Hero.displayName = "Block.Hero";

export class Block extends React.Component<BlockProps> {
  public static defaultProps = {
    tagName: "div",
    styles: css,
    background: MaterialBackground.White,
    padding: BlockPadding.Default,
    borderRadius: BlockBorderRadius.Medium,
  };

  public static childContextTypes = {
    blockContext: PropTypes.shape({
      padding: PropTypes.oneOf(Object.values(BlockPadding)),
      dividedHeader: PropTypes.bool,
      dividedFooter: PropTypes.bool,
    }),
  };

  public getChildContext() {
    const { padding, dividedHeader, dividedFooter } = this.props;
    return { blockContext: { padding, dividedHeader, dividedFooter } };
  }

  public componentDidUpdate(prevProps: BlockProps) {
    if (process.env.NODE_ENV !== "production") {
      if (prevProps.padding !== this.props.padding) {
        console.warn(
          `\`Block\` changed padding from \`${prevProps.padding}\` to \`${this.props.padding}\`. ` +
            `Padding gets propagated down through context, so a PureComponent might prevent descendants ` +
            `from getting the updated value.`
        );
      }
      if (prevProps.dividedHeader !== this.props.dividedHeader) {
        console.warn(
          `\`Block\` changed \`dividedHeader\` from ${prevProps.dividedHeader} to ${this.props.dividedHeader}. ` +
            `Padding gets propagated down through context, so a PureComponent might prevent descendants ` +
            `from getting the updated value.`
        );
      }
      if (prevProps.dividedFooter !== this.props.dividedFooter) {
        console.warn(
          `\`Block\` changed \`dividedFooter\` from ${prevProps.dividedFooter} to ${this.props.dividedFooter}. ` +
            `Padding gets propagated down through context, so a PureComponent might prevent descendants ` +
            `from getting the updated value.`
        );
      }
    }
  }

  public static getBlockPaddingComponent = memoize(
    (withHeader: boolean, dividedHeader: boolean, padding: BlockPadding, withFooter: boolean, dividedFooter: boolean) => {
      return createSFC<BlockPaddingProps>(`BlockPadding.${padding}`, css, () =>
        classNames.call(css, "block-padding", {
          flush: withHeader && !dividedHeader,
          paddingDefault: padding === BlockPadding.Default,
          paddingPanel: padding === BlockPadding.Panel,
          paddingModal: padding === BlockPadding.Modal,
        })
      );
    }
  );

  public render() {
    const {
      shadow,
      background,
      bordered,
      borderRadius,
      dividedHeader,
      className,
      padding,
      header,
      children,
      styles,
      dividedFooter,
      footer,
      hero,
      heroBackground,
      tagName: TagName,
      ...passthrough
    }: Omit<BlockPropsWithDefaults, "tReady" | "loading"> = omit(this.props as BlockPropsWithDefaults, "tReady", "loading");
    const BlockPadding = Block.getBlockPaddingComponent(header != null, !!dividedHeader, padding, footer != null, !!dividedFooter);

    const childContent = typeof children === "function" ? children(BlockPadding) : children;
    const classes = classNames.call(styles, className, "block", {
      borderRadiusSmall: borderRadius === BlockBorderRadius.Small,
      borderRadiusMedium: borderRadius === BlockBorderRadius.Medium,
      borderRadiusLarge: borderRadius === BlockBorderRadius.Large,
      backgroundWhite: background === MaterialBackground.White,
      backgroundGray: background === MaterialBackground.Gray,
      shadowNoneBordered: shadow == null && bordered,
      shadowCardSubtle: shadow === MaterialShadow.CardSubtle && !bordered,
      shadowCardIntense: shadow === MaterialShadow.CardIntense && !bordered,
      shadowCardSubtleBordered: shadow === MaterialShadow.CardSubtle && bordered,
      shadowCardIntenseBordered: shadow === MaterialShadow.OverlayIntense && bordered,
      shadowOverlaySubtle: shadow === MaterialShadow.OverlaySubtle,
      shadowOverlayMedium: shadow === MaterialShadow.OverlayMedium,
      shadowOverlayIntense: shadow === MaterialShadow.OverlayIntense,
    });

    return (
      <TagName className={classes} {...passthrough}>
        {"loading" in this.props ? (
          <Progress loading={!!this.props.loading} color={Color.Blue} direction={ProgressDirection.Below} />
        ) : null}
        {hero ? <Hero hero={hero} heroBackground={heroBackground} /> : null}
        {typeof header === "string" || typeof header === "number" ? <HeaderArea title={String(header)} /> : header}
        {typeof children === "function" ? childContent : childContent ? <BlockPadding>{children}</BlockPadding> : null}
        {typeof footer === "string" || typeof footer === "number" ? <FooterArea>{footer}</FooterArea> : footer}
      </TagName>
    );
  }
}
