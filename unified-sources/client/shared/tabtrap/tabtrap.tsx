import * as React from "react";
import * as PropTypes from "prop-types";
import * as tabbable from "tabbable";
const css = require("./tabtrap.scss");

const maybeFocus = (element: Element) => {
  if (element instanceof HTMLElement) {
    element.focus();
  }
};

const Sentinel: React.StatelessComponent<React.HTMLAttributes<HTMLSpanElement>> = (props) => {
  return <span data-autofocus="false" className={css.sentinel} tabIndex={0} onFocus={props.onFocus} />;
};
Sentinel.propTypes = {
  onFocus: PropTypes.func.isRequired,
};

export interface TabTrapProps extends React.HTMLAttributes<HTMLElement> {
  active: boolean;
  styles?: { [key: string]: string };
}

export class TabTrap extends React.Component<TabTrapProps, {}> {
  public container: HTMLDivElement | null = null;

  /* <input>s, <select>s, <textarea>s, <button>s, <a>s with href
   * attributes or non-negative tabindexes, anything else with a
   * non-negative tabindex, in their actual tab order.
   */
  private get tabbableElements(): [HTMLElement] {
    return tabbable(this.container);
  }

  private onBlur = (event: React.FocusEvent<Element>) => {
    // Trap Tab to container when Sentinels are the only focusable elements
    if (this.props.active && this.container && this.tabbableElements.length <= 2) {
      maybeFocus(this.container);
    }
  };

  private onSentinalFocus = (event: React.FocusEvent<Element>) => {
    const { tabbableElements } = this;
    // Short-circuit when Sentinels are the only focusable elements
    if (tabbableElements.length <= 2) {
      return;
    }

    // A Sentinel is focused. Focus must wrap around. Pass focus to a non-Sentinel element.
    const focusIndex = event.currentTarget === tabbableElements[0] ? tabbableElements.length - 2 : 1;
    maybeFocus(tabbableElements[focusIndex]);
  };

  public render() {
    const { styles, children, active, ...passthrough } = this.props;
    return (
      <div {...passthrough} ref={(x) => (this.container = x)} tabIndex={0} onBlur={this.onBlur} data-autofocus="false">
        <Sentinel onFocus={this.onSentinalFocus} />
        {children}
        <Sentinel onFocus={this.onSentinalFocus} />
      </div>
    );
  }
}
