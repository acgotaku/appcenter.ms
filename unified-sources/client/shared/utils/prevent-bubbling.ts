import * as React from "react";

/**
 * React event handlers don’t play well with native event listeners.
 * See http://stackoverflow.com/questions/24415631 for explanation.
 */
export function preventBubbling(event: React.SyntheticEvent<any>) {
  event.stopPropagation();
  event.nativeEvent.stopPropagation();
  event.nativeEvent.stopImmediatePropagation();
}
