import * as React from "react";
import { Col, Grid, MediaObject, OrganizationIcon, Paragraph, Size, Skeletal, Space } from "@root/shared";
import { Row } from "@root/shared/grid";

const className = require("classnames");

const styles = require("./close-account-action-list.scss");

export interface CloseAccountActionListProps<T> extends Skeletal {
  items: T[];
  renderIcon: (item: T) => React.ReactNode;
  renderTitle: (item: T) => string;
  renderSubTitle?: (item: T) => string;
  renderAction: (item: T) => React.ReactNode;
  getKey: (item: T) => any;
  first?: boolean;
}

const renderSkeletonRow = (key: any) => (
  <Row key={key} className={className(styles.item)}>
    <Col className={styles.col}>
      <MediaObject skeleton hSpace={Space.Medium}>
        <OrganizationIcon skeleton size={30} />
        <Paragraph bold size={Size.Medium} className={styles["action-item-title"]} />
        <Paragraph size={Size.Small} className={styles["action-item-subtitle"]} />
      </MediaObject>
    </Col>
    <Col shrink></Col>
  </Row>
);

export class CloseAccountActionList<T> extends React.Component<CloseAccountActionListProps<T>, {}> {
  render() {
    if (this.props.skeleton) {
      return (
        <Grid padded>
          {renderSkeletonRow(1)}
          {renderSkeletonRow(2)}
        </Grid>
      );
    }
    const { items, renderIcon, renderTitle, renderSubTitle, renderAction, getKey, first } = this.props;
    return (
      <Grid padded>
        {items.map((item: T) => {
          return (
            <Row key={getKey(item)} className={className(styles.item, { [styles.first]: first })}>
              <Col className={styles.col}>
                <MediaObject className={styles["action-item"]}>
                  {renderIcon(item)}
                  <Paragraph bold size={Size.Medium} className={styles["action-item-title"]}>
                    {renderTitle(item)}
                  </Paragraph>
                  {renderSubTitle ? (
                    <Paragraph size={Size.Small} className={styles["action-item-subtitle"]}>
                      {renderSubTitle(item)}
                    </Paragraph>
                  ) : null}
                </MediaObject>
              </Col>
              <Col shrink>{renderAction(item)}</Col>
            </Row>
          );
        })}
      </Grid>
    );
  }
}
