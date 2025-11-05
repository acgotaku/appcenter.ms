import * as React from "react";
import * as PropTypes from "prop-types";
import { findDOMNode, createPortal } from "react-dom";
import { omit, noop } from "lodash";
import { TabTrap } from "../tabtrap";
import { Autofocus } from "../autofocus";
import { listItemContextTypes, ListItemContext } from "../dropdown/list-item-context";
import { PerimeterPosition, TestProps } from "../common-interfaces";
import { getPositionStyle } from "./get-position-style";
import { portalRootNode } from "../utils";
const classNames = require("classnames/bind");
const css = require("./overlay.scss");
import { KeyboardEventManagerChildContext } from "../keyboard-event-manager/keyboard-event-manager";
import { RefocusManagerChildContext } from "../refocus-manager";
import { globalUIStore } from "@root/stores/global-ui-store";
import { PartialBy } from "@lib/common-interfaces";

export interface TransitionProps {
  transition?: OverlayTransition;
  transitionIn?: OverlayTransition;
  transitionOut?: OverlayTransition;
  transitionDuration?: number;
  transitionInDuration?: number;
  transitionOutDuration?: number;
  easing?: string;
  easingIn?: string;
  easingOut?: string;
}

/**
 * Props passed to an Overlay component
 */
export interface OverlayProps extends React.HTMLAttributes<HTMLElement>, TransitionProps {
  visible: boolean;
  deferRender?: boolean;
  portaled?: boolean;
  backdrop?: boolean;
  backdropClassName?: string;
  containerClassName?: string;
  origin?: PerimeterPosition;
  overlap?: boolean;
  horizontal?: boolean;
  sticky?: boolean;
  anchorRect?: ClientRect;
  onEnter?(overlayElement: HTMLElement): void;
  onExited?(): void;
  onRequestClose?(event: Event | React.SyntheticEvent<HTMLElement>, ...args: any): void;
  onInsideClick?(event: React.MouseEvent<HTMLElement>): void;
  role?: string;
  tabTrap?: boolean;
  styles?: any;
  children?:
    | React.ReactNode
    | ((props: React.ClassAttributes<any> & React.HTMLAttributes<HTMLElement> & TestProps) => React.ReactNode);
}

export type DefaultizedOverlayProps = PartialBy<OverlayProps, keyof typeof Overlay.defaultProps>;

export interface OverlayState {
  animatingIn: boolean;
  animatingOut: boolean;
  aboutToAnimateIn: boolean;
}

/**
 * Predefined animation styles
 */
export enum OverlayTransition {
  None = 1,
  Fade = 2,
  SlideRight = 4,
  SlightRight = 8,
}

const durationDefaults: { [key: number]: number } = {
  [OverlayTransition.Fade]: 120,
  [OverlayTransition.SlideRight]: 150,
  [OverlayTransition.SlightRight]: 150,
};

const numberOr = (x?: number, y?: number) => (x && Number.isInteger(x) ? x : y);

/**
 * Base Overlay component
 */
export class Overlay extends React.Component<OverlayProps, OverlayState> {
  private backdrop: HTMLElement | null = null;
  private overlay: HTMLElement | null = null;
  private positionStyle?: React.CSSProperties;
  private needsPositionRecalculation = false;
  private animatingInTimer?: NodeJS.Timer;
  private animatingOutTimer?: NodeJS.Timer;

  public static defaultProps = {
    backdropClassName: "",
    containerClassName: "",
    className: "",
    origin: PerimeterPosition.TopLeft,
    transition: OverlayTransition.None,
    style: {},
    onRequestClose: noop,
    onInsideClick: noop,
    onEnter: noop,
    onExited: noop,
    styles: css,
    tabTrap: true,
  };

  public state: OverlayState = {
    animatingIn: false,
    animatingOut: false,
    aboutToAnimateIn: false,
  };

  public static contextTypes: React.ValidationMap<
    KeyboardEventManagerChildContext & ListItemContext & RefocusManagerChildContext & { overlayPortal: HTMLElement }
  > = {
    ...listItemContextTypes,
    keyboardEventManager: PropTypes.any,
    refocusManager: PropTypes.any,
    overlayPortal: PropTypes.any,
  };

  public static childContextTypes = {
    overlayPortal: PropTypes.any,
  };

  public context!: KeyboardEventManagerChildContext & RefocusManagerChildContext & { overlayPortal: HTMLElement | null };

  public getChildContext = () => {
    return {
      overlayPortal: this.props.portaled || this.props.backdrop ? this.backdrop : null,
    };
  };

