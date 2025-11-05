import * as React from "react";
import { Identicon, IdenticonProps } from "../identicon";
import { IconName } from "../icon";
import { Space, spaceValues } from "../common-interfaces/space";

const css = require("./team-icon.scss");
const classNames = require("classnames");

export class TeamIcon extends React.Component<IdenticonProps, {}> {
  public static defaultProps: IdenticonProps = {
    size: spaceValues[Space.Large],
    styles: css,
    icon: IconName.Group,
  };

  public render() {
    const { styles, className, ...passthrough } = this.props;

    return <Identicon {...passthrough} className={classNames(styles.wrapper, className)} />;
  }
}
