import * as React from "react";
import * as classNames from "classnames/bind";
import { range } from "lodash";
const css = require("./toggle-buttons.scss");
const cx = classNames.bind(css);

export interface ToggleButtonsProps extends React.HTMLAttributes<HTMLElement> {
  /** The number of buttons to render, i.e., the number of times the `children` iteratee is called. */
  buttonCount: number;
  /** The index of the selected button. Use `null` to clear the selection. */
  selectedIndex?: number | null;
  /** An iteratee called once per `buttonCount` to render.  */
  children: (
    props: {
      key: number;
      className: string;
      "data-test-class": string;
      "data-test-state": string;
      "data-test-index": string;
    },
    selected: boolean,
    index: number
  ) => JSX.Element;
}

/**
 * A flexible base component for rendering a series of side-by-side Buttons,
 * zero or one of which can be in a selected state.
 */
export class ToggleButtons extends React.PureComponent<ToggleButtonsProps> {
  public render() {
    const { buttonCount, selectedIndex, children, className, ...props } = this.props;
    return (
      <div className={cx("toggle-buttons", className)} {...props}>
        {range(0, buttonCount).map((index) =>
          children(
            {
              key: index,
              "data-test-class": "toggle-button",
              "data-test-state": index === selectedIndex ? "pressed" : "",
              "data-test-index": index.toString(),
              className: cx("toggle-button", {
                first: index === 0,
                last: index === buttonCount - 1,
              }),
            },
            index === selectedIndex,
            index
          )
        )}
      </div>
    );
  }
}
