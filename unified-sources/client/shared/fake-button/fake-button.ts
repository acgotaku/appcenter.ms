import * as React from "react";
import * as classNames from "classnames";
import { noop } from "lodash";
import { Keys } from "../utils/keys";
import { HTMLTagNames } from "@lib/common-interfaces/html-tag-names";
const { createElement } = React;
const css = require("./fake-button.scss");

export interface FakeButtonProps extends React.HTMLAttributes<HTMLElement> {
  onClick?(event: React.SyntheticEvent<HTMLElement>);
  tagName?: HTMLTagNames;
  /* sometimes we may want to use this component to allow mouse users to click an entire area, instead of just a button in that area,
    but we need to ensure that this doesn't interfere with keyboard navigation and overall accessibility behavior.
    This was needed for example for bug 93287 */
  mouseOnly?: boolean;
}

export class FakeButton extends React.PureComponent<FakeButtonProps, {}> {
  private element: HTMLElement | null = null;
  public static defaultProps = { tagName: "div", onClick: noop };

  public onKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (this.props.onKeyDown) {
      this.props.onKeyDown(event);
    }

    if ((event.which === Keys.Space || event.which === Keys.Enter) && event.target === this.element) {
      event.stopPropagation();
      event.preventDefault();
      this.element.click();
    }
  };

  public render() {
    const { tagName, mouseOnly, ...passthrough } = this.props;
    return createElement<React.HTMLAttributes<HTMLElement>, HTMLElement>(tagName!, {
      ref: (x) => (this.element = x),
      role: "button",
      tabIndex: mouseOnly ? -1 : 0,
      ...passthrough,
      onKeyDown: this.onKeyDown,
      className: classNames(css.fakeButton, this.props.className),
    });
  }
}
