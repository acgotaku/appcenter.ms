import * as React from "react";
import * as PropTypes from "prop-types";
import { observable, runInAction } from "mobx";
import { debounce, uniqueId } from "lodash";
import { Block, BlockProps, BlockPadding, BlockBorderRadius, MaterialShadow, MaterialBackground } from "../block";
import { TopBar } from "../top-bar";
import { BottomBar } from "../bottom-bar";
import { StageArea } from "../stage-area";
import { NotificationType, PageNotification } from "../page-notification";
import { Tabs } from "../tabs";
import { VerticalTabs } from "../vertical-tabs";
import { PanelPosition, PanelOutlet, withPanelPosition } from "../panels";
import * as PageTimer from "@root/shared/page-timer";
import { findDOMNode } from "react-dom";
import { PageHelmet } from "@root/shared/page/page-helmet";
import { wrapPrimitive } from "@root/shared/utils/wrapPrimitive";
import { MessageBar } from "../message-bar";

const classNames = require("classnames/bind");
const css = require("./page.scss");
const { Children, cloneElement } = React;
const { globalBanner } = require("../../i18n/common.json");

export const PageContext = React.createContext({ edgeToEdge: false });

export interface PageProps
  extends React.HTMLAttributes<HTMLElement>,
    Pick<BlockProps, "header" | "footer" | "tagName" | "hero" | "heroBackground"> {
  panelPosition?: PanelPosition;
  disabled?: boolean;
  withoutPadding?: boolean;
  white?: boolean;
  constrainedWidth?: boolean;
  supportsMobile?: boolean;
  styles?: any;

  // alternative to children API
  topBar?: React.ReactElement<any>;
  bottomBar?: React.ReactElement<any>;
  notification?: React.ReactElement<any>;
  stageArea?: React.ReactElement<any>;
  verticalTabs?: React.ReactElement<any>;
  tabs?: React.ReactElement<any>;
  contents?: React.ReactElement<any>;

  // mainly for modals
  name?: string;
  role?: "dialog";
}

const isRecognizedType = (child: React.ReactChild): child is React.ReactElement<any> & { type: ChildType } =>
  typeof child === "object" &&
  (child.type === TopBar ||
    child.type === StageArea ||
    child.type === PageNotification ||
    child.type === BottomBar ||
    child.type === PanelOutlet ||
    child.type === Tabs ||
    child.type === VerticalTabs.Wrapper ||
    child.type === PageTimer.Reporter);

type ChildType = React.ComponentClass<any> | React.StatelessComponent<any> | string;

