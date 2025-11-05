import * as React from "react";
import * as classNames from "classnames";
import { Grid, Row, Col, GridSpacing } from "../grid";
import { Icon, IconName, IconSize } from "../icon";
import { TextColor } from "../utils/color";
import { Size, Text } from "../typography";
const css = require("./action-list-add.scss");

export interface ActionListAddProps extends React.HTMLAttributes<HTMLElement> {
  largeIcon?: boolean;
  text: string;
  textSize?: Size.Large | Size.Medium;
  onClick?(event: React.MouseEvent<HTMLElement>): void;
  to?: string;
  href?: string;
  target?: string;
  styles?: any;
}

export class ActionListAdd extends React.Component<ActionListAddProps, {}> {
  public static defaultProps: Object = {
    largeIcon: false,
    styles: css,
  };

  public onClick = (e: React.MouseEvent<HTMLElement>) => {
    if (!this.props.href) {
      e.preventDefault();
    }
    if (this.props.onClick) {
      this.props.onClick(e);
    }
  };

  public render() {
    const { onClick, text, to, className, largeIcon, styles, href, target, textSize, ...passthrough } = this.props;
    const row = classNames(className, styles.row);
    const container = !largeIcon ? styles.container : styles["large-container"];
    const iconSize = !largeIcon ? IconSize.XSmall : IconSize.Small;
    const rowProps = to ? { to } : { tagName: "a", href: href || "#", onClick: this.onClick, target: target };
    return (
      <Grid {...passthrough} padded rowSpacing={GridSpacing.Large}>
        <Row role="button" {...rowProps} className={row}>
          <Col>
            <div className={container}>
              <Icon icon={IconName.Add} size={iconSize} color={TextColor.Link} className={styles.icon} />
              <Text size={textSize || Size.Large} className={styles.text}>
                {text}
              </Text>
            </div>
          </Col>
        </Row>
      </Grid>
    );
  }
}
