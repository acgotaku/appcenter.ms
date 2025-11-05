import * as React from "react";
import { findDOMNode } from "react-dom";
import { toPairs } from "lodash";
import * as Mousetrap from "mousetrap";

export interface IHotkeyMap {
  /** Array of hotkeys e.g.: ['command+f5', 'ctrl+f5'] */
  keys: string[];
  /** Callback called when one of the key combination is pressed */
  onKeysPressed: (e?: KeyboardEvent, combo?: string) => void;
}

export type HotkeyHandlers = { [key: string]: IHotkeyMap };

export interface HotkeyManagerProps {
  /** Object of hadlers, key could be any string */
  handlers: HotkeyHandlers;
  /** An HTMLElement for HotkeyManager to operate on instead of its children. This allows you to omit `children` of HotkeyManager entirely. */
  element?: HTMLElement;
}

/**
 * Component that handles keyboard shortcuts
 */
export class HotkeyManager extends React.Component<HotkeyManagerProps> {
  private hotkeyManager: Mousetrap;

  public componentDidMount() {
    const { handlers, element, children } = this.props;
    this.hotkeyManager = new Mousetrap(element || children ? findDOMNode(this) : document.body);
    for (const [, { keys, onKeysPressed }] of toPairs(handlers)) {
      this.hotkeyManager.bind(keys, onKeysPressed);
    }
  }

  public componentWillUnmount() {
    this.hotkeyManager.reset();
  }

  public render() {
    const { element, children } = this.props;

    if (element || typeof children === "undefined") {
      return null;
    }

    return this.props.children;
  }
}
