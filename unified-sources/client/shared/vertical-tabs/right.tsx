import * as React from "react";
import * as PropTypes from "prop-types";
import * as shallowEqual from "shallowequal";
import { omit } from "lodash";
import { WrapperChildProps, RightInjectedProps } from "./types";
const css = require("./vertical-tabs.scss");

export interface RightProps {
  children?: (props: Partial<RightInjectedProps>) => JSX.Element;
  styles?: any;
}

export class Right extends React.Component<RightProps & WrapperChildProps & React.HTMLAttributes<HTMLElement>, {}> {
  public static displayName = "VerticalTabs.Right";
  public static propTypes = { children: PropTypes.func.isRequired };
  public static defaultProps = { styles: css };

  public shouldComponentUpdate(nextProps: WrapperChildProps) {
    const ignored: (keyof WrapperChildProps)[] = ["forceScrollId"];
    return !shallowEqual(omit(nextProps, ignored), omit(this.props, ignored));
  }

  public render() {
    const { activeTab, onClickTab, styles, className, children, ...props } = this.props;
    const { onScrollIntoSection, forceScrollId, ...passthrough } = props;
    return (
      <div className={[className, styles.right].join(" ")} {...passthrough}>
        {children &&
          children({
            activeTab,
            onClickTab,
          })}
      </div>
    );
  }
}
