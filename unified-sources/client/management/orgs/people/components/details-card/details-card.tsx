import * as React from "react";
import { Card, GridCol as Col, GridRow as Row } from "@root/shared";
const styles = require("./details-card.scss");
const classNames = require("classnames");

export interface DetailsCardProps {
  primaryTitleArea: React.ReactNode;
  secondaryTitleArea: React.ReactNode;
  condensed: boolean;
  selected: boolean;
  iconListArea?: React.ReactNode;
  menu?: React.ReactNode;
  showMenuOnHover?: boolean;
}

export class DetailsCard extends React.Component<DetailsCardProps, {}> {
  public render() {
    const { condensed, menu, primaryTitleArea, secondaryTitleArea, selected, iconListArea, ...passthrough } = this.props;
    const cardClassName = classNames(styles.wrapper, { [styles.condensed]: condensed, [styles.selected]: selected });

    return (
      <Card className={cardClassName} withoutPadding {...passthrough}>
        <Row middle>
          <Col primary={iconListArea ? 5 : 9} secondary={iconListArea ? 4 : 12}>
            {primaryTitleArea}
          </Col>
          <Col width={iconListArea ? (condensed ? 8 : menu ? 7 : 5) : 0}>{iconListArea}</Col>
          <Col primary={2} secondary={0}>
            {secondaryTitleArea}
          </Col>
          <Col hideUntilGridHover width={condensed || !menu ? 0 : 1}>
            {menu}
          </Col>
        </Row>
      </Card>
    );
  }
}
