import * as React from "react";
import { Stretch, IconSize, SingleSelectActionItem, MediaObject, Icon, IconName, Skeletal, LinkActionItem } from "@root/shared";
import { Col, Row } from "@root/shared/grid";
import * as classNames from "classnames";

const styles = require("./service-action-item.scss");

export interface ServiceActionItemProps extends Skeletal {
  icon?: IconName;
  value?: string;
  title: string;
  subTitle?: string;
  href?: string;
  to?: string;
  checked?: boolean;
  name?: string;
  accessoryItem?: JSX.Element;
  noninteractive?: boolean;
  onChange?(event: React.SyntheticEvent<HTMLElement>): void;
  onClick?(event: React.SyntheticEvent<HTMLElement>): void;
}

export class ServiceActionItem extends React.Component<ServiceActionItemProps, {}> {
  public render() {
    const { value, title, href, to, onChange, onClick, checked, noninteractive, name } = this.props;
    if (this.props.skeleton) {
      return (
        <SingleSelectActionItem disabled value={value || title} href={href} to={to}>
          {this.renderContent(true, !!this.props.icon)}
        </SingleSelectActionItem>
      );
    }

    const content = this.renderContent();
    const ActionItemTagName = typeof checked === "undefined" ? LinkActionItem : SingleSelectActionItem;

    return noninteractive ? (
      <Row className={styles["action-item"]}>{content}</Row>
    ) : (
      <ActionItemTagName
        value={value ? value : title}
        href={href}
        to={to}
        onChange={onChange}
        onClick={onClick}
        checked={checked}
        name={name}
        data-test-id="bugtracker-repro-item"
      >
        {content}
      </ActionItemTagName>
    );
  }

  private renderContent(skeleton?: boolean, skeletonHasIcon?: boolean) {
    const { icon, title, subTitle, checked, accessoryItem } = this.props;
    return (
      <Col>
        <Stretch centered>
          <MediaObject className={styles.header} skeleton={skeleton} textOnly={!icon && !skeletonHasIcon}>
            {icon || skeletonHasIcon ? <Icon icon={icon} size={IconSize.Medium} className={styles.icon} /> : null}
            <p className={classNames(styles["title"], { [styles["selected"]]: checked })}>{title}</p>
            <p className={classNames(styles["subtitle"], { [styles["selected"]]: checked })}>{subTitle}</p>
          </MediaObject>
          {accessoryItem}
        </Stretch>
      </Col>
    );
  }
}
