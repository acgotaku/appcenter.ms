import * as React from "react";
import { Overlay, OverlayProps, TransitionProps } from "../overlay/overlay";
import { noop, pickBy, isEqual, uniqueId } from "lodash";
import * as detectTriggerMovement from "./detect-trigger-movement";
import calculateOverlayPlacement from "../utils/calculate-overlay-placement";
import { TriggerProps, Trigger } from "../trigger/trigger";
import { PerimeterPosition } from "../common-interfaces";
import { PartialBy } from "@lib/common-interfaces";
import { findDOMNode } from "react-dom";

const classNames = require("classnames");
const css = require("./overlay-positioner.scss");

/**
 * Props passed to a OverlayPositioner component
 */
export interface OverlayPositionerProps extends Partial<OverlayProps> {
  preferRight?: boolean;
  forceRight?: boolean;
  preferBottom?: boolean;
  preferCenter?: boolean;
  interactive?: boolean;
  trigger: React.ReactElement<TriggerProps>;
  on?: string;
  sizeOverlayToTrigger?: boolean;
  onToggleVisible?(visible: boolean): void;
  overlayId?: string;
  overlayClassName?: string;
  "aria-label"?: string;
  "aria-activedescendant"?: string;
  isDropdown?: boolean;
}

export type DefaultizedOverlayPositionerProps = PartialBy<OverlayPositionerProps, keyof typeof OverlayPositioner.defaultProps>;

/**
 * OverlayPositioner component state
 */
export interface OverlayPositionerState {
  overlayElement?: HTMLElement | null;
  overlayOrigin?: PerimeterPosition;
  triggerRect?: ClientRect;
}

/**
 * Base OverlayPositioner component
 */
export class OverlayPositioner extends React.PureComponent<OverlayPositionerProps, OverlayPositionerState> {
  /**
   * Fallback values used when props aren't passed to the OverlayPositioner component
   * @static
   */
  public static defaultProps = {
    onToggleVisible: noop,
    preferRight: false,
    preferBottom: false,
    interactive: true,
    styles: css,
  };

  /**
   * OverlayPositioner component state
   * @type {OverlayPositionerState}
   */
  public state: OverlayPositionerState = {};
  public element: HTMLElement | null = null;
  public trigger = React.createRef<Trigger>();
  private overlayId = uniqueId("overlay-");

  private get triggerElement(): HTMLElement | null | undefined {
    return (
      this.trigger.current?.child ||
      (this.props.trigger.props.childRef?.current && (findDOMNode(this.props.trigger.props.childRef?.current) as HTMLElement))
    );
  }

  private get hasTooltipAriaLabelledBy(): boolean {
    return !!this.props["aria-labelledby"];
  }

  private onToggleVisible() {
    this.props.onToggleVisible?.(!this.props.visible);
  }

  /**
   * Ignores oustide clicks which actually came from the trigger
   */
  private onRequestClose = (event: Event) => {
    if (
      this.props.onRequestClose &&
      ("keyCode" in event ||
        (event.target instanceof Element && (!this.triggerElement || !this.triggerElement.contains(event.target))))
    ) {
      this.props.onRequestClose(event, true); // we always want to refocus the dropdown trigger upon escape
    }
  };

  /**
   * Gets Trigger (first child) and enables it to toggle visibility
   * @returns {React.ReactElement<TriggerProps>}
   */
  private getTrigger(): React.ReactElement<TriggerProps> {
    const trigger: React.ReactElement<TriggerProps> = this.props.trigger;
    const on = trigger.props.on || this.props.on;
    const overlayId = this.props.overlayId || this.overlayId;
    const overlayRendered = !!this.state.overlayElement;
    return React.cloneElement(trigger, {
      "aria-expanded": this.props["aria-expanded"],
      "aria-owns": overlayRendered && !this.props.isDropdown ? overlayId : undefined, // no need to set aria-owns for dropdowns, it only leads to screenreader issues
      "aria-controls": this.props.role !== "tooltip" && overlayRendered ? overlayId : undefined, // no need to set aria-controls for tootlips or dropdowns, it only leads to screenreader issues
      "aria-labelledby":
        trigger.props["aria-labelledby"] ||
        ((overlayRendered && this.hasTooltipAriaLabelledBy) || this.props.role === "tooltip" ? overlayId : undefined), // Set only if non-controlled tooltip
      onToggle: () => {
        this.onToggleVisible();
        (trigger.props.onToggle || noop)();
      },
      overlayVisible: this.props.visible,
      overlay: this.state.overlayElement,
      autofocus: this.props.interactive,
      ref: this.trigger,
      on,
      keyboardToggleDisabled: this.props.visible && this.props.sticky,
    } as Partial<TriggerProps>);
  }

  private onOverlayEnter = (overlayElement: HTMLElement) => {
    const { preferRight, preferBottom, preferCenter } = this.props;
    const triggerRect = this.getTriggerPosition();
    const overlayOrigin =
      triggerRect && typeof overlayElement.clientWidth === "number"
        ? calculateOverlayPlacement(
            triggerRect,
            overlayElement.clientWidth,
            overlayElement.clientHeight,
            preferRight,
            preferBottom,
            preferCenter
          )
        : undefined;

    this.setState({ overlayElement, overlayOrigin });
    if (!isEqual(this.state.triggerRect, triggerRect)) {
      this.setState({ triggerRect });
    }
  };

