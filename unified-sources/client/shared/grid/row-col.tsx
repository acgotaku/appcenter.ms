import * as React from "react";
import { PanelPosition } from "../panels/panel-position";
import { NavigationListItemProps } from "../list";
import { Row } from "./row";
import { Col } from "./col";

export interface RowColProps {
  width?: number;
  primary?: number;
  secondary?: number;
  href?: string;
  to?: string;
  start?: boolean | PanelPosition;
  center?: boolean | PanelPosition;
  end?: boolean | PanelPosition;
  visible?: boolean | PanelPosition;
  className?: string;
  [key: string]: any;
}

export class RowCol extends React.Component<RowColProps & Partial<NavigationListItemProps>, {}> {
  public render() {
    const { width, primary, secondary, first, last, shrink, hideUntilRowHover, hideUntilGridHover, ...passthrough } = this.props;

    const colProps = {
      width,
      primary,
      secondary,
      first,
      last,
      shrink,
      hideUntilRowHover,
      hideUntilGridHover,
    };

    return (
      <Row {...passthrough}>
        <Col {...colProps}>{this.props.children}</Col>
      </Row>
    );
  }
}