  /**
   * When there is no backdrop to click, allows arbitrary clicks outside the
   * overlay body to close the overlay.
   */
  private onDocumentClick = (e: MouseEvent): void => {
    const { sticky, visible } = this.props;
    const target = e.target as Element;
    if (
      !visible || // not visible
      sticky ||
      !this.overlay || // missing overlay ref
      target === this.overlay || // overlay itself was clicked
      this.overlay.contains(target)
    ) {
      // overlay contents were clicked
      return;
    }

    this.props.onRequestClose!(e);
  };

  private onRequestClose = (e: Event): void => {
    this.props.onRequestClose!(e);
  };

  /**
   * Ref callback to provide listeners with the overlay HTMLElement
   * every time it is rendered.
   */
  private onRenderOverlay = (overlay: HTMLElement | React.Component) => {
    this.overlay = findDOMNode(overlay) as HTMLElement;
  };

  private onRenderTabTrap = (tabTrap: TabTrap) => {
    this.backdrop = findDOMNode(tabTrap) as HTMLElement;
  };

  private onRenderBackdrop = (backdrop: HTMLElement | null) => {
    this.backdrop = backdrop;
  };

  private onClickOverlayBody: React.MouseEventHandler<HTMLElement> = (event) => {
    event.stopPropagation();
    this.props.onInsideClick!(event);
  };

  /**
   * Whether the overlay can use a provided anchorRect and origin
   * to position itself absolutely within the backdrop.
   */
  private get shouldSetOwnPosition() {
    return (this.props.backdrop || this.props.portaled) && this.props.anchorRect;
  }

  private get transitionIn() {
    return numberOr(this.props.transitionIn, this.props.transition);
  }
  private get transitionOut() {
    return numberOr(this.props.transitionOut, this.props.transition);
  }
  private get transitionInDuration() {
    return numberOr(this.props.transitionInDuration, this.props.transitionDuration);
  }
  private get transitionOutDuration() {
    return numberOr(this.props.transitionOutDuration, this.props.transitionDuration);
  }
  private get easingIn() {
    return this.props.easingIn || this.props.easing;
  }
  private get easingOut() {
    return this.props.easingOut || this.props.easing;
  }

  /**
   * Uses the supplied origin and anchorRect to set inline style properties
   * that position the overlay within the backdrop.
   */
  private getPositionStyle = (): React.CSSProperties => {
    if (!this.shouldSetOwnPosition) {
      if (!this.needsPositionRecalculation && this.positionStyle) {
        return this.positionStyle;
      } else if (!this.needsPositionRecalculation) {
        return this.getMinWidthStyle();
      }

      return (this.positionStyle = this.getMinWidthStyle());
    }

    if (!this.needsPositionRecalculation && this.positionStyle) {
      return this.positionStyle;
    } else if (!this.needsPositionRecalculation) {
      return this.getMinWidthStyle();
    }

    const { origin, overlap, horizontal, anchorRect } = this.props;
    return (this.positionStyle = {
      ...this.getMinWidthStyle(),
      ...(anchorRect && getPositionStyle(origin!, anchorRect, !!horizontal, !!overlap)),
    });
  };

  /**
   * Ensures the overlay is at least as wide as the anchorRect, if one was given.
   */
  private getMinWidthStyle = (): React.CSSProperties => {
    const { style, anchorRect, horizontal } = this.props;
    if (!anchorRect || horizontal) {
      return { minWidth: style!.minWidth };
    }

    return {
      minWidth: Math.max(parseInt(String(style!.minWidth), 10) || 0, anchorRect.width),
    };
  };

  /**
   * Maps the transition prop to a CSS class name to be applied to the container/backdrop.
   */
  private get transitionClassName(): string {
    const { styles } = this.props;
    const { animatingIn, animatingOut } = this.state;
    const cx = classNames.bind(styles);
    const { transitionIn, transitionOut } = this;
    if (!animatingIn && !animatingOut) {
      return cx(OverlayTransition[transitionIn!].toLowerCase(), OverlayTransition[transitionOut!].toLowerCase(), {
        [OverlayTransition[transitionIn!].toLocaleLowerCase() + "-start"]: this.state.aboutToAnimateIn,
      });
    }

    const transition = animatingIn ? transitionIn : transitionOut;
    return cx(OverlayTransition[transition!].toLowerCase(), animatingIn ? "animating-in" : "animating-out");
  }

