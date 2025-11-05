import { useState, useRef, useEffect, RefAttributes } from "react";
import createDetectElementResize from "react-virtualized/dist/commonjs/vendor/detectElementResize";
import { debounce } from "lodash";
import { findDOMNode } from "react-dom";
const { addResizeListener, removeResizeListener } = createDetectElementResize();

export interface OverflowDetectionOptions {
  detectResize?: boolean;
  debounceResize?: number;
}

export type OverflowDetectionProps = RefAttributes<any>;

export function useOverflowDetection({ detectResize = true, debounceResize = 500 }: OverflowDetectionOptions = {}): [
  boolean,
  OverflowDetectionProps
] {
  const [isOverflowing, setIsOverflowing] = useState(false);
  const componentRef = useRef<Element | React.Component<any>>(null);
  const elementRef = useRef<Element | null>(null);
  const { current: handleResize } = useRef(
    debounce(() => {
      if (elementRef.current) {
        setIsOverflowing(elementRef.current.scrollWidth > elementRef.current.clientWidth);
      }
    }, debounceResize)
  );

  // Set element from component
  useEffect(() => {
    const element = componentRef.current && findDOMNode(componentRef.current);
    if (element instanceof Element) {
      elementRef.current = element;
    }
    // TODO: fix rules-of-hooks for legacy code
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [componentRef.current]);

  // Attach resize handlers to element and evaluate immediately
  useEffect(() => {
    handleResize();
    if (detectResize && elementRef.current) {
      addResizeListener(elementRef.current, handleResize);
      return () => removeResizeListener(elementRef.current, handleResize);
    }
    // TODO: fix rules-of-hooks for legacy code
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elementRef.current]);

  return [isOverflowing, { ref: componentRef }];
}

// Render prop component for use in class components, where hook can’t be used

export interface OverflowDetectorProps extends OverflowDetectionOptions {
  children: (isOverflowing: boolean, overflowProps: OverflowDetectionProps) => JSX.Element;
}

export function OverflowDetector({ children, ...options }: OverflowDetectorProps) {
  const [isOverflowing, overflowProps] = useOverflowDetection(options);
  return children(isOverflowing, overflowProps);
}
