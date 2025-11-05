import * as React from "react";

export interface IdleRendererProps {
  children?: JSX.Element;
  delay?: number;
  delayInitialRender?: boolean;
  delayUpdates?: boolean;
}

export class IdleRenderer extends React.Component<IdleRendererProps, {}> {
  public static defaultProps = {
    delay: 150,
    delayInitialRender: true,
    delayUpdates: false,
  };

  private firstRender = true;
  private hasPendingUpdate = false;

  private scheduleUpdate() {
    if (!this.hasPendingUpdate) {
      this.hasPendingUpdate = true;
      setTimeout(() => {
        this.forceUpdate();
        this.hasPendingUpdate = false;
      }, this.props.delay);
    }
  }

  public componentDidMount() {
    this.firstRender = false;
    this.scheduleUpdate();
  }

  public UNSAFE_componentWillReceiveProps() {
    if (this.props.delayUpdates) {
      this.scheduleUpdate();
    }
  }

  public shouldComponentUpdate() {
    return !this.props.delayUpdates;
  }

  public render() {
    const { delayInitialRender, children } = this.props;
    return this.firstRender && delayInitialRender ? null : React.Children.only(children);
  }
}
