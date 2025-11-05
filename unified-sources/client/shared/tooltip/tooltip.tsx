import * as React from "react";
import { noop, uniqueId } from "lodash";
import { autorun, Lambda } from "mobx";
import { OverlayTransition } from "../overlay";
import { Trigger, TriggerProps, getTriggerFromChildren } from "../trigger";
import { Icon, IconProps } from "../icon";
import { ClickableIcon } from "../button";
import { Paragraph, Size, Space } from "../typography";
import { OverlayPositioner, DefaultizedOverlayPositionerProps } from "../overlay-positioner";
import { globalUIStore } from "@root/stores/global-ui-store";
import * as classNames from "classnames/bind";
import { Omit } from "@lib/common-interfaces";
const css = require("./tooltip.scss");

/**
 * Props passed to a Tooltip component
 */
export interface TooltipProps extends Omit<DefaultizedOverlayPositionerProps, "trigger"> {
  title?: string;
  multiline?: boolean;
  tooltipDescription?: string; // what the screenreader will announce besides the tooltip content. So this should usually be the text of the trigger
}

/**
 * Props passed to a IconTooltip component
 */
export interface IconTooltipProps extends TooltipProps {
  iconStyle?: object;
  clickable?: boolean;
}

/**
 * Tooltip component state
 */
export interface TooltipState {
  visible: boolean;
}

/**
 * Base Tooltip component
 */
export class Tooltip extends React.PureComponent<TooltipProps, {}> {
  /**
   * Fallback values used when props aren't passed to the Tooltip component
   * @static
   */
  public static defaultProps = {
    onToggleVisible: noop,
    on: "hover",
    interactive: false,
    styles: css,
  };

  /**
   * Tooltip component state
   * @type {TooltipState}
   */
  public state: TooltipState = {
    visible: false,
  };

  public uid = uniqueId("tooltip-");
  public dispose: Lambda = noop;

  /**
   * Gets whether Tooltip is a controlled or uncontrolled component
   * Details: https://facebook.github.io/react/docs/forms.html#controlled-components
   * @readonly
   * @private
   * @type {boolean}
   */
  private get isControlled(): boolean {
    return this.props.hasOwnProperty("visible");
  }

  /**
   * Gets whether Tooltip is visible
   * @readonly
   */
  get visible() {
    return this.isControlled ? this.props.visible : this.state.visible;
  }

  /**
   * Toggles visibility of Tooltip
   */
  private toggleVisible = (): void => {
    const visible = !this.visible;
    if (!this.isControlled) {
      this.setState({ visible });
    }
    if (visible) {
      globalUIStore.tooltip.setUID(this.uid);
    } else {
      globalUIStore.tooltip.unsetUID(this.uid);
    }
    this.props.onToggleVisible!(visible);
  };

  public hide = () => {
    if (this.visible) {
      if (!this.isControlled) {
        this.setState({ visible: false });
      }
      globalUIStore.tooltip.unsetUID(this.uid);
      this.props.onToggleVisible!(false);
    }
  };

  private getTrigger() {
    const trigger = getTriggerFromChildren(this.props.children, "Tooltip");
    const childOfTrigger = React.Children.toArray(trigger.props.children)[0];
    const triggerIsClickable = (childOfTrigger as React.ReactElement<any>)?.props.onClick;
    const props = Object.assign({}, trigger.props, {
      tabIndex: trigger.props.tabIndex || 0,
      role: "button",
      "aria-roledescription": this.props.tooltipDescription || `tooltip trigger ${triggerIsClickable ? "button" : ""}`,
      "aria-labelledby": !this.isControlled ? this.uid : undefined, // Controlled tooltips should rely on the hidden element with aria-live
    }) as TriggerProps;
    return React.cloneElement(trigger, props, trigger.props.children);
  }

  private get tooltipBodyTestClass() {
    return {
      "data-test-class": "tooltip-body",
    };
  }

  /**
   * Gets non-Trigger children
   * @returns {Array.<React.ReactElement<any> | string | number>}
   */
  private getBody(addTestClass: boolean = false) {
    const children = React.Children.toArray(this.props.children).slice(1);

    // The id will go on the wrapper around the body and the title
    if (this.props.title) {
      return children;
    }

    // Clone the only child to add the id to it
    const child = children[0];
    if (children.length === 1 && typeof child === "object") {
      return React.cloneElement(child, { id: this.uid, ...this.tooltipBodyTestClass });
    }

    // Put a wrapper around the children with the id
    return (
      <div id={this.uid} {...this.tooltipBodyTestClass}>
        {children}
      </div>
    );
  }

  public componentDidMount() {
    this.dispose = autorun(() => {
      if (globalUIStore.tooltip.uid !== this.uid) {
        this.hide();
      }
    });
  }

  public componentWillUnmount() {
    this.dispose();
  }

  public render() {
    const { styles, className, title, multiline, overlayClassName, transition, transitionOut, ...passthrough } = this.props;
    const children = title ? (
      <div {...this.tooltipBodyTestClass} className={styles.multilineContainer} id={this.uid}>
        <Paragraph tagName="div" className={styles.title} spaceBelow={Space.XSmall} size={Size.Medium} bold invert>
          {title}
        </Paragraph>
        {/* The space is because VoiceOver is dumb */}
        {this.getBody()}
      </div>
    ) : (
      this.getBody(true)
    );
    return (
      <>
        {/*
          This is a hidden content that is announced to screen readers with the same content as the visible tooltip
          It's used to fix an issue where Narrator is announcing the content twice on tooltip triggers with role=button
        */}
        {this.isControlled && this.visible ? (
          <div aria-live="polite" className={styles.screenReaderOnly}>
            {children}
          </div>
        ) : null}
        <OverlayPositioner
          preferCenter={!title}
          preferBottom={!title}
          {...passthrough}
          tabTrap={false}
          visible={this.visible}
          onToggleVisible={this.toggleVisible}
          trigger={this.getTrigger()}
          onRequestClose={this.hide}
          className={classNames(className, styles.container)}
          overlayClassName={classNames.call(styles, overlayClassName, "tooltip", { multiline: multiline || title })}
          role="tooltip"
          data-test-class={classNames("tooltip", this.props["data-test-class"])}
          transitionOut={transitionOut || transition || OverlayTransition.Fade}
        >
          {children}
        </OverlayPositioner>
      </>
    );
  }
}

/**
 * Tooltip component with an Icon Trigger
 */
export class IconTooltip extends React.Component<IconTooltipProps & IconProps, {}> {
  public static defaultProps = { styles: css, clickable: false };

  /**
   * Renders an IconTooltip component
   * @returns {React.ReactElement<any>} IconTooltip component
   */
  public render() {
    const {
      children,
      styles,
      tabIndex,
      "aria-label": ariaLabel,
      icon,
      size,
      area,
      color,
      invert,
      iconStyle,
      clickable,
      ...props
    } = this.props;
    const iconPassthrough = { size, area, color, invert, icon, style: iconStyle };

    return (
      <Tooltip {...props}>
        <Trigger tabIndex={clickable ? undefined : tabIndex} aria-label={ariaLabel}>
          {clickable ? (
            <ClickableIcon icon={<Icon className={styles.icon} {...iconPassthrough} />} />
          ) : (
            <span>
              <Icon className={styles.icon} {...iconPassthrough} />
              {/* Edge doesn't support focusing on svg element */}
            </span>
          )}
        </Trigger>
        {children}
      </Tooltip>
    );
  }
}
