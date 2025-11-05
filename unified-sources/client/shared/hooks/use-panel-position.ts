import { useContext } from "react";
import { PanelPositionContext, PanelPosition } from "../panels";

/**
 * Gets the current panel position from context.
 */
export function usePanelPosition(): PanelPosition {
  return useContext(PanelPositionContext);
}