export const Page = withPanelPosition(
  class Page extends React.Component<PageProps, {}> {
    public static defaultProps = {
      styles: css,
      constrainedWidth: false,
    };

    public static contextTypes = {
      inModal: PropTypes.bool,
    };

    public static childContextTypes = {
      pageContext: PropTypes.object,
    };

    public context!: { inModal?: boolean };
    private children!: Map<ChildType, React.ReactElement<any>>;

    public state = {
      focusable: false,
    };

    constructor(props: PageProps) {
      super(props);
      this.saveChildTypes(props.children);
      this.pageContext = observable({ scrollElement: null });
    }

    private pageContext: { scrollElement: Element | null };
    private scrollElement: Element | null = null;

    public getChildContext() {
      return {
        pageContext: this.pageContext,
      };
    }

    private onRenderScrollElement = (scrollElement: Element | null) => {
      this.scrollElement = scrollElement;
    };

    private updateFocusableState = debounce(() => {
      const focusable = Boolean(
        !this.props.disabled &&
          this.context.inModal &&
          this.scrollElement &&
          this.scrollElement.scrollHeight > this.scrollElement.clientHeight
      );
      if (focusable !== this.state.focusable) {
        this.setState({ focusable });
      }
    }, 200);

    private get panelOutlet() {
      return this.children.get(PanelOutlet);
    }

    private get pageTimerReporter() {
      return this.children.get(PageTimer.Reporter);
    }

    private get topBar() {
      return this.props.header || (this.props.hasOwnProperty("topBar") ? this.props.topBar : this.children.get(TopBar));
    }

    private get bottomBar() {
      return this.props.footer || (this.props.hasOwnProperty("bottomBar") ? this.props.bottomBar : this.children.get(BottomBar));
    }

    private get notification() {
      return this.props.hasOwnProperty("notification") ? this.props.notification : this.children.get(PageNotification);
    }

    private get stageArea() {
      return this.props.hasOwnProperty("stageArea") ? this.props.stageArea : this.children.get(StageArea);
    }

    private get verticalTabs() {
      const { disabled, panelPosition, styles } = this.props;
      const tabs = this.props.hasOwnProperty("verticalTabs") ? this.props.verticalTabs : this.children.get(VerticalTabs.Wrapper);
      if (tabs) {
        return cloneElement(tabs, {
          ref: this.onRenderScrollElement,
          className: classNames.call(styles, { disabled }, css["vertical-tabs-container"]),
          "data-panel-position": panelPosition && (PanelPosition[panelPosition] || "").toLowerCase(),
          "aria-disabled": disabled,
        });
      }
    }

    private get tabs() {
      const tabs = this.props.hasOwnProperty("tabs") ? this.props.tabs : this.children.get(Tabs);
      return tabs ? cloneElement(tabs, { pageDivider: true }) : null;
    }

    private get inert() {
      return this.props.panelPosition === PanelPosition.Hidden ? { inert: "true" } : {};
    }

    private get focusable() {
      return this.state.focusable ? { tabIndex: 0 } : {};
    }

    private saveChildTypes(children: React.ReactNode) {
      this.children = new Map(
        Children.toArray(children).map((c): [ChildType, React.ReactElement<any>] => {
          return [isRecognizedType(c) ? c.type : "contents", wrapPrimitive(c)];
        })
      );
    }

    public componentDidMount() {
      window.addEventListener("resize", this.updateFocusableState);
      runInAction(() => (this.pageContext.scrollElement = this.scrollElement));
    }

    public UNSAFE_componentWillReceiveProps(nextProps: PageProps) {
      if (nextProps.children !== this.props.children) {
        this.saveChildTypes(nextProps.children);
      }
    }

    public componentDidUpdate() {
      runInAction(() => (this.pageContext.scrollElement = this.scrollElement));
      this.updateFocusableState();
    }

    public componentWillUnmount() {
      // stop all focusable related updates
      window.removeEventListener("resize", this.updateFocusableState);
      this.updateFocusableState.cancel();
    }

    public get scrollContainerProps() {
      const { disabled, white, panelPosition, styles } = this.props;
      const cx = classNames.bind(styles);
      return {
        ...this.inert,
        className: cx("scroll-container", { white }),
        "data-panel-position": panelPosition && (PanelPosition[panelPosition] || "").toLowerCase(),
        "data-test-class": "page-scroll-element",
        "aria-disabled": disabled,
      };
    }

    public render() {
      const {
        styles,
        className,
        panelPosition,
        disabled,
        withoutPadding,
        white,
        constrainedWidth,
        supportsMobile,
        topBar,
        bottomBar,
        notification,
        stageArea,
        tabs,
        contents,
        tagName,
        name,
        ...props
      } = this.props;
      const { inModal } = this.context;
      const cx = classNames.bind(styles);
      const shadow = inModal ? MaterialShadow.OverlayIntense : undefined;
      const borderRadius = inModal ? BlockBorderRadius.Large : undefined;
      const padding = inModal ? BlockPadding.Modal : BlockPadding.Panel;
      // Panel manages its own background for transition purposes
      const background = inModal ? MaterialBackground.White : MaterialBackground.None;
      const inSecondary = panelPosition === PanelPosition.Secondary;
      const inPrimary = panelPosition === PanelPosition.Primary;
      const inHidden = panelPosition === PanelPosition.Hidden;
      const notHidden = panelPosition && panelPosition !== PanelPosition.Hidden;
      const id = `page-in-${
        inModal
          ? uniqueId("modal-")
          : // There could be several elements with id="page-in-hidden"
            (notHidden && PanelPosition[panelPosition!]) || (inHidden && uniqueId(`panel-${PanelPosition[panelPosition!]}-`)) || ""
      }`.toLowerCase();
      const hasHeaderArea = !!this.props.header;
      const enableNewLayout = hasHeaderArea && !inModal && !inSecondary;

      return (
        <>
          <Block
            {...props}
            aria-label={name}
            id={id}
            dividedHeader={!hasHeaderArea}
            header={this.topBar}
            shadow={shadow}
            borderRadius={borderRadius}
            background={background}
            padding={withoutPadding ? BlockPadding.None : padding}
            footer={this.bottomBar}
            {...(enableNewLayout ? this.scrollContainerProps : null)}
            {...(enableNewLayout ? this.focusable : null)}
            className={cx(
              className,
              "page",
              {
                disabled,
                inModal,
                inPrimary,
                inSecondary,
                inHidden,
                hasHeaderArea,
              },
              enableNewLayout ? this.scrollContainerProps.className : null
            )}
            tagName={tagName}
            ref={enableNewLayout ? (block) => block && this.onRenderScrollElement(findDOMNode(block) as Element) : null}
          >
            {(BlockPadding) => (
              <>
                <PageHelmet supportsMobile={!!supportsMobile} />
                <div {...this.inert} className={styles.notification}>
                  {this.notification}
                </div>
                {this.pageTimerReporter}
                {this.verticalTabs || (
                  <div
                    style={{ width: "inherit" }}
                    {...(enableNewLayout ? { className: styles.fullHeightColumn } : this.scrollContainerProps)}
                    ref={enableNewLayout ? undefined : this.onRenderScrollElement}
                  >
                    {this.stageArea}
                    {enableNewLayout ? null : this.tabs}
                    <BlockPadding
                      className={cx("page-content", {
                        inPrimary,
                        inSecondary,
                        [styles.pageContentConstrained]: constrainedWidth,
                        edgeToEdge: !constrainedWidth && !inModal,
                      })}
                    >
                      {globalBanner.enabled === "true" && (
                        <div>
                          <MessageBar type={NotificationType.Warning} emphasizedBackground={true} className={styles["banner"]}>
                            {globalBanner.textBeforeLink}{" "}
                            <a href={globalBanner.link.url} target="blank">
                              {globalBanner.link.displayedText}
                            </a>{" "}
                            {globalBanner.textAfterLink}
                          </MessageBar>
                        </div>
                      )}
                      <PageContext.Provider value={{ edgeToEdge: !constrainedWidth }}>
                        {enableNewLayout ? this.tabs : null}
                        {this.children.get("contents")}
                      </PageContext.Provider>
                    </BlockPadding>
                  </div>
                )}
              </>
            )}
          </Block>
          {this.panelOutlet}
        </>
      );
    }
  }
);
