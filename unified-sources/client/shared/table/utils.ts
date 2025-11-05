import { spaceValues, Space } from "../common-interfaces";
import { RowHeight } from "./types";

const CHECKBOX_CELL_WIDTH = 52;
const ACTION_WIDTH = spaceValues[Space.Large];
const ACTION_MARGIN = spaceValues[Space.XSmall];
//                     Left padding                Right padding               Standard right-shift for ClickableIcons
const ACTION_PADDING = spaceValues[Space.XSmall] + spaceValues[Space.Medium] - spaceValues[Space.XXSmall];

const isFixedWidth = (width) => typeof width === "string" && width.endsWith("px");

export const getFixedWidthColumns = (columns, selectable) =>
  columns.reduce(
    ({ count, total }, { width }) =>
      isFixedWidth(width)
        ? {
            count: count + 1,
            total: total + parseFloat(width),
          }
        : { count, total },
    { count: 0, total: selectable ? CHECKBOX_CELL_WIDTH : 0 }
  );

export const cellWidth = (width: number, totalFixedWidth: number, nColumns: number, nActions?: number) => {
  const isFixed = isFixedWidth(width);
  const value = isFixed ? width : `${width * 100}%`;
  if (nActions) {
    totalFixedWidth += nActions * ACTION_WIDTH + (nActions - 1) * ACTION_MARGIN + (nActions ? ACTION_PADDING : 0);
  }
  return totalFixedWidth && !isFixed ? `calc(${value} - ${totalFixedWidth / nColumns}px)` : value;
};

export const verifyColumns = (columns, fixedColumnCount) => {
  if (fixedColumnCount === columns.length) {
    throw new Error(
      "All columns provided to Table specified pixel widths. At least one column’s width must be specified as a percentage."
    );
  } else if (Math.abs(columns.reduce((sum, c) => sum + (isFixedWidth(c.width) ? 0 : c.width), 0) - 1) > Number.EPSILON) {
    throw new Error("The sum of all percentage-width column widths was not 100%. Make sure percentage widths add to 1.");
  }
};

export const rowHeights: { [K in RowHeight]: number } = {
  [RowHeight.Compact]: 40,
  [RowHeight.SingleLine]: 48,
  [RowHeight.MultiLine]: 64,
};
