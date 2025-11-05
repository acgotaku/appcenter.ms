import * as React from "react";

export interface UpdateBlockerProps {
  active: boolean;
  children?: React.ReactNode;
}

export class UpdateBlocker extends React.Component<UpdateBlockerProps> {
  public shouldComponentUpdate(nextProps: UpdateBlockerProps) {
    if (nextProps.active) {
      return false;
    }

    return this.props.children !== nextProps.children;
  }

  public render() {
    return this.props.children;
  }
}
