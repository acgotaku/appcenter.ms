import * as React from "react";
import * as PropTypes from "prop-types";
import { noop } from "lodash";
import { wrapPrimitive } from "@root/shared/utils/wrapPrimitive";
const css = require("./vertical-tabs.scss");
const { cloneElement, Children } = React;

interface WrapperState {
  activeTab: number;
  forceScrollId: number;
}

export interface WrapperProps extends React.HTMLAttributes<HTMLElement> {
  onChangeTab?(index: number): void;
  styles?: any;
}

export class Wrapper extends React.PureComponent<WrapperProps, WrapperState> {
  public static displayName = "VerticalTabs.Wrapper";
  public static propTypes = { onChangeTab: PropTypes.func.isRequired };
  public static defaultProps = { styles: css, onChangeTab: noop };
  public state = { activeTab: 0, forceScrollId: 0 };

  public updateActiveTab = (index: number, forceUpdate = false) => {
    this.setState(
      {
        activeTab: index,
        forceScrollId: this.state.forceScrollId + Number(forceUpdate),
      },
      () => {
        this.props.onChangeTab!(index);
      }
    );
  };

  public updateActiveTabAndForceScroll = (index: number) => {
    this.updateActiveTab(index, true);
  };

  public render() {
    const { styles, className, children, ...props } = this.props;
    const { onChangeTab, ...passthrough } = props;
    return (
      <div className={[styles.wrapper, className].join(" ")} {...passthrough}>
        {Children.map(children, (child) =>
          cloneElement(wrapPrimitive(child), {
            activeTab: this.state.activeTab,
            forceScrollId: this.state.forceScrollId,
            onScrollIntoSection: this.updateActiveTab,
            onClickTab: this.updateActiveTabAndForceScroll,
          })
        )}
      </div>
    );
  }
}