  private onOverlayExited = () => {
    if (this.props.onExited) {
      this.props.onExited();
    }
    this.setState({
      overlayElement: undefined,
      overlayOrigin: undefined,
    });
  };

  /**
   * Gets the position of the trigger with respect to the document.
   */
  private getTriggerPosition(): ClientRect | undefined {
    return this.triggerElement ? this.triggerElement.getBoundingClientRect() : undefined;
  }

  /**
   * Uses the calculated origin to apply styles that make
   * the dropdown point upwards or be right-aligned
   */
  private getClassNames(origin?: PerimeterPosition): string {
    const { styles, overlayClassName, horizontal, overlap, forceRight } = this.props;
    const position = origin != null && PerimeterPosition[origin];
    return classNames(
      overlayClassName,
      styles.positioned,
      position && Number.isInteger(origin!)
        ? {
            [styles.upward]: position.startsWith("Bottom"),
            [styles.right]: position.endsWith("Right"),
            [styles.hCenter]: position.endsWith("Center"),
            [styles.vCenter]: position.startsWith("Center"),
            [styles.horizontal]: horizontal,
            [styles.overlap]: overlap,
          }
        : undefined,
      forceRight ? styles.right : undefined
    );
  }

  private getCenteringStyle(): React.CSSProperties {
    const { portaled, backdrop } = this.props;
    const { triggerRect, overlayElement, overlayOrigin } = this.state;
    const position = overlayOrigin && PerimeterPosition[overlayOrigin];
    if (!portaled && !backdrop && position && position.endsWith("Center") && triggerRect && overlayElement) {
      return {
        left: triggerRect.width / 2 - overlayElement.clientWidth / 2,
      };
    }

    return {};
  }

  public componentDidUpdate() {
    if ((this.props.portaled || this.props.backdrop) && this.triggerElement) {
      if (this.props.visible) {
        detectTriggerMovement.register(
          this.triggerElement,
          (newTriggerRect) => {
            this.setState({ triggerRect: newTriggerRect });
          },
          this.state.triggerRect
        );
      } else {
        detectTriggerMovement.unregister(this.triggerElement);
      }
    }
  }

  public componentWillUnmount() {
    if (this.triggerElement) {
      detectTriggerMovement.unregister(this.triggerElement);
    }
  }

  /**
   * Renders a OverlayPositioner component
   * @returns {React.ReactElement<any>} OverlayPositioner component
   */
  public render() {
    const {
      style,
      styles,
      onToggleVisible,
      preferRight,
      preferBottom,
      preferCenter,
      interactive,
      trigger,
      sizeOverlayToTrigger,
      overlayId,
      overlayClassName,
      sticky,

      // Trigger
      on,

      // Transition
      transition,
      transitionIn,
      transitionOut,
      transitionDuration,
      transitionInDuration,
      transitionOutDuration,
      easing,
      easingIn,
      easingOut,

      // Overlay
      visible,
      deferRender,
      portaled,
      backdrop,
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
      role,
      "aria-labelledby": ariaLabelledBy,
      "aria-label": ariaLabel,
      "aria-expanded": ariaExpanded,
      ...props
    } = this.props;

    // Container props
    const className = classNames(styles.positioner, this.props.className);

    // Overlay props
    const transitionProps: TransitionProps = {
      transition,
      transitionIn,
      transitionOut,
      transitionDuration,
      transitionInDuration,
      transitionOutDuration,
      easing,
      easingIn,
      easingOut,
    };
    const overlayProps = {
      visible: !!visible,
      deferRender,
      portaled,
      backdrop,
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
      role,
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
    };
    const width = this.props.sizeOverlayToTrigger
      ? (this.state.triggerRect || this.getTriggerPosition() || ({} as any)).width
      : undefined;
    return (
      <div {...props} className={className} ref={(x) => (this.element = x)}>
        {this.getTrigger()}
        <Overlay
          {...overlayProps}
          aria-hidden={!this.hasTooltipAriaLabelledBy && this.props.role === "tooltip"} // Preventing Narrator to announce tooltip content multiple times
          tabIndex={!this.hasTooltipAriaLabelledBy ? -1 : undefined}
          aria-activedescendant={this.props["aria-activedescendant"]}
          data-test-for={this.props["data-test-id"]}
          onEnter={this.onOverlayEnter}
          onExited={this.onOverlayExited}
          anchorRect={this.state.triggerRect}
          className={this.getClassNames(this.state.overlayOrigin)}
          style={{ width, ...this.getCenteringStyle(), ...this.props.style }}
          onRequestClose={this.onRequestClose}
          id={this.props.overlayId || this.overlayId}
          {...pickBy(Object.assign({ origin: this.state.overlayOrigin }, transitionProps), Boolean)}
        >
          {this.props.children}
        </Overlay>
      </div>
    );
  }
}
