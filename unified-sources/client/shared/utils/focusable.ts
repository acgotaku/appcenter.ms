import { constant } from "lodash";
import * as memoize from "memoizee";
import { assertUnreachable } from "./assertions";

const unavailable = createIsUnavailable(document);

/**
 * Determines whether an element which can normally be focused
 * (e.g., links, buttons, non-disabled inputs) can be focused in its
 * current visibility state. Specifically, checks if the element
 * is in the DOM and is not `display: none` (by itself or any parents).
 */
export function focusCandidateIsAvailable(element: HTMLElement) {
  return document.body.contains(element) && !unavailable(element);
}

// Portions used from tabbable.js, Copyright (c) 2015 David Clark
// https://github.com/davidtheclark/tabbable/blob/828557296e9b3dcfbcf6b73cda8754558249fd03/index.js#L77-L115

const candidateSelectors = ["input", "select", "a[href]", "textarea", "button", "[tabindex]"];

const matchesSelector = (element: Element, selector: string) => {
  const matches = Element.prototype.matches || (Element.prototype as any).msMatchesSelector || Element.prototype.webkitMatchesSelector;
  return matches.call(element, selector);
};

const candidateIsFocusable = (candidate: Element, boundary?: Element) => {
  // Not entirely true, but true for Edge, and it doesn’t matter for us
  if (!(candidate instanceof HTMLElement)) {
    return false;
  }

  const candidateTabIndexAttr = candidate.getAttribute("tabindex");

  const tabIndex = (candidateTabIndexAttr && parseInt(candidateTabIndexAttr, 10)) || candidate.tabIndex;

  return !(
    tabIndex < 0 ||
    (candidate instanceof HTMLInputElement && candidate.type === "hidden") ||
    candidate["disabled"] ||
    unavailable(candidate)
  );
};

function createIsUnavailable(elementDocument: Document) {
  // "off" means `display: none;`, as opposed to "hidden",
  // which means `visibility: hidden;`. getComputedStyle
  // accurately reflects visiblity in context but not
  // "off" state, so we need to recursively check parents.

  function isOff(node: Element, nodeComputedStyle?: CSSStyleDeclaration, boundary: Element = elementDocument.documentElement) {
    if (node === boundary || node === elementDocument.documentElement) {
      return false;
    }

    nodeComputedStyle = nodeComputedStyle || elementDocument.defaultView!.getComputedStyle(node);

    let result = false;

    if (nodeComputedStyle.display === "none") {
      result = true;
    } else if (node.parentElement) {
      result = isOff(node.parentElement);
    }

    return result;
  }

  return function isUnavailable(node: HTMLElement, boundary: Element = elementDocument.documentElement) {
    if (node === boundary || node === elementDocument.documentElement) {
      return false;
    }
    const computedStyle = elementDocument.defaultView!.getComputedStyle(node);
    if (isOff(node, computedStyle)) {
      return true;
    }
    return computedStyle.visibility === "hidden";
  };
}

/**
 * Determines whether an element is focusable
 * @param element The element to check for focusability
 * @param boundary To determine that an element is focusable, we have to check its ancestors for `display: none`. A boundary can be optionally passed to stop checking ancestors if it’s known that a parent is visible.
 */
export function isFocusable(element: Element, boundary?: Element) {
  return candidateSelectors.some((selector) => matchesSelector(element, selector)) && candidateIsFocusable(element, boundary);
}

const createFocusableElementWalker = memoize(
  (withinNode: Element) => {
    return document.createTreeWalker(withinNode, NodeFilter.SHOW_ELEMENT, {
      acceptNode: (candidateNode) => {
        if (!(candidateNode instanceof HTMLElement) || candidateNode.hasAttribute("inert")) {
          return NodeFilter.FILTER_REJECT;
        }

        return isFocusable(candidateNode, withinNode) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
      },
    });
  },
  { length: 1 }
);

const walkUntil = (walk: () => Node | null, predicate: (node: HTMLElement) => boolean) => {
  let node: HTMLElement | null;
  while ((node = walk() as HTMLElement)) {
    if (predicate(node)) {
      return node;
    }
  }
};

export const getNextFocusable = (
  node: Element | null,
  withinNode: Element | null | undefined,
  filter: (node: HTMLElement) => boolean = constant(true)
) => {
  if (!withinNode || !node) {
    return undefined;
  }
  const walker = createFocusableElementWalker(withinNode);
  walker.currentNode = node;
  return walkUntil(() => walker.nextNode(), filter) as HTMLElement | undefined;
};

export const getPreviousFocusable = (
  node: Element | null,
  withinNode: Element | null | undefined,
  filter: (node: HTMLElement) => boolean = constant(true)
) => {
  if (!withinNode || !node) {
    return undefined;
  }
  const walker = createFocusableElementWalker(withinNode);
  walker.currentNode = node;
  return walkUntil(() => walker.previousNode(), filter) as HTMLElement | undefined;
};

export const getFocusableOutside = (node: Element | null, direction: "forward" | "backward"): HTMLElement | null | undefined => {
  if (!node) {
    return undefined;
  }
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT, {
    acceptNode: (candidateNode) => {
      if (candidateNode === node || !(candidateNode instanceof HTMLElement) || node.contains(candidateNode)) {
        return NodeFilter.FILTER_REJECT;
      }
      return isFocusable(candidateNode as Element) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
    },
  });

  walker.currentNode = node;
  switch (direction) {
    case "forward":
      return walker.nextNode() as HTMLElement;
    case "backward":
      return walker.previousNode() as HTMLElement;
    default:
      assertUnreachable(direction);
  }
};

export const getLastFocusable = (
  withinNode: Element | null | undefined,
  filter: (node: HTMLElement) => boolean = constant(true)
): HTMLElement | undefined => {
  if (!withinNode) {
    return undefined;
  }
  const walker = createFocusableElementWalker(withinNode);
  walker.currentNode = withinNode;
  let lastChild: HTMLElement | undefined;
  while (walker.lastChild()) {
    // You have to call `lastChild` recursively to get to the very last node
    lastChild = walker.currentNode as HTMLElement;
  }

  if (lastChild && filter(lastChild)) {
    return lastChild;
  }

  return walkUntil(() => walker.previousNode(), filter) as HTMLElement | undefined;
};

export const getFirstFocusable = (
  withinNode: Element | null | undefined,
  filter: (node: HTMLElement) => boolean = constant(true)
): HTMLElement | undefined => {
  if (!withinNode) {
    return undefined;
  }
  const walker = createFocusableElementWalker(withinNode);
  walker.currentNode = withinNode;
  return walkUntil(() => walker.nextNode(), filter) as HTMLElement | undefined;
};
