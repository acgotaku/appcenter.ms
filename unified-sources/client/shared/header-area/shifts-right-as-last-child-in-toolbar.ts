import * as React from "react";
import hoistStatics = require("hoist-non-react-statics");
const css = require("./header-area.scss");

export const shiftsRightAsLastChildInToolbar = (WrappedComponent: React.ComponentType<{ className?: string }>): any => {
  class RightShifter extends React.Component<{ className?: string }> {
    public static displayName = `shiftsRightAsLastChildInToolbar(${WrappedComponent.displayName || WrappedComponent.name})`;
    public render() {
      const { className, children, ...props } = this.props;
      return React.createElement(
        WrappedComponent,
        {
          ...props,
          className: [css.shiftRight, this.props.className].join(" "),
        },
        children
      );
    }
  }

  hoistStatics(RightShifter, WrappedComponent);
  return RightShifter;
};
