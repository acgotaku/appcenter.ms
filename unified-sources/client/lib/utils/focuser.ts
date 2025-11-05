import * as tabbable from "tabbable";

export function doFocus(container: HTMLElement, onFocused?: (element: HTMLElement) => void, force?: boolean): void {
  const tabbableElements: Element[] = tabbable(container, { includeContainer: true });
  const firstFocusable = tabbableElements.find(
    (element) => element !== container && element instanceof HTMLElement && element.getAttribute("data-autofocus") !== "false"
  ) as HTMLElement;

  // Focus container as a last resort
  const elementToFocus = firstFocusable || (tabbableElements[0] === container ? container : null);
  if (elementToFocus) {
    elementToFocus.focus();
    if (onFocused) {
      onFocused(elementToFocus);
    }
  } else if (force) {
    const hasTabIndex = container.hasAttribute("tabindex");
    const prevTabIndex = hasTabIndex ? container.tabIndex : undefined;
    container.tabIndex = 1;
    container.focus();
    if (hasTabIndex && typeof prevTabIndex === "number") {
      container.tabIndex = prevTabIndex;
    } else {
      container.removeAttribute("tabindex");
    }

    if (onFocused) {
      onFocused(container);
    }
  }
}
