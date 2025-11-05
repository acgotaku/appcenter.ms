import * as React from "react";
import { findDOMNode } from "react-dom";
import { isButton } from "../button/button";
import { Keys, mergeRefs } from "../utils";
import { flowRight as compose, get, eq } from "lodash/fp";
const classNames = require("classnames");
const { Children, cloneElement } = React;
const css = require("./trigger.scss");

export interface TriggerInjectedProps extends React.ClassAttributes<HTMLElement | React.Component> {
  "aria-activedescendant"?: string;
  "aria-controls"?: string;
  "aria-owns"?: string;
  "aria-expanded"?: boolean;
  "aria-haspopup"?: boolean;
  "data-test-class": string;
  active: boolean;
  className: string;
  onClick?: React.MouseEventHandler<HTMLElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLElement>;
  onFocus?: React.FocusEventHandler<HTMLElement>;
  onBlur?: React.FocusEventHandler<HTMLElement>;
  onMouseEnter?: React.MouseEventHandler<HTMLElement>;
  onMouseLeave?: React.MouseEventHandler<HTMLElement>;
}

export interface TriggerProps extends React.HTMLAttributes<HTMLElement> {
  autofocus?: boolean;
  disabled?: boolean;
  overlayVisible?: boolean;
  overlay?: HTMLElement;
  on?: string;
  mouseOutTime?: number;
  activeClassName?: string;
  onToggle?(): void;
  styles?: any;
  keyboardToggleDisabled?: boolean;
  children: JSX.Element | ((props: TriggerInjectedProps) => JSX.Element);
  stopPropagationOnToggle?: boolean;
  childRef?: React.RefObject<Element>;
  skipAreaExpandedTracking?: boolean;
}

/**
 * Base Trigger component
 */
export class Trigger extends React.PureComponent<TriggerProps, {}> {
  public static defaultProps = {
    mouseOutTime: 250,
    tabIndex: 0,
    styles: css,
  };

  public state = {
    mouseIn: false,
  };

  public child: HTMLElement | null = null;
  public overlayTimeoutID?: NodeJS.Timer | number;
  public triggerTimeoutID?: NodeJS.Timer | number;

  public onKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (!this.props.keyboardToggleDisabled && [Keys.Enter, Keys.Space].includes(event.which)) {
      this.onToggle(event);
    }

