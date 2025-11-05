import * as React from "react";
import * as PropTypes from "prop-types";
import { curry } from "lodash";
import { Keys } from "../utils/keys";

interface KeyboardEvents {
  [keyCode: number]: ((event: KeyboardEvent) => void)[];
}

export interface KeyboardEventManagerChildContext {
  keyboardEventManager: {
    addListener(keyCode: number, listener: (event: KeyboardEvent) => void): void;
    addEscapeListener(listener: (event: KeyboardEvent) => void): void;
    addEnterListener(listener: (event: KeyboardEvent) => void): void;
    addSpaceListener(listener: (event: KeyboardEvent) => void): void;
    removeListener(keyCode: number, listener: (event: KeyboardEvent) => void): void;
    removeEscapeListener(listener: (event: KeyboardEvent) => void): void;
    removeEnterListener(listener: (event: KeyboardEvent) => void): void;
    removeSpaceListener(listener: (event: KeyboardEvent) => void): void;
  };
}

export class KeyboardEventManager extends React.Component<{}, any> {
  public static childContextTypes = {
    keyboardEventManager: PropTypes.shape({
      addListener: PropTypes.func,
      addEscapeListener: PropTypes.func,
      addEnterListener: PropTypes.func,
      addSpaceListener: PropTypes.func,
      removeListener: PropTypes.func,
      removeEscapeListener: PropTypes.func,
      removeEnterListener: PropTypes.func,
      removeSpaceListener: PropTypes.func,
    }),
  };

  private events: KeyboardEvents = {};

  public addListener = curry(((keyCode: number, listener: (event: KeyboardEvent) => void): void => {
    this.events[keyCode] = (this.events[keyCode] || []).concat(listener);
  }) as (keyCode: number, listener: (event: KeyboardEvent) => void) => void);

  public removeListener = curry(((keyCode: number, listener: (event: KeyboardEvent) => void): void => {
    // Short-circuit if no listeners exist for pressed key
    if (!this.events.hasOwnProperty(keyCode) || !this.events[keyCode].length) {
      return;
    }
    const array = this.events[keyCode];
    const index = array.indexOf(listener);
    // Short-circuit if listener queued for removal does not exist
    if (index === -1) {
      return;
    }
    this.events[keyCode] = array.slice(0, index).concat(array.slice(index + 1));
  }) as (keyCode: number, listener: (event: KeyboardEvent) => void) => void);

  public getChildContext = (): KeyboardEventManagerChildContext => {
    return {
      keyboardEventManager: {
        addListener: this.addListener,
        addEscapeListener: this.addListener(Keys.Escape),
        addEnterListener: this.addListener(Keys.Enter),
        addSpaceListener: this.addListener(Keys.Space),
        removeListener: this.removeListener,
        removeEscapeListener: this.removeListener(Keys.Escape),
        removeEnterListener: this.removeListener(Keys.Enter),
        removeSpaceListener: this.removeListener(Keys.Space),
      },
    };
  };

  public onKeyDown = (event: KeyboardEvent): void => {
    // Short-circuit if no listener exists for pressed key
    if (!this.events.hasOwnProperty(event.which) || !this.events[event.which].length) {
      return;
    }

    if (event.which === Keys.Escape) {
      event.preventDefault();
    }

    const events = this.events[event.which];
    // Invoke the last event (events is a stack)
    events[events.length - 1](event);
  };

  public componentDidMount() {
    window.addEventListener("keydown", this.onKeyDown);
  }

  public componentWillUnmount() {
    window.removeEventListener("keydown", this.onKeyDown);
  }

  public render() {
    const child = React.Children.only(this.props.children);
    return React.cloneElement(child, this.props, child.props.children);
  }
}