  /**
   * Returns inline style properties for the backdrop
   * that can’t be applied with static CSS.
   */
  private getBackdropTransitionStyle = (): React.CSSProperties => {
    const { transitionIn, transitionOut, easingIn, easingOut, transitionInDuration, transitionOutDuration } = this;
    const { animatingIn, animatingOut } = this.state;

    if (animatingIn) {
      switch (transitionIn) {
        case OverlayTransition.None:
          return {};
        case OverlayTransition.Fade:
          return {
            transitionDuration: `${numberOr(transitionInDuration, durationDefaults[OverlayTransition.Fade])}ms`,
            transitionTimingFunction: easingIn || "linear",
          };
        case OverlayTransition.SlightRight:
          return {
            transitionDuration: `${numberOr(transitionInDuration, durationDefaults[OverlayTransition.SlightRight])}ms`,
            transitionTimingFunction: easingOut || "cubic-bezier(0.165, 0.84, 0.44, 1)",
          };
      }
    }

    if (animatingOut) {
      switch (transitionOut) {
        case OverlayTransition.None:
          return {};
        case OverlayTransition.Fade:
          return {
            transitionDuration: `${numberOr(transitionOutDuration, 200)}ms`,
            transitionTimingFunction: easingOut || "linear",
          };
        case OverlayTransition.SlideRight:
          return {
            transitionDuration: `${numberOr(transitionInDuration, durationDefaults[OverlayTransition.SlideRight])}ms`,
            transitionTimingFunction: easingIn || "cubic-bezier(0.895, 0.03, 0.685, 0.22)",
          };
      }
    }

    return {};
  };

  /**
   * Returns inline style properties for the overlay body itself
   * that can’t be applied with static CSS.
   */
  private getOverlayTransitionStyle = (): React.CSSProperties => {
    if (this.props.backdrop) {
      return {};
    }

    return this.getBackdropTransitionStyle();
  };

  public componentDidMount() {
    if (!this.props.backdrop) {
      document.addEventListener("click", this.onDocumentClick);
    }
    if (this.props.visible) {
      this.context.keyboardEventManager.addEscapeListener(this.onRequestClose);
      this.onEnter();
      // If this overlay has a backdrop, we consider it as being eligible
      // for "refocus" behavior
      if (this.props.backdrop) {
        if (this.overlay) {
          this.context.refocusManager.registerContainer(this.overlay);
        }
        // Try to make things a little better for Edge, prevent it from start at document root if focused element is lost
        globalUIStore.setOverlayOpen(true);
      }
    }
  }

  public UNSAFE_componentWillReceiveProps(nextProps: OverlayProps) {
    const portaledChanged = (nextProps.portaled || nextProps.backdrop) !== (this.props.portaled || this.props.backdrop);
    if (this.props.anchorRect !== nextProps.anchorRect || portaledChanged) {
      this.needsPositionRecalculation = true;
    }

    if (!this.props.visible && nextProps.visible) {
      this.setState({ animatingOut: false, aboutToAnimateIn: true });
    } else if (this.props.visible && !nextProps.visible) {
      this.setState({ animatingIn: false });
      if (this.transitionOut !== OverlayTransition.None) {
        this.setState({ animatingOut: true });
        const nextTransition = numberOr(this.props.transitionOut, this.props.transition);
        const nextDuration = numberOr(
          numberOr(this.props.transitionOutDuration, this.props.transitionDuration),
          durationDefaults[nextTransition!]
        );
        this.animatingOutTimer = setTimeout(() => {
          this.setState({ animatingOut: false });
          this.props.onExited!();
        }, nextDuration!);
      }
    }
  }

  public componentDidUpdate(prevProps: OverlayProps) {
    if (!prevProps.visible && this.props.visible) {
      this.context.keyboardEventManager.addEscapeListener(this.onRequestClose);
      this.onEnter();
      if (this.transitionIn !== OverlayTransition.None) {
        setTimeout(() => this.setState({ animatingIn: true, aboutToAnimateIn: false }), 0);
        const nextTransition = numberOr(this.props.transitionIn, this.props.transition);
        const nextDuration = numberOr(
          numberOr(this.props.transitionInDuration, this.props.transitionDuration),
          durationDefaults[nextTransition!]
        );
        this.animatingInTimer = setTimeout(() => this.setState({ animatingIn: false }), nextDuration!);
      } else {
        setTimeout(() => this.setState({ aboutToAnimateIn: false }), 0);
      }
      if (this.props.backdrop) {
        if (this.overlay) {
          this.context.refocusManager.registerContainer(this.overlay);
        }
        // Try to make things a little better for Edge, prevent it from start at document root if focused element is lost
        globalUIStore.setOverlayOpen(true);
      }
    }
    if (prevProps.visible && !this.props.visible) {
      this.context.keyboardEventManager.removeEscapeListener(this.onRequestClose);
      if (this.overlay) {
        // if we don't wait for state to be false before calling
        // unregisterContainer, then the call to doFocus will not
        // be able to focus the next element if the animation is not finished
        // which would usually be the case
        // this solves that problem
        this.setState({ animatingOut: false }, () => {
          if (this.overlay) {
            this.context.refocusManager.unregisterContainer(this.overlay);
          }
        });
        globalUIStore.setOverlayOpen(false);
      }
    }
  }

