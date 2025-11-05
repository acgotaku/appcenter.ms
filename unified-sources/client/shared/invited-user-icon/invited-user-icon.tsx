import * as React from "react";
import { Identicon, IdenticonProps } from "../identicon/identicon";
import { IconName } from "../icon/icon";
import { Space, spaceValues } from "../common-interfaces/space";

const css = require("./invited-user-icon.scss");
const classNames = require("classnames");

export class InvitedUserIcon extends React.Component<IdenticonProps, {}> {
  public static defaultProps: IdenticonProps = {
    size: spaceValues[Space.Large],
    styles: css,
  };

  public render() {
    const { className, styles, ...flowThrough } = this.props;
    return <Identicon {...flowThrough} icon={IconName.Email} className={classNames(styles.wrapper, className)} />;
  }
}
