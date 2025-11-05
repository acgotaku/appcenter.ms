import { PerimeterPosition } from "../common-interfaces";

const getBottomFit = (anchorRect: ClientRect, overlayHeight: number, context: ClientRect, margin: number) =>
  anchorRect.top - overlayHeight - context.top - margin;

const getTopFit = (anchorRect: ClientRect, overlayHeight: number, context: ClientRect, margin: number) =>
  context.height - anchorRect.bottom - overlayHeight - margin;

const getRightFit = (anchorRect: ClientRect, overlayWidth: number, context: ClientRect, margin: number) =>
  anchorRect.right - overlayWidth - Math.abs(context.left) - margin;

const getLeftFit = (anchorRect: ClientRect, overlayWidth: number, context: ClientRect, margin: number) => {
  const width = context.left + context.right;
  return width - anchorRect.left - overlayWidth - margin;
};

const getHorizontalCenterFit = (anchorRect: ClientRect, overlayWidth: number, context: ClientRect, margin: number) =>
  Math.min(
    getLeftFit(anchorRect, (overlayWidth - anchorRect.width) / 2, context, margin),
    getRightFit(anchorRect, (overlayWidth - anchorRect.width) / 2, context, margin)
  );

const getVerticalCenterFit = (anchorRect: ClientRect, overlayHeight: number, context: ClientRect, margin: number) =>
  Math.min(getBottomFit(anchorRect, overlayHeight / 2, context, margin), getTopFit(anchorRect, overlayHeight / 2, context, margin));

export default function calculateOverlayPlacement(
  anchorRect: ClientRect,
  overlayWidth: number,
  overlayHeight: number,
  preferRight = false,
  preferBottom = false,
  preferCenter = false,
  horizontal = false,
  overlap = false,
  context = document.documentElement,
  margin = 60
): PerimeterPosition {
  const screen = context.getBoundingClientRect();
  const topFit = getTopFit(anchorRect, overlayHeight, screen, margin);
  const bottomFit = getBottomFit(anchorRect, overlayHeight, screen, margin);
  const bestTopBottomFit = Math.max(topFit, bottomFit); //    HOW TO READ THIS CRAZY NESTED TERNARY, LINE BY LINE:
  const v =
    topFit >= 0 && bottomFit >= 0 // 1. Top and bottom both fit
      ? preferBottom
        ? "Bottom"
        : "Top" //    so go with top unless bottom is specifically preferred.
      : bestTopBottomFit > 0 // 2. Either top or bottom fit
      ? bestTopBottomFit === topFit
        ? "Top"
        : "Bottom" //    so go with whichever one fit.
      : (() => {
          // 3. Neither top nor bottom fit
          const verticalCenterFit = getVerticalCenterFit(anchorRect, overlayHeight, screen, margin); //    so calculate the fit vertically centered,
          const bestVerticalFit = Math.max(bestTopBottomFit, verticalCenterFit); //    and compare that to the top and bottom fit.
          return bestVerticalFit > -margin // 4. If there is any option which fits on the screen,
            ? bestVerticalFit === topFit
              ? "Top" //    ignoring margin, go with that.
              : bestVerticalFit === bottomFit
              ? "Bottom" //    Otherwise, use 'Floating' to get the absolute
              : "Center" //    most overlay on-screen as possible.
            : "Floating";
        })();

  // Center is kind of special; we won’t center something unless it’s specifically preferred.
  if (preferCenter) {
    const centerFit = getHorizontalCenterFit(anchorRect, overlayWidth, screen, margin);
    if (centerFit >= 0) {
      return (PerimeterPosition as any)[v + "Center"];
    }
  }

  const rightFit = getRightFit(anchorRect, overlayWidth, screen, margin);
  const leftFit = getLeftFit(anchorRect, overlayWidth, screen, margin);
  const bestHorizontalFit = Math.max(rightFit, leftFit);

  const h = rightFit >= 0 && leftFit >= 0 ? (preferRight ? "Right" : "Left") : bestHorizontalFit === leftFit ? "Left" : "Right";

  return (PerimeterPosition as any)[v + h];
}
