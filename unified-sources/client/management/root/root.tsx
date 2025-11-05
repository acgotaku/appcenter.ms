import * as React from "react";
import { RouteComponentProps } from "react-router";

export class Root extends React.Component<RouteComponentProps<any, any>, {}> {
  public render() {
    return this.props.children;
  }
}
