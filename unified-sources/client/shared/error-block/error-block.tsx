import * as React from "react";
import { omit } from "lodash";

const classNames = require("classnames");
const css = require("./error-block.scss");

export class ErrorBlock extends React.Component<React.HTMLAttributes<HTMLElement> & { styles?: any }, {}> {
  public static defaultProps = { styles: css };
  public render() {
    const { styles } = this.props;
    const className = classNames(this.props.className, styles.container);
    return (
      <div {...omit(this.props, "styles")} className={className}>
        {this.props.children}
      </div>
    );
  }
}
