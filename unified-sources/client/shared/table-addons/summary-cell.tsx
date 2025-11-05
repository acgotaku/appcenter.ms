import * as React from "react";
import * as PropTypes from "prop-types";
import { Icon, IconName, IconSize, MediaObject } from "../";
import { Skeletal } from "../skeleton/skeleton";
import { RowHeight, RowContext, TableContext, Cell } from "../table";
import { Stretch } from "../stretch";
import { ImageLike } from "../common-interfaces";
import { Text, Size, TextColor } from "@root/shared/typography";

const css = require("./summary-cell.scss");
const classNames = require("classnames");
const { cloneElement } = React;

const iconClass = {
  [IconSize.XXSmall]: "icon-small",
  [IconSize.XSmall]: "icon-small",
  [IconSize.Small]: "icon-small",
  [IconSize.Medium]: "icon-medium",
  [IconSize.Large]: "icon-large",
  [IconSize.XLarge]: "icon-xlarge",
};

export interface SummaryCellProps extends Skeletal {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: string;
  icon?: IconName | ImageLike;
  iconSize?: IconSize;
  styles?: { [key: string]: string };
  className?: string;
  titleClassName?: string;
  link?: boolean;
  children?: React.ReactNode;
}

type DefaultProps = {
  styles: { [key: string]: string };
};

type SummaryCellPropsWithDefaultProps = SummaryCellProps & DefaultProps;

export class SummaryCell extends React.Component<SummaryCellProps, {}> {
  public static propTypes = {
    title: PropTypes.node.isRequired,
    subtitle: PropTypes.node,
    badge: PropTypes.string,
    icon: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    iconSize: PropTypes.number,
    titleClassName: PropTypes.string,
  };

  public static defaultProps = {
    styles: css,
  };

  public static contextTypes: React.WeakValidationMap<TableContext & RowContext> = {
    rowHeight: PropTypes.any,
    to: PropTypes.string,
    href: PropTypes.string,
  };

  public context!: TableContext & RowContext;

  get iconSize() {
    return (
      this.props.iconSize ||
      {
        [RowHeight.Compact]: IconSize.Small,
        [RowHeight.SingleLine]: IconSize.Medium,
        [RowHeight.MultiLine]: IconSize.Medium,
      }[this.context.rowHeight]
    );
  }

  public renderIcon(skeleton: boolean = false) {
    const { styles, icon } = this.props as SummaryCellPropsWithDefaultProps;
    if (!icon) {
      return null;
    }

    const className = styles[iconClass[this.iconSize]];
    return typeof icon === "string" ? (
      <Icon icon={icon} size={this.iconSize} skeleton={skeleton} className={className} />
    ) : (
      cloneElement(icon, {
        className: [className, icon.props.className].join(" "),
      })
    );
  }

  public render() {
    const { children } = this.props;
    const { title, subtitle, badge, icon, iconSize, titleClassName: titleClassNameFromProps, styles, className, ...passthrough } = this
      .props as SummaryCellPropsWithDefaultProps;

    const large = this.context.rowHeight === RowHeight.MultiLine;
    if (this.props.skeleton) {
      return (
        <Cell className={this.props.className}>
          <MediaObject
            skeleton
            inline={this.context.rowHeight !== RowHeight.MultiLine}
            textOnly={!this.props.hasOwnProperty("icon")}
            className={styles[large ? "large-skeleton" : "skeleton"]}
          >
            {this.props.hasOwnProperty("icon") ? this.renderIcon(true) : null}
            <div className={styles.title} />
            {subtitle ? <div className={styles.subtitle} /> : null}
          </MediaObject>
        </Cell>
      );
    }

    const link = !!(this.context.to || this.context.href); // this is (intentionally) overridden when `passthrough` includes `link`
    const containerClassName = classNames(this.props.className, styles[large ? "large-container" : "container"]);
    const titleClassName = classNames(titleClassNameFromProps, styles.title);
    const mediaObject = (
      <MediaObject inline={!large} textOnly={!this.props.hasOwnProperty("icon")}>
        {this.renderIcon()}
        <div className={titleClassName} data-test-class="summary-cell-title">
          {title}
          {badge ? <span className={styles.badge}>{badge}</span> : null}
        </div>
        {subtitle ? (
          <div className={styles.subtitle} data-test-class="summary-cell-subtitle">
            {subtitle}
          </div>
        ) : null}
      </MediaObject>
    );

    return (
      <Cell link={link} {...passthrough} className={containerClassName}>
        {children ? (
          <Stretch centered className={styles.stretch}>
            {mediaObject}
            {typeof children === "string" ? (
              <Text size={Size.Small} color={TextColor.Secondary}>
                {children}
              </Text>
            ) : (
              children
            )}
          </Stretch>
        ) : (
          mediaObject
        )}
      </Cell>
    );
  }
}
