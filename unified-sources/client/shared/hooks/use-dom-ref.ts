import { useRef, useEffect } from "react";
import { findDOMNode } from "react-dom";

/**
 * Returns two interconnected ref objects.The second can be passed to the `ref` prop
 * of any React component, after which the first will contain the DOM node rendered
 * by that component.
 */
export function useDOMRef(
  initialValue: Element | Text | null = null
): [React.MutableRefObject<Element | Text | null>, React.MutableRefObject<any>] {
  const componentRef = useRef<React.ReactInstance>(null);
  const domRef = useRef(initialValue);
  useEffect(() => {
    if (componentRef.current) {
      const element = findDOMNode(componentRef.current);
      domRef.current = element;
    }
    // TODO: fix rules-of-hooks for legacy code
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [componentRef.current]);

  // TODO: fix rules-of-hooks for legacy code
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return [domRef, componentRef];
}

/**
 * Returns two interconnected ref objects.The second can be passed to the `ref` prop
 * of any React component, after which the first will contain the DOM element rendered
 * by that component. Throws if the node is a text node rather than an element node.
 */
export function useDOMElementRef(
  initialValue: Element | null = null
): [React.MutableRefObject<Element | null>, React.MutableRefObject<any>] {
  const [domRef, componentRef] = useDOMRef(initialValue);
  useEffect(() => {
    if (domRef.current instanceof Text) {
      throw new Error(
        "Props returned from `useArrowKeyFocus` must be spread over an element that renders a DOM Element. " +
          "DOM Text was rendered instead."
      );
    }
    // TODO: fix rules-of-hooks for legacy code
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domRef.current]);

  return [domRef as React.MutableRefObject<Element | null>, componentRef];
}
