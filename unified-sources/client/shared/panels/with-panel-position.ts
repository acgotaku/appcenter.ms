import * as React from "react";
import * as PropTypes from "prop-types";
import * as shallowEqual from "shallowequal";
import hoistNonReactStatics = require("hoist-non-react-statics");
import { PanelPosition } from "./panel-position";

export const withPanelPosition = (innerClass: React.ComponentClass<any>) => {
  class PanelPositionInjector extends React.Component<any, {}> {
    public context!: {
      panelPosition?: PanelPosition;
    };

    public static displayName = `withPanelPosition(${innerClass.displayName || innerClass.name})`;
    public static contextTypes = {
      ...innerClass.contextTypes,
      panelPosition: PropTypes.number,
    };

    public shouldComponentUpdate(nextProps: React.Props<any>, _, nextContext: { panelPosition?: PanelPosition }) {
      return !shallowEqual(this.props, nextProps) || !shallowEqual(this.context, nextContext);
    }

    public render() {
      return React.createElement(innerClass, { panelPosition: this.context.panelPosition, ...this.props });
    }
  }

  hoistNonReactStatics(PanelPositionInjector, innerClass);
  return PanelPositionInjector;
};

export { PanelPosition };
