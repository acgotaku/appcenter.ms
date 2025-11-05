import * as React from "react";
import { ProgressProps, Progress } from "../progress";
import { PanelPosition } from "../panels/panel-position";
import { Color } from "../utils/color";

export interface PageProgressProps extends ProgressProps {
  panelPosition: PanelPosition;
}

export class PageProgress extends React.PureComponent<PageProgressProps> {
  public render() {
    const { loading, panelPosition, ...passthrough } = this.props;
    const color = panelPosition === PanelPosition.Primary ? Color.Blue : null;
    return <Progress loading={panelPosition === PanelPosition.Primary && loading} color={color} {...passthrough} />;
  }
}
