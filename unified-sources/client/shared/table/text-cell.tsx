import * as React from "react";
import { observer } from "mobx-react";
import { Cell, CellProps } from "../table/cell";
const css = require("./text-cell.scss");

export class TextCell extends React.Component<CellProps, {}> {
  public static Observer = Object.assign(observer(TextCell), { Cell: Cell.Observer });
  public static Cell = Cell;
  public render() {
    // This pattern is explained in query-builder.tsx.
    // It can be removed with mobx-react 4, so I won’t go into further detail here.
    const { Cell } = this.constructor as typeof TextCell;
    return <Cell {...this.props} className={[this.props.className, css.ellipsize].join(" ")} />;
  }
}
