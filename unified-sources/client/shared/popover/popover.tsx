import * as React from "react";
import { noop, uniqueId } from "lodash";
import { OverlayTransition } from "../overlay";
import { getTriggerFromChildren } from "../trigger/trigger";
import { ClickableIcon } from "../button/button";
import { IconName } from "../icon/icon";
import { Keys } from "../utils/keys";
import { OverlayPositioner, DefaultizedOverlayPositionerProps } from "../overlay-positioner/overlay-positioner";
import { notifyScreenReader } from "@root/stores/notification-store";
import { isSafari } from "../utils/environment";
import { globalUIStore } from "@root/stores";
import { Omit } from "@lib/common-interfaces";

const classNames = require("classnames/bind");
const css = require("./popover.scss");

/**
 * Props passed to a Popover component
 */
export interface PopoverProps extends Omit<DefaultizedOverlayPositionerProps, "trigger"> {
  title?: string;
  onToggleVisible?(visible: boolean): void;
  styles?: any;
  [key: string]: any;
}

/**
 * Popover component state
 */
export interface PopoverState {
  visible: boolean;
}

type DefaultProps = {
  onToggleVisible(visible: boolean): void;
  transitionOut: OverlayTransition;
  styles: { [key: string]: string };
};

/**
 * Base Popover component
 */
export const Popover = class Popover extends React.PureComponent<PopoverProps & DefaultProps, PopoverState> {
  /**
   * Fallback values used when props aren't passed to the Popover component
   * @static
   */
  public static defaultProps: DefaultProps = {
    onToggleVisible: noop,
    transitionOut: OverlayTransition.Fade,
    styles: css,
  };

  /**
   * Popover component state
   * @type {PopoverState}
   */
  public state: PopoverState = {
    visible: false,
  };

  public id = uniqueId();
  public overlaypositioner: OverlayPositioner | null = null;

  /**
   * Gets whether Popover is a controlled or uncontrolled component
   * Details: https://facebook.github.io/react/docs/forms.html#controlled-components
   * @readonly
   * @private
   * @type {boolean}
   */
  private get isControlled(): boolean {
    return this.props.hasOwnProperty("visible");
  }

  /**
   * Gets unique identifier for a Popover’s associated title
   * @returns {string}
   */
  public getTitleId(): string {
    return `title-${this.id}`;
  }

  /**
   * Gets whether Popover is visible
   * @readonly
   */
  private get visible() {
    return this.isControlled ? this.props.visible : this.state.visible;
  }

  /**
   * Toggles visibility of Popover
   */
  private toggleVisible = () => {
    const { title } = this.props;
    const visible = !this.visible;
    // When a closed Dropdown is first opened, focus its Trigger (if exists)
    if (visible) {
      ((this.triggerElement as HTMLElement).focus || noop).call(this.triggerElement);
      if (title && isSafari) {
        notifyScreenReader({ message: title, delay: 100 });
      }
    }
    if (!this.isControlled) {
      this.setState({ visible });
    }
    this.props.onToggleVisible(visible);
  };

  private onKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    switch (event.which) {
      case Keys.Escape:
        break;
      case Keys.Enter:
        event.preventDefault();
        event.stopPropagation();
        this.toggleVisible();
        break;
      default:
        event.stopPropagation();
    }
  };

  private get triggerElement() {
    if (!this.overlaypositioner || !this.overlaypositioner.element || this.overlaypositioner.element.childElementCount === 0) {
      return undefined;
    }

    return this.overlaypositioner.element.children[0];
  }

  /**
   * Gets non-Trigger children
   * @returns {Array.<React.ReactElement<any> | string | number>}
   */
  private getPane(): (React.ReactElement<any> | string | number)[] {
    return React.Children.toArray(this.props.children).slice(1);
  }

  private onOverlayEnter = (overlayElement: HTMLElement) => {
    globalUIStore.setDialogOrPopoverOpen(this.id);
    if (this.props.onEnter) {
      this.props.onEnter(overlayElement);
    }
  };

  private onOverlayExited = () => {
    globalUIStore.setDialogOrPopoverClosed(this.id);
    if (this.props.onExited) {
      this.props.onExited();
    }
  };

  componentWillUnmount() {
    globalUIStore.setDialogOrPopoverClosed(this.id);
  }

  /**
   * Renders a Popover component
   * @returns {React.ReactElement<any>} Popover component
   */
  public render() {
    const { sticky, className } = this.props;
    const { visible, title, onToggleVisible, styles, ...passthrough } = this.props;
    const cx = classNames.bind(styles);
    return (
      <OverlayPositioner
        backdrop
        role="dialog"
        {...passthrough}
        trigger={getTriggerFromChildren(this.props.children, "Popover")}
        visible={this.visible}
        onRequestClose={sticky ? noop : this.toggleVisible}
        onToggleVisible={this.toggleVisible}
        className={cx(className, "popover")}
        overlayClassName={cx("popover-body")}
        onKeyDown={this.onKeyDown}
        onEnter={this.onOverlayEnter}
        onExited={this.onOverlayExited}
        ref={(x) => (this.overlaypositioner = x)}
        aria-label={title}
      >
        <div aria-labelledby={this.getTitleId()} className={styles["top-container"]}>
          <h3 id={this.getTitleId()} aria-label={title} className={styles.title} data-test-class="popover-title">
            {title}
          </h3>
          <div>
            <ClickableIcon
              data-test-class="popover-close-button"
              icon={IconName.Close}
              onClick={this.toggleVisible}
              className={styles.close}
            />
          </div>
        </div>
        {this.getPane()}
      </OverlayPositioner>
    );
  }
} as React.ComponentClass<PopoverProps, PopoverState>;
