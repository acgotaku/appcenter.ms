import * as React from "react";
import * as PropTypes from "prop-types";
import { t } from "@root/lib/i18n";
import { Helmet } from "react-helmet";
import { noop } from "lodash";
import { HeaderArea, HeaderAreaProps, HeaderAreaTitleSize } from "../header-area";
import { IconName, Icon, IconSize, IconArea } from "../../icon";
import { ClickableIcon, Button, ButtonSize } from "../../button/button";
import { withPanelPosition, PanelPosition } from "../../panels";
import { BreadcrumbBuilder } from "../../context-stack-builder/variants/breadcrumb-builder";
import { loadingStore } from "@root/stores/loading-store";
import { notifyScreenReader } from "@root/stores/notification-store";
import { Path } from "@root/shared/path";
import { Trigger, Tooltip } from "@root/shared";
import { locationStore } from "@root/stores";

const css = require("./page-header.scss");

export interface PageHeaderProps extends HeaderAreaProps {
  /**
   * Whether to show a close button in the right side of the header.
   * A default is chosen automatically based on context, but can be
   * overridden here.
   */
  closeButton?: boolean;
  /**
   * Disable setting breadcrumb from title.
   */
  noBreadcrumb?: boolean;
  /**
   * An override for the close button’s click handler. By default,
   * the click will be handled by the parent Panel or Modal in order
   * to navigate out of the current Panel or Modal.
   */
  onClickClose?: React.MouseEventHandler<Element>;
  /**
   * Shows and animates a progress bar at the top of the screen.
   */
  loading?: boolean;
}

/**
 * The HeaderArea for a Page (to be provided to Page’s `header` prop).
 * Supports everything HeaderArea supports, but automatically includes a
 * close button when appropriate and sets the document title.
 */
export const PageHeader = withPanelPosition(
  class PageHeader extends React.Component<PageHeaderProps & { panelPosition?: PanelPosition }, {}> {
    public context!: {
      requestClose?: React.MouseEventHandler<Element>;
      inModal?: boolean;
    };

    public static defaultProps = {
      onClickClose: noop,
    };

    public static contextTypes = {
      requestClose: PropTypes.func,
      inModal: PropTypes.bool,
    };

    public componentDidMount() {
      const { panelPosition, title, loading } = this.props;
      loadingStore.setLoading(!!loading);

      if (panelPosition === PanelPosition.Primary) {
        const message = title ? t("common:page.pageHeader.loading", { title }) : t("common:page.pageHeader.loadingWithoutTitle");
        notifyScreenReader({ message: loading ? message : title });
      }
    }

    public componentWillUnmount() {
      loadingStore.setLoading(false);
    }

    public componentDidUpdate(prevProps: PageHeaderProps) {
      const { panelPosition, title, loading } = this.props;
      const { loading: prevLoading, title: prevTitle } = prevProps;
      loadingStore.setLoading(!!loading);

      if (panelPosition === PanelPosition.Primary) {
        if (prevLoading !== loading) {
          const message = `common:page.pageHeader.${!!prevLoading > !!loading ? "loaded" : "loading"}`;
          notifyScreenReader({ message: t(message, { prevTitle }) });
        } else if (prevTitle !== title) {
          notifyScreenReader({ message: title, delay: 500 });
        }
      }
    }

    render() {
      const { children, closeButton, onClickClose, loading, subtitle, panelPosition, noBreadcrumb, ...props } = this.props;
      const { requestClose, inModal } = this.context;
      const showCloseButton = closeButton === false ? false : Boolean(closeButton || requestClose);
      return (
        <Path.Consumer>
          {(path) => (
            <>
              <Helmet title={props.title} />
              {inModal || noBreadcrumb ? null : <BreadcrumbBuilder.Value title={props.title} />}
              {panelPosition === PanelPosition.Secondary ? (
                <HeaderArea
                  to={path}
                  {...props}
                  renderTitle={() => (
                    <Button
                      className={css.secondaryNavButton}
                      subtle
                      ellipsize
                      size={ButtonSize.Small}
                      onClick={this.handleClose}
                      icon={<Icon icon={IconName.ChevronLeft} size={IconSize.XXSmall} area={IconArea.Normal} />}
                    >
                      {props.title}
                    </Button>
                  )}
                />
              ) : (
                <HeaderArea
                  titleTagName="h1"
                  titleSize={HeaderAreaTitleSize.Large}
                  subtitle={subtitle}
                  to={locationStore.getGoUpPathFrom(path)}
                  {...props}
                >
                  {children}
                  {showCloseButton ? (
                    <Tooltip>
                      <Trigger skipAreaExpandedTracking={true}>
                        <ClickableIcon
                          large
                          className={css.closeIcon}
                          icon={IconName.Close}
                          onClick={this.handleClose}
                          data-autofocus={false}
                          data-test-class="top-bar-close-button"
                        />
                      </Trigger>
                      {t("common:button.close")}
                    </Tooltip>
                  ) : null}
                </HeaderArea>
              )}
            </>
          )}
        </Path.Consumer>
      );
    }

    private handleClose = (event: React.MouseEvent<HTMLElement>) => {
      const { onClickClose } = this.props;
      if (onClickClose === noop) {
        if (this.context.requestClose) {
          this.context.requestClose(event);
        }
      } else {
        onClickClose!(event);
      }
    };
  }
);
