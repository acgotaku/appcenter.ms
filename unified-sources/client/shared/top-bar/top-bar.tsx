import * as React from "react";
import * as PropTypes from "prop-types";
import { Helmet } from "react-helmet";
import { noop } from "lodash";
import { t } from "@root/lib/i18n";
import { notifyScreenReader } from "@root/stores/notification-store";
import { ClickableIcon } from "../button/button";
import { Icon, IconName } from "../icon/icon";
import { IconSize, ImageLike } from "../common-interfaces";
import { PanelPosition, withPanelPosition } from "../panels";
import { MediaObject } from "../media-object/media-object";
import { InfoLabel, InfoLabelProps } from "../info-label/info-label";
import { loadingStore } from "@root/stores/loading-store";
import { PageProgress } from "@root/shared";
import { observer } from "mobx-react";
import { BreadcrumbBuilder } from "@root/shared/context-stack-builder/variants/breadcrumb-builder";
const css = require("./top-bar.scss");
const classNames = require("classnames");
const panelStyles: { [key: number]: string } = {
  [PanelPosition.Primary]: "in-primary",
  [PanelPosition.Hidden]: "in-hidden",
};

export interface TopBarProps extends React.HTMLAttributes<HTMLElement> {
  /** Required to set the `document.title`. `titleArea` will override the UI if present, but this value will always be used for the document title. */
  title: string;
  subtitle?: string | React.ReactElement<any>;
  loading?: boolean;
  icon?: IconName | ImageLike;
  iconSize?: IconSize;
  titleArea?: React.ReactNode;
  infoLabels?: InfoLabelProps[];
  controlsArea?: React.ReactNode;
  closeButton?: boolean;
  panelPosition?: PanelPosition;
  leftClassName?: string;
  rightClassName?: string;
  onClickClose?(event: Event): void;
  styles?: any;
}

export const TopBar = withPanelPosition(
  observer(
    class TopBar extends React.Component<TopBarProps, {}> {
      public context!: {
        requestClose?(event: Event): void;
        inModal?: boolean;
      };

      public static defaultProps = {
        onClickClose: noop,
        iconSize: IconSize.Medium,
        styles: css,
      };

      public static contextTypes = {
        requestClose: PropTypes.func,
        inModal: PropTypes.bool,
      };

      public componentDidMount() {
        const { panelPosition, title, loading } = this.props;
        loadingStore.setLoading(!!loading);

        if (panelPosition === PanelPosition.Primary) {
          const message = title ? t("common:page.topBar.loading", { title }) : t("common:page.topBar.loadingWithoutTitle");
          notifyScreenReader({ message: loading ? message : title });
        }
      }

      public componentWillUnmount() {
        loadingStore.setLoading(false);
      }

      public componentDidUpdate(prevProps: TopBarProps) {
        const { panelPosition, title, loading } = this.props;
        const { loading: prevLoading, title: prevTitle } = prevProps;
        loadingStore.setLoading(!!loading);

        if (panelPosition === PanelPosition.Primary) {
          if (prevLoading !== loading) {
            const message = `common:page.topBar.${!!prevLoading > !!loading ? "loaded" : "loading"}`;
            notifyScreenReader({ message: t(message, { prevTitle }) });
          } else if (prevTitle !== title) {
            notifyScreenReader({ message: title, delay: 500 });
          }
        }
      }

      private handleClose = (event: React.MouseEvent<HTMLElement>) => {
        const e: Event = event.nativeEvent;
        const { onClickClose } = this.props;
        if (onClickClose === noop) {
          this.context.requestClose!(e);
        } else {
          onClickClose!(e);
        }
      };

      private renderIcon = () => {
        const { iconSize, styles } = this.props;

        const icon = typeof this.props.icon === "string" ? <Icon icon={this.props.icon} size={iconSize} /> : this.props.icon || null;

        if (!icon) {
          return null;
        }

        return <span className={styles.icon}>{icon}</span>;
      };

      private renderTitle = () => {
        const { title, subtitle, styles } = this.props;
        return (
          <MediaObject className={styles["title-container"]} textOnly={!this.props.hasOwnProperty("icon")}>
            {this.renderIcon()}
            <h1 className={styles.title} data-test-class="top-bar-title">
              {title}
            </h1>
            {subtitle ? (
              <h2 className={styles.subtitle} data-test-class="top-bar-subtitle">
                {subtitle}
              </h2>
            ) : null}
          </MediaObject>
        );
      };

      private renderInfoLabels = () => {
        const { infoLabels } = this.props;
        return infoLabels ? (
          <div>
            {infoLabels.map((label, index) => (
              <InfoLabel key={index} {...label} constrainWidth />
            ))}
          </div>
        ) : null;
      };

      public render() {
        const {
          panelPosition = PanelPosition.Primary,
          title,
          titleArea,
          controlsArea,
          closeButton,
          styles,
          subtitle,
          loading,
          icon,
          iconSize,
          infoLabels,
          onClickClose,
          ...passthrough
        } = this.props;
        const { requestClose, inModal } = this.context;
        const showCloseButton = closeButton === false ? false : Boolean(closeButton || requestClose);
        const styleName = panelStyles[panelPosition] || "top-bar";
        const className = classNames(this.props.className, styles[styleName]);
        const leftClassName = classNames(this.props.leftClassName, styles["left"]);
        const rightClassName = classNames(this.props.rightClassName, styles["right"]);
        const inert = panelPosition === PanelPosition.Hidden ? { inert: "true" } : {};
        const showLoader = this.props.loading && loadingStore.modalLoading && panelPosition === PanelPosition.Primary;
        return (
          <>
            <PageProgress panelPosition={PanelPosition.Primary} loading={!!showLoader} />
            <div {...inert} {...passthrough} className={className} data-test-class="top-bar">
              <span className={styles.transition} />
              {title ? (
                <>
                  <Helmet title={title} />
                  {inModal ? null : <BreadcrumbBuilder.Value title={title} />}
                </>
              ) : null}
              <div className={leftClassName}>{titleArea || this.renderTitle()}</div>
              <div className={rightClassName}>
                {this.renderInfoLabels()}
                {controlsArea}
                {showCloseButton ? (
                  /* data-autofocus tells TabTrap whether this element is focusable during componentDidEnter */
                  <ClickableIcon
                    large
                    className={styles["close-icon"]}
                    icon={IconName.Close}
                    onClick={this.handleClose}
                    data-autofocus={false}
                    data-test-class="top-bar-close-button"
                  />
                ) : null}
              </div>
              {this.props.children}
            </div>
          </>
        );
      }
    }
  )
);