    if (this.props.onKeyDown) {
      this.props.onKeyDown(event);
    }
  };

  public onToggle = (event?: React.SyntheticEvent<HTMLElement>) => {
    if (event) {
      event.preventDefault();
      if (this.props.stopPropagationOnToggle) {
        event.stopPropagation();
      }
    }
    if (this.props.autofocus && this.child && this.child.focus) {
      this.child.focus();
    }
    if (this.props.onToggle) {
      this.props.onToggle();
    }
  };

  public overlayOnMouseEnter = () => {
    this.setState({ mouseIn: true });
  };

  public overlayOnMouseLeave = () => {
    this.setState({ mouseIn: false });
    this.overlayTimeoutID = setTimeout(() => {
      if (!this.state.mouseIn && this.props.overlayVisible) {
        this.onToggle();
      }
    }, this.props.mouseOutTime);
  };

  public triggerOnMouseEnter = () => {
    this.setState({ mouseIn: true });
    if (!this.props.overlayVisible) {
      this.onToggle();
    }
  };

  public onFocus = (event: React.FocusEvent<HTMLElement>) => {
    if (!this.props.overlayVisible) {
      this.onToggle();
    }
    if (this.props.onFocus) {
      this.props.onFocus(event);
    }
  };

  public onBlur = (event: React.FocusEvent<HTMLElement>) => {
    if (!this.state.mouseIn && this.props.overlayVisible) {
      this.triggerOnMouseLeave(0);
    }
    if (this.props.onBlur) {
      this.props.onBlur(event);
    }
  };

  public triggerOnMouseLeave = (timeout = this.props.mouseOutTime) => {
    this.setState({ mouseIn: false });
    this.triggerTimeoutID = setTimeout(() => {
      if (!this.state.mouseIn && this.props.overlayVisible && this.props.onToggle) {
        this.props.onToggle();
      }
    }, timeout);
  };

  private handleOnMouseLeave = () => this.triggerOnMouseLeave();

  get handlers() {
    if (!this.props.disabled) {
      return this.props.on === "hover"
        ? { onFocus: this.onFocus, onBlur: this.onBlur, onMouseEnter: this.triggerOnMouseEnter, onMouseLeave: this.handleOnMouseLeave }
        : { onClick: this.onToggle, onKeyDown: this.onKeyDown };
    }
  }

  public componentDidUpdate(prevProps: TriggerProps) {
    if (this.props.on === "hover" && !prevProps.overlay && this.props.overlay) {
      this.props.overlay.addEventListener("mouseenter", this.overlayOnMouseEnter);
      this.props.overlay.addEventListener("mouseleave", this.overlayOnMouseLeave);
    }
  }

  public componentWillUnmount() {
    if (this.props.on === "hover" && this.props.overlay) {
      this.props.overlay.removeEventListener("mouseenter", this.overlayOnMouseEnter);
      this.props.overlay.removeEventListener("mouseleave", this.overlayOnMouseLeave);
    }
    if (this.overlayTimeoutID) {
      clearTimeout(this.overlayTimeoutID as number);
    }
    if (this.triggerTimeoutID) {
      clearTimeout(this.triggerTimeoutID as number);
    }
  }

  public render() {
    const {
      children,
      overlayVisible,
      autofocus,
      disabled,
      overlay,
      mouseOutTime,
      on,
      activeClassName,
      onToggle,
      keyboardToggleDisabled,
      styles,
      stopPropagationOnToggle,
      skipAreaExpandedTracking,
      ...props
    } = this.props;

    const className = classNames(this.props.className, {
      [activeClassName!]: activeClassName && overlayVisible,
      [styles["active"]]: overlayVisible,
    });

    if (typeof children === "function") {
      return children({
        className,
        "data-test-class": "trigger",
        active: !!overlayVisible,
        "aria-expanded": this.props.hasOwnProperty("aria-expanded") && !!this.props["aria-expanded"],
        ...this.handlers,
      });
    }

    const child = Children.only(children) as React.DOMElement<any, Element> | React.ReactElement<any>;

    const active = isButton(child) && !child.props.disabled ? { active: overlayVisible } : {};
    const passthrough = {
      ...props,
      ...this.handlers,
      ...active,
      "aria-expanded": skipAreaExpandedTracking ? undefined : this.props["aria-expanded"],
      className: classNames(child.props.className, className),
      style: Object.assign({}, child.props.style, this.props.style),
      ref: mergeRefs("ref" in child ? child.ref : undefined, (x) => (this.child = x && (findDOMNode(x) as HTMLElement))),
      tabIndex: child.props.tabIndex || this.props.tabIndex,
      "data-test-class": classNames(this.props["data-test-class"], child.props["data-test-class"], "trigger"),
    };
    return cloneElement(child, passthrough, child.props.children);
  }
}

/**
 * Whether a ReactElement is a Trigger
 */
export const isTrigger = compose(eq(Trigger), get("type"));

/**
 * Gets Trigger from children, when Trigger is the first child
 * @returns {React.ReactElement<any>}
 */
export function getTriggerFromChildren(children: React.ReactNode, componentName?: string): React.ReactElement<TriggerProps> {
  const firstChild = React.Children.toArray(children)[0] as React.ReactElement<any>;
  if (process.env.NODE_ENV !== "production" && !isTrigger(firstChild)) {
    const componentNameOrEmpty = (componentName || "").trim() ? ` of ${componentName}` : "";
    const childType = firstChild["type"];
    const childConstructorName = typeof childType === "string" ? childType : childType.prototype.constructor.name;
    throw new Error(`First child ${componentNameOrEmpty} must be a Trigger (received ${childConstructorName} instead)`);
  }
  return firstChild;
}
