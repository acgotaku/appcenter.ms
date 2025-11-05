import { HTMLTagNames } from "@lib/common-interfaces/html-tag-names";
import { SETTINGS_CARD_HEADING_PREFIX } from "@lib/constants/dom";
import { t } from "@root/lib/i18n";
import { replaceSpacesWithDashes } from "@root/lib/utils/strings";
import {
  Color,
  Icon,
  IconArea,
  IconName,
  IconSize,
  PanelPosition,
  Pill,
  Size,
  Text,
  TextColor,
  Title,
  TypographyProps,
  withPanelPosition,
} from "@root/shared";
import * as classNames from "classnames/bind";
import * as memoize from "memoizee";
import * as PropTypes from "prop-types";
import * as React from "react";
import { Link } from "react-router";
import { BlockPadding } from "../block";

const css = require("./header-area.scss");
const { spaceXS } = require("@root/shared/styles/variables.scss");

function createSFC<T>(component: React.SFC<T>, name: string) {
  component.displayName = name;
  return component;
}

export enum HeaderAreaTitleSize {
  Small = "Small",
  Medium = "Medium",
  Large = "Large",
}

export interface TitleTextProps extends Partial<TypographyProps> {
  ellipsize?: void & TypographyProps["ellipsize"];
  size?: void & TypographyProps["size"];
}

export interface HeaderAreaProps extends React.HTMLAttributes<HTMLElement> {
  // Configuration
  titleSize?: HeaderAreaTitleSize;
  smallSubtitle?: boolean;
  inline?: boolean;
  multiline?: boolean;
  styles?: { [key: string]: string };
  showPreviewPill?: boolean;

  // Content
  title: string;
  titleTagName?: HTMLTagNames;
  renderTitle?: (TitleText: React.SFC<TitleTextProps>, title: string) => React.ReactNode;
  subtitle?: string | ((SubtitleText: React.SFC<TitleTextProps>) => React.ReactNode);
  icon?: IconName | React.ReactElement<any>;
  backTitle?: string;
  to?: string;
}

export const HeaderArea = withPanelPosition(
  class HeaderArea extends React.Component<HeaderAreaProps & { panelPosition?: PanelPosition }> {
    public static defaultProps = {
      styles: css,
      titleSize: HeaderAreaTitleSize.Medium,
      titleTagName: "h2",
    };

    public static contextTypes = {
      blockContext: PropTypes.any,
      inWizard: PropTypes.bool,
    };

    public static TitleText: { [K in HeaderAreaTitleSize]: React.SFC<TitleTextProps> } = {
      Small: createSFC<TitleTextProps>((props) => <Text bold {...props} size={Size.Medium} />, "TitleText.Small"),
      Medium: createSFC<TitleTextProps>((props) => <Text {...props} size={Size.Large} />, "TitleText.Medium"),
      Large: createSFC<TitleTextProps>((props) => <Title tagName="span" {...props} size={Size.Medium} />, "TitleText.Large"),
    };

    public static MultiLineTitleText: { [K in HeaderAreaTitleSize]: React.SFC<TitleTextProps> } = {
      Small: createSFC<TitleTextProps>((props) => <Text bold {...props} size={Size.Medium} />, "TitleText.Small"),
      Medium: createSFC<TitleTextProps>((props) => <Text {...props} size={Size.Large} />, "TitleText.Medium"),
      Large: createSFC<TitleTextProps>((props) => <Title tagName="span" {...props} size={Size.Medium} />, "TitleText.Large"),
    };

    public static SubtitleText: { [K in "small" | "large"]: React.SFC<TitleTextProps> } = {
      small: createSFC<TitleTextProps>(
        (props) => <Text color={TextColor.Secondary} {...props} size={Size.Medium} />,
        "SubtitleText.Small"
      ),
      large: createSFC<TitleTextProps>((props) => <Text color={TextColor.Secondary} {...props} size={Size.Medium} />, "SubtitleText"),
    };

    private getTitleComponent = memoize((Title: React.SFC<TitleTextProps>, titleTagName: HTMLTagNames) => {
      const headingProps: {
        role?: string;
        "aria-level"?: number;
      } = {};

      if (/^h[1-9]/.test(titleTagName)) {
        // check whether the tag is a heading tag (ie. "h1")
        headingProps.role = "heading";

        // extract the number from the heading tag ("h1" -> "1")
        headingProps["aria-level"] = Number(titleTagName.match(/\d+/)?.[0]);
      }

      const TitleComponent: React.SFC<TitleTextProps> = (props) => (
        <Title
          {...props}
          {...headingProps}
          id={props.id ? props.id : SETTINGS_CARD_HEADING_PREFIX + replaceSpacesWithDashes(props.children as string)}
          tagName={titleTagName}
        />
      );
      TitleComponent.displayName = `TitleText(${titleTagName})`;
      return TitleComponent;
    });

    public context!: { inWizard?: boolean; blockContext: { padding: BlockPadding; dividedHeader?: boolean } };

    public render() {
      const {
        showPreviewPill,
        titleSize,
        multiline,
        className,
        inline,
        styles,
        title,
        renderTitle,
        subtitle,
        icon,
        children,
        smallSubtitle,
        panelPosition,
        backTitle,
        to,
        titleTagName,
        ...passthrough
      } = this.props;
      const { inWizard = false, blockContext: { padding = BlockPadding.Default, dividedHeader = false } = {} } = this.context;
      const TitleText = HeaderArea.TitleText[titleSize!];
      const SubtitleText = smallSubtitle ? HeaderArea.SubtitleText.small : HeaderArea.SubtitleText.large;
      const TaggedTitleText = this.getTitleComponent(TitleText, titleTagName!);
      const classes = classNames.call(styles, "header-area", className, titleSize!.toLowerCase(), {
        inline,
        dividedHeader,
        hasBackButton: backTitle,
        inSecondary: panelPosition === PanelPosition.Secondary,
        paddingPanel: padding === BlockPadding.Panel,
        paddingModal: padding === BlockPadding.Modal,
        stickWizardMenu: inWizard,
      });

      return (
        <div className={classes} {...passthrough}>
          {backTitle && to ? (
            <Link to={to} className={styles!.back} aria-label={t("common:button.pageBack", { backTitle: backTitle })}>
              <Text size={Size.Small} color={TextColor.Secondary}>
                <Icon icon={IconName.ChevronLeft} size={IconSize.XXSmall} area={IconArea.Normal} /> {backTitle}
              </Text>
            </Link>
          ) : null}
          <div className={styles!.bar}>
            <div className={styles!.textArea}>
              <div className={styles!.titleArea}>
                {icon ? <div className={styles!.icon}>{typeof icon === "string" ? <Icon icon={icon} /> : icon}</div> : null}
                {renderTitle ? renderTitle(TaggedTitleText, title) : <TaggedTitleText>{title}</TaggedTitleText>}
                {showPreviewPill && (
                  <Pill style={{ marginLeft: spaceXS, marginBottom: "-1px", alignSelf: "center" }} color={Color.Amber}>
                    {t("common:preview")}
                  </Pill>
                )}
              </div>
              {subtitle ? typeof subtitle === "string" ? <SubtitleText>{subtitle}</SubtitleText> : subtitle(SubtitleText) : null}
            </div>

            <div className={styles!.toolbar}>{children}</div>
          </div>
        </div>
      );
    }
  }
);
