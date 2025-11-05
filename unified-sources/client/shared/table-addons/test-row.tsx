import * as React from "react";
import { omit } from "lodash";
import { Row, RowProps } from "../table";

const css = require("./test-row-cell.scss");
export class TestRow<T> extends React.PureComponent<RowProps, {}> {
  public static defaultProps = { styles: css };

  public render() {
    const { narrow, active, styles } = this.props;
    const passthrough: RowProps = omit(this.props, "styles", narrow && active ? ["onClick", "to"] : []);
    const classNames = [styles.row, this.props["className"], narrow ? styles.narrow : null, active ? styles.active : null].join(" ");

    return (
      <Row {...passthrough} className={classNames}>
        {this.props.children}
      </Row>
    );
  }
}
