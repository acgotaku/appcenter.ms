/**
 * Iterates up the hierarchy of the provided element until it finds an element that has the provided attribute (and optionally value) or until it reaches the iteration limit (if provided)
 */
export const findParentWithAttribute = (
  startElement: HTMLElement | Element,
  attribute: string,
  distanceLimit?: number,
  value?: unknown
): HTMLElement | Element | null => {
  let i = 0;
  let currentElement: HTMLElement | Element | null = startElement;

  while (currentElement && !(distanceLimit && i >= distanceLimit)) {
    currentElement = currentElement.parentElement;

    if (currentElement?.hasAttribute(attribute) && (value ? currentElement.getAttribute(attribute) === value : true)) {
      return currentElement;
    }

    i++;
  }

  return null;
};
