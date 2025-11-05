import * as React from "react";
import { IdenticonProps, AppIcon } from "@root/shared";
import { IApp } from "@lib/common-interfaces";

export interface ManageAppIconProps extends IdenticonProps {
  app?: IApp;
}

export interface ManageAppIconState {}

export class ManageAppIcon extends React.Component<ManageAppIconProps, ManageAppIconState> {
  public render() {
    const { app } = this.props;

    // TODO: Make sure, component updates
    return <AppIcon app={app} size={100} />;
  }
}
