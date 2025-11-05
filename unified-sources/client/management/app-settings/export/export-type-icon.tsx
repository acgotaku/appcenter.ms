import * as React from "react";
import { ExportType } from "@root/data/management";
import * as classNames from "classnames";

const iconBlob = require("./assets/analytics-export-icon-blob.svg");
const iconAppInsights = require("./assets/analytics-export-icon-insights.svg");

const styles = require("./export-type-icon.scss");

export interface ExportTypeIconProps extends React.HTMLAttributes<HTMLElement> {
  exportType: ExportType;
  big?: boolean;
}

export class ExportTypeIcon extends React.Component<ExportTypeIconProps, any> {
  public render() {
    const className = classNames(this.props.className, styles.icon, this.props.big && styles.big);
    return <img alt="" role="presentation" className={className} src={this.iconSrc()} />;
  }

  private iconSrc() {
    switch (this.props.exportType) {
      case ExportType.BlobStorage:
        return iconBlob;
      case ExportType.AppInsights:
        return iconAppInsights;
      default:
        return null;
    }
  }
}
