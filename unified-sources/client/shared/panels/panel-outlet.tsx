import * as React from "react";
import * as PropTypes from "prop-types";
import { withRouter, WithRouterProps } from "react-router";
import { PanelPosition } from "./panel-position";
import { CSSTransitionGroup } from "react-transition-group";
const css = require("./panel.scss");
const { Children, cloneElement } = React;
const slideDuration = parseInt(css.panelSlideDuration, 10);
const fadeDuration = parseInt(css.panelFadeDuration, 10);
const totalDuration = Math.max(slideDuration, fadeDuration);

export interface PanelOutletProps {
  parentPanelPosition?: PanelPosition;
  passRouterToChild?: boolean;
}

@(withRouter as any)
export class PanelOutlet extends React.PureComponent<PanelOutletProps & Partial<WithRouterProps>, { spawningPanel: boolean }> {
  public static defaultProps = { passRouterToChild: true };
  public static contextTypes = { panelPosition: PropTypes.number };
  public context!: { panelPosition?: PanelPosition };
  public state = { spawningPanel: false };

  public UNSAFE_componentWillReceiveProps(nextProps: React.Props<PanelOutletProps> & Partial<WithRouterProps>) {
    if (!this.props.children && nextProps.children) {
      this.setState({ spawningPanel: true });
    } else {
      this.setState({ spawningPanel: false });
    }
  }

  public render() {
    const { children, router, passRouterToChild } = this.props;
    const { spawningPanel } = this.state;
    const position = this.props.parentPanelPosition || this.context.panelPosition;
    return (
      <CSSTransitionGroup
        transitionName={{
          enter: css.enter,
          enterActive: css.enterActive,
          leave: css.leave,
          leaveActive: css.leaveActive,
        }}
        transitionEnterTimeout={totalDuration}
        transitionLeaveTimeout={totalDuration}
        className={position === PanelPosition.Hidden ? css["transition-group-in-hidden"] : null}
      >
        {children
          ? cloneElement(Children.only(children), {
              willTransitionIn: spawningPanel,
              router: passRouterToChild ? router : undefined,
            })
          : null}
      </CSSTransitionGroup>
    );
  }
}
