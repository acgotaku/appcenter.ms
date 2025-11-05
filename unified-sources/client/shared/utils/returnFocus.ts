import { findParentWithAttribute } from "./findParentWithAttribute";

/**
 *  Set focus to button which might be a part of a context menu
 *  */
export const setFocusToButton = (focusReturnElement: HTMLElement) => {
  const elementIsTrigger =
    focusReturnElement.hasAttribute("aria-owns") ||
    focusReturnElement.hasAttribute("aria-haspopup") ||
    focusReturnElement.getAttribute("role") === "combobox";

  // caution: this will find any overlay, not just context menus, also for example our Popover components
  const contextMenu = findParentWithAttribute(focusReturnElement, "data-test-class", 5, "overlay-body");

  if (contextMenu && !elementIsTrigger) {
    /** this is for context menus - when the user closes the dialog, the context menu will be closed, so we can only focus the button that
      opens the context menu, not the button in that context menu that was actually used to open the dialog */
    const contextMenuTrigger = document.querySelector(`[aria-owns=${contextMenu.getAttribute("id")}]`);

    if (contextMenuTrigger) {
      keepTryingFocus(contextMenuTrigger as HTMLElement);
    }
  } else {
    keepTryingFocus(focusReturnElement);
  }
};

const fallbackSelectors = ["id", "data-test-id", "href"];

/**
 * Try to focus an element using several methods and selectors if necessary
 *  */
const keepTryingFocus = async (element: HTMLElement) => {
  let focusAttempts = 0;

  // the element might take some time to appear in the DOM, so keep trying with progressively higher delays
  while (focusAttempts < 30 && !(await tryFocus(element)) && !findElementBySelector(element)) {
    await new Promise((res) => {
      setTimeout(res, 10);
    });

    focusAttempts++;
  }
};

/**  Try a bunch of fallback selectors that could help us find the element in 
    cases when somehow the reference to the element is no longer valid*/
const findElementBySelector = (element: HTMLElement) => {
  for (const selector of fallbackSelectors) {
    let matchingElement: Element | null;

    if (selector === "href") {
      matchingElement = document.querySelector(`a[${selector}='${element.getAttribute(selector)}']`);
    } else {
      matchingElement = document.querySelector(`[${selector}=${element.getAttribute(selector)}`);
    }

    if (matchingElement && matchingElement.isEqualNode(element)) {
      (matchingElement as HTMLElement).focus();
      return true;
    }
  }
};

const tryFocus = (element: HTMLElement) => {
  if (document.body.contains(element)) {
    element.focus();
    return true;
  }

  return false;
};

export const needToFocusElement = (element: HTMLElement) => {
  const tag = element.tagName.toLowerCase();

  if (tag === "a") {
    // exception for external links
    return !(element.getAttribute("target") === "_blank");
  } else if (element.getAttribute("aria-label")?.includes("drop-zone")) {
    // exception for drop-zone components
    return false;
  } else if (
    element.getAttribute("data-test-class")?.includes("cancel") ||
    element.getAttribute("data-test-id")?.includes("cancel") ||
    element.innerText?.toLowerCase().includes("cancel")
  ) {
    // exception for "cancel" buttons
    return false;
  }
  return true;
};
