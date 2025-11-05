import * as React from "react";
import { omit } from "lodash";
import { Autofocus, AutofocusProps } from "./autofocus";
import { transitionListener } from "../transition-listener";
import { globalUIStore } from "@root/stores/global-ui-store";

export interface AutofocusAfterTransitionProps extends Partial<AutofocusProps> {
  /** The amount of time (in milliseconds) after the component mounts to wait for a transition-end notification from `transitionListener` before focusing its target. Used as a safety measure to ensure focus gets set in the event of malfunctioning CSS transition events. */
  timeout?: number;
  /** Prevents focusing from happening. Transitioning from `false` to `true` will execute a focus that was skipped while disabled. */
  disabled?: boolean;
}

export const AutofocusAfterTransition = transitionListener(
  class extends React.PureComponent<AutofocusAfterTransitionProps, { transitioned: boolean }> {
    public static displayName = "AutofocusAfterTransition";
    public static defaultProps = { timeout: Infinity };

    public state = { transitioned: false };
    private timerId =
      this.props.timeout! < Infinity ? setTimeout(() => this.setState({ transitioned: true }), this.props.timeout) : null;

    // In some circumstances, panels can get focused before a transition has actually finished.
    // When that happens, if the element that receives focus is still transformed outside the bounds
    // of LayoutWithLeftNav’s viewport element, the browser will set that viewport element’s
    // `scrollLeft` to bring the focused element into view. When the transition completes moments
    // later, the viewport element is left in a ridiculous state with the content all scrolled to
    // the left and cut off, and you can’t scroll back to normal because the element doesn’t
    // actually scroll. So, just to make sure that never happens, reset the scroll position after
    // every focus-after-transition.
    //
    // Technically, a cleaner and more accurate way to do this is to do the same thing in an
    // `onScroll` handler on the viewport element itself. (Then, context wouldn’t be necessary.)
    // But, I was concerned about the cost of all scroll events bubbling up and firing that event
    // handler, even though the handler would be very cheap (it starts by strict equal comparing
    // `event.target` and `event.currentTarget` to filter out bubbled events). I’m not actually
    // sure which approach is better, but since Autofocus already performs DOM access at a time
    // it thinks should be convenient, I chose to lump the viewport scroll resetting in with that
    // DOM access rather than adding a scroll event handler that would run all the time.
    private preventLurching = () => {
      document.body.scrollLeft = 0;
      if (globalUIStore.viewportElement) {
        globalUIStore.viewportElement.scrollLeft = 0;
      }
    };

    public componentDidEnter() {
      clearTimeout(this.timerId!);
      this.setState({ transitioned: true });
    }

    public componentWillUnmount() {
      clearTimeout(this.timerId!);
    }

    public render() {
      const passthrough = omit(this.props, "timeout");
      return <Autofocus {...passthrough} focus={!this.props.disabled && this.state.transitioned} onFocused={this.preventLurching} />;
    }
  }
);
