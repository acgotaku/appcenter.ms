import * as React from "react";
import { PanelPosition } from "../";
import { maskMatches } from "../utils/bitmask";
import { usePanelPosition } from "../hooks";
const classNames = require("classnames/bind");
const css = require("./grid.scss");

export interface ColProps extends React.HTMLAttributes<HTMLElement> {
  width?: number;
  primary?: number;
  secondary?: number;
  first?: boolean | PanelPosition;
  last?: boolean | PanelPosition;
  shrink?: boolean | PanelPosition;
  hideUntilRowHover?: boolean;
  hideUntilGridHover?: boolean;
  styles?: any;
}

function ColComponent(props: ColProps) {
  const panelPosition = usePanelPosition();

  const getClasses = () => {
    const { className, width, primary, secondary, first, last, shrink, hideUntilRowHover, hideUntilGridHover, styles } = props;
    const panelPositionCols = panelPosition === PanelPosition.Primary ? primary : secondary;
    const cols = typeof panelPositionCols === "number" ? panelPositionCols : width;
    const cx = classNames.bind(styles);
    return cx(className, cols && cols > 0 ? `col-xs-${cols}` : "col-xs", {
      hidden: cols === 0,
      "first-xs": maskMatches(first!, panelPosition),
      "last-xs": maskMatches(last!, panelPosition),
      "col-shrink": maskMatches(shrink!, panelPosition),
      "hide-until-hover": hideUntilRowHover,
      "hide-col-until-grid-hover": hideUntilGridHover,
    });
  };

  const { width, primary, secondary, first, last, shrink, hideUntilRowHover, hideUntilGridHover, styles, ...passthrough } = props;
  return (
    <div {...passthrough} className={getClasses()}>
      {props.children}
    </div>
  );
}

ColComponent.defaultProps = {
  styles: css,
};

export const Col = React.memo(ColComponent);
