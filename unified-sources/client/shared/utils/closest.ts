export default (element: Element | null, iteratee: (element: Element) => boolean): Element | null => {
  while ((element = element && element.parentElement)) {
    if (iteratee(element)) {
      return element;
    }
  }

  return null;
};
