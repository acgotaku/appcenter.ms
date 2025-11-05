import { PerimeterPosition } from "../common-interfaces";

export function getPositionStyle(origin: PerimeterPosition, anchorRect: ClientRect, horizontal: boolean, overlap: boolean) {
  const screen = document.documentElement.getBoundingClientRect();
  switch (origin) {
    case PerimeterPosition.TopLeft:
      return {
        left: horizontal ? anchorRect.right - screen.left : anchorRect.left - screen.left,
        top: overlap || horizontal ? anchorRect.top : anchorRect.bottom,
        right: "auto",
        bottom: "auto",
      };
    case PerimeterPosition.TopCenter:
      return {
        left: anchorRect.left + anchorRect.width / 2,
        top: anchorRect.bottom,
        right: "auto",
        bottom: "auto",
        transform: "translateX(-50%)",
      };
    case PerimeterPosition.TopRight:
      return {
        right: horizontal ? screen.right - anchorRect.left : screen.right - anchorRect.right,
        top: overlap || horizontal ? anchorRect.top : anchorRect.bottom,
        left: "auto",
        bottom: "auto",
      };
    case PerimeterPosition.BottomLeft:
      return {
        left: horizontal ? anchorRect.right - screen.left : anchorRect.left - screen.left,
        bottom: overlap || horizontal ? screen.bottom - anchorRect.bottom : screen.bottom - anchorRect.top,
        right: "auto",
        top: "auto",
      };
    case PerimeterPosition.BottomCenter:
      return {
        left: anchorRect.left + anchorRect.width / 2,
        bottom: screen.bottom - anchorRect.top,
        right: "auto",
        top: "auto",
        transform: "translateX(-50%)",
      };
    case PerimeterPosition.BottomRight:
      return {
        right: horizontal ? screen.right - anchorRect.left : screen.right - anchorRect.right,
        bottom: overlap || horizontal ? screen.bottom - anchorRect.bottom : screen.bottom - anchorRect.top,
        left: "auto",
        top: "auto",
      };
    case PerimeterPosition.CenterRight:
      return {
        right: horizontal ? screen.right - anchorRect.left : screen.right - anchorRect.right,
        top: anchorRect.top + anchorRect.height,
        left: "auto",
        bottom: "auto",
        transform: "translateY(-50%)",
      };
    case PerimeterPosition.CenterLeft:
      return {
        left: horizontal ? anchorRect.right - screen.left : anchorRect.left - screen.left,
        top: anchorRect.top + anchorRect.height,
        right: "auto",
        bottom: "auto",
        transform: "translateY(-50%)",
      };
    case PerimeterPosition.FloatingLeft:
      return {
        left: horizontal ? anchorRect.right - screen.left : anchorRect.left - screen.left,
        top: "50%",
        right: "auto",
        bottom: "auto",
        transform: "translateY(-50%)",
      };
    case PerimeterPosition.FloatingCenter:
      return {
        left: anchorRect.left + anchorRect.width / 2,
        top: "50%",
        right: "auto",
        bottom: "auto",
        transform: "translateY(-50%)",
      };
    case PerimeterPosition.FloatingRight:
      return {
        right: horizontal ? screen.right - anchorRect.left : screen.right - anchorRect.right,
        top: "67%",
        left: "auto",
        bottom: "auto",
        transform: "translateY(-50%)",
      };
  }
}