  public onEnter = () => {
    if (this.overlay && this.overlay.offsetParent) {
      // Overlay is visible
      this.needsPositionRecalculation = true;
      this.props.onEnter!(this.overlay);
      setTimeout(() => (this.needsPositionRecalculation = false), 0);
    }
  };

  /**
   * Remove outside click event listener.
   */
  public componentWillUnmount() {
    document.removeEventListener("click", this.onDocumentClick);
    this.context.keyboardEventManager.removeEscapeListener(this.onRequestClose);
    if (this.overlay) {
      this.context.refocusManager.unregisterContainer(this.overlay);
    }
    globalUIStore.setOverlayOpen(false);
    clearTimeout(this.animatingInTimer!);
    clearTimeout(this.animatingOutTimer!);
  }

  private renderOverlayBody = () => {
    const {
      style,
      styles,
      backdrop,
      visible,
      role = "presentation",
      children,
      deferRender,
      portaled,
      backdropClassName,
      containerClassName,
      origin,
      overlap,
      horizontal,
      anchorRect,
      onRequestClose,
      onInsideClick,
      onEnter,
      onExited,
      tabTrap,
      sticky,
      transition,
      transitionIn,
      transitionOut,
      transitionDuration,
      transitionInDuration,
      transitionOutDuration,
      easing,
      easingIn,
      easingOut,
      title,
      ...passthrough
    } = this.props;
    const cx = classNames.bind(styles);
    const className = cx(this.props.className, "overlay", {
      visible: visible && !backdrop,
      [this.transitionClassName]: !backdrop,
    });

    const props: React.HTMLAttributes<HTMLElement> & React.ClassAttributes<any> & TestProps = {
      ref: this.onRenderOverlay,
      onClick: this.onClickOverlayBody,
      ...passthrough,
      className,
      role,
      "aria-modal": (backdrop && (role === "dialog" || role === "alertdialog")) || undefined,
      "data-test-class": classNames(this.props["data-test-class"], "overlay-body"),
      "aria-label": this.props["aria-label"] || title,
      style: {
        ...this.getPositionStyle(),
        ...this.getOverlayTransitionStyle(),
        ...omit(style || {}, "minWidth", "min-width"),
      },
    };

    return typeof children === "function" ? (
      (children as (props: React.ClassAttributes<any> & React.HTMLAttributes<HTMLElement> & TestProps) => React.ReactNode)(props)
    ) : (
      <div {...props} className={cx(className, "overlay-standard")}>
        {children}
      </div>
    );
  };

  /**
   * Renders an Overlay component inside a CSSTransitionGroup. If `backdrop` is enabled,
   * the overlay is also portaled to the document body atop a translucent backdrop.
   * @returns {JSX.Element} Overlay component
   */
  public render() {
    const { visible, backdrop, portaled, backdropClassName, onRequestClose, styles, deferRender, tabTrap } = this.props;
    const { animatingOut, animatingIn, aboutToAnimateIn } = this.state;
    const cx = classNames.bind(styles);
    const className = cx(backdropClassName, this.transitionClassName, "backdrop", { visible, transparent: !backdrop });
    const animating = animatingIn || animatingOut || aboutToAnimateIn;

    if (deferRender && !visible && !animating) {
      return null;
    }

    if (backdrop || portaled) {
      if (tabTrap) {
        return createPortal(
          <TabTrap
            active={visible}
            ref={this.onRenderTabTrap}
            data-test-class="overlay-backdrop"
            onKeyDown={this.props.onKeyDown}
            className={className}
            style={this.getBackdropTransitionStyle()}
            onClick={(event: React.MouseEvent<HTMLElement>) => {
              onRequestClose?.(event.nativeEvent);
            }}
          >
            <Autofocus getRef={() => this.backdrop} focus={visible && !animating} refocusOriginalElement>
              {this.renderOverlayBody()}
            </Autofocus>
          </TabTrap>,
          this.context.overlayPortal || portalRootNode
        );
      }
      return createPortal(
        <div
          ref={this.onRenderBackdrop}
          data-test-class="overlay-backdrop"
          onKeyDown={this.props.onKeyDown}
          className={className}
          style={this.getBackdropTransitionStyle()}
          onClick={(event: React.MouseEvent<HTMLElement>) => {
            onRequestClose!(event.nativeEvent);
          }}
        >
          {this.renderOverlayBody()}
        </div>,
        this.context.overlayPortal || portalRootNode
      );
    }
    return this.renderOverlayBody();
  }
}
