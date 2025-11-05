import * as React from "react";
import { Row, RowProps } from "../table";

const css = require("./test-group-row.scss");
export class TestGroupRow<T> extends React.PureComponent<RowProps, {}> {
  public static defaultProps = { styles: css };

  public render() {
    const { narrow } = this.props;
    const { styles, ...passthrough } = this.props;
    const classNames = [styles.row, this.props["className"], narrow ? styles.narrow : null].join(" ");

    return (
      <Row {...passthrough} className={classNames}>
        {this.props.children}
      </Row>
    );
  }
}
