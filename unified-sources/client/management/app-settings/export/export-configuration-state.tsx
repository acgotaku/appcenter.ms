import * as React from "react";
import { ExportState } from "@root/data/management";
import * as classNames from "classnames";

const styles = require("./export-configuration-state.scss");

export interface ExportConfigurationStateProps {
  state: ExportState;
}

export class ExportConfigurationState extends React.Component<ExportConfigurationStateProps, any> {
  public render() {
    const className = classNames(styles["state-label"], styles[this.props.state.toLowerCase()]);
    return (
      <span data-test-class="export-state" className={className}>
        {this.props.state}
      </span>
    );
  }
}
