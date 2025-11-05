import * as React from "react";
import { useRef, useContext, useCallback, useMemo } from "react";
import { constant } from "lodash";
import { PanelPosition } from "../panels";
import {
  Keys,
  canMoveSelectionLeft,
  getPreviousFocusable,
  canMoveSelectionRight,
  getNextFocusable,
  getFirstFocusable,
  getLastFocusable,
} from "../utils";
import { useDOMElementRef } from "./use-dom-ref";
import { maskMatches } from "../utils/bitmask";
import { usePanelPosition } from "./use-panel-position";
import { globalUIStore } from "@root/stores";

type Orientation = "vertical" | "horizontal";

export interface UseArrowKeyFocusOptions {
  /** Allows the HOC’s special event handling to be turned on or off entirely. */
  enableArrowKeyFocus?: boolean | PanelPosition;
  /** Allows some focusable elements to be filtered out as candidates for arrow key focus. Useful for nested ArrowKeyFocusers to prevent the outer from focusing elements that should be handled by the inner. */
  focusableElementFilter?: (element: HTMLElement) => boolean;
  /** Allows setting a custom container to be used for the boundary upon which the ArrowKeyFocuser will operate. Defaults to `findDOMNode()` of the wrapped component. */
  focusContainer?: HTMLElement | null;
  /** Controls whether up/down or left/right arrow keys are used to move focus */
  orientation: Orientation;
}

export interface UseArrowKeyFocusProps extends React.RefAttributes<any> {
  onKeyDown: React.KeyboardEventHandler<HTMLElement>;
  onFocus: React.FocusEventHandler<HTMLElement>;
  onFocusCapture: React.FocusEventHandler<HTMLElement>;
  onBlurCapture: React.FocusEventHandler<HTMLElement>;
  onMouseDownCapture: React.MouseEventHandler<HTMLElement>;
}

/** Maps an Orientation to a tuple representing the key code that should move focus backward and forward, respectively */
const keys: { [K in Orientation]: [number, number] } = {
  vertical: [Keys.Up, Keys.Down],
  horizontal: [Keys.Left, Keys.Right],
};

type Focuser = {
  focusContainer: Element;
  isReceivingFocus: boolean;
  focusableElementFilter: UseArrowKeyFocusOptions["focusableElementFilter"];
};

type RunInTopEnabledFocuserFunction = (
  fn: (focuser: Focuser) => void,
  event: React.SyntheticEvent<Element>,
  stopPropagation: boolean,
  childFocuser?: Focuser
) => void;

const ArrowKeyFocuserContext = React.createContext<RunInTopEnabledFocuserFunction | undefined>(undefined);

/**
 * A hook that enhances the wrapped component with focus management via arrow keys.
 * Pressing arrow keys while focus is inside the component will move focus between
 * focus targets within the component; pressing tab or shift+tab will move focus
 * outside the component.
 *
 * Returns a tuple containing a context boundary component and props to be spread
 * over the DOM element wrapping the UI that should be controlled by the keyboard.
 *
 * @example
 * const [ContextProvider, useArrowKeyFocusProps] = useArrowKeyFocus({ orientation: 'horizontal' });
 * return (
 *   <ContextProvider>
 *     <ButtonContainer {...useArrowKeyFocusProps}>
 *       <Button onClick={doSomething1}>One</Button>
 *       <Button onClick={doSomething2}>Two</Button>
 *       <Button onClick={doSomething3}>Three</Button>
 *     </ButtonContainer>
 *   </ContextProvider>
 * );
 */
export function useArrowKeyFocus({
  orientation,
  focusableElementFilter = constant(true),
  enableArrowKeyFocus = true,
  ...options
}: UseArrowKeyFocusOptions): [React.MemoExoticComponent<any>, UseArrowKeyFocusProps] {
  const [elementRef, componentRef] = useDOMElementRef();
  const blurTimerRef = useRef<NodeJS.Timer | undefined>(undefined);
  const wasFocusedRef = useRef(false);
  const isFocusedRef = useRef(false);
  const isMousingDownRef = useRef(false);
  const capturingFocusEventsRef = useRef(new WeakSet<Event>());
  const panelPosition = usePanelPosition();
  const contextRunInTopEnabledFocuser = useContext(ArrowKeyFocuserContext);
  const enabled = maskMatches(enableArrowKeyFocus, panelPosition);

  // These functions exist because event handlers need to make sure
  // to access refs’ `.current` internally rather than capturing the
  // `.current` value from the hook body, because the hook only runs
  // when the host component renders, and the ref can be updated without
  // a re-render. In other words, this would be bad:
  //
  // const isReceivingFocus = !wasFocusedRef.current && isFocusedRef.current;
  // const onKeyDown = () => {
  //   if (isReceivingFocus) { ... }
  // }
  //
  // const onMouseDown = () => {
  //   wasFocusedRef.current = false;
  // }
  //
  // On the first keydown, `isReceivingFocus` might be correct. But after a
  // mousedown and `wasFocusedRef.current` changes, the next keydown handled
  // would still see the old value of `isReceivingFocus` because the hook’s
  // function body hasn’t been run again. To remedy, `isReceivingFocus` needs
  // to access the refs’ `.current` properties _inside_ the event handler,
  // or evaluate another function that does, which is what these three functions
  // serve to do.
  function getIsReceivingFocus(): boolean {
    return !wasFocusedRef.current && isFocusedRef.current;
  }

  function getFocusContainer(): Element | null {
    return options.focusContainer || elementRef.current;
  }

  function getFocuser(): Focuser {
    return {
      focusContainer: getFocusContainer()!,
      isReceivingFocus: getIsReceivingFocus(),
      focusableElementFilter,
    };
  }

  /**
   * Bubbles a function up through each AKF in context until it reaches the highest-level
   * AKF, which will call the function with the highest-level enabled instance.
   */
  const runInTopEnabledFocuser: RunInTopEnabledFocuserFunction = useCallback(
    (fn, event, stopPropagation, childFocuser) => {
      capturingFocusEventsRef.current.add(event.nativeEvent);
      const focuser = enabled ? getFocuser() : childFocuser;
      if (contextRunInTopEnabledFocuser) {
        contextRunInTopEnabledFocuser(fn, event, stopPropagation, focuser);
      } else {
        if (stopPropagation) {
          event.stopPropagation();
        }
        if (!focuser) {
          return;
        }

        fn(focuser);
      }
    },
    // TODO: fix rules-of-hooks for legacy code
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [capturingFocusEventsRef, enabled, contextRunInTopEnabledFocuser]
  );

  const onKeyDown: React.KeyboardEventHandler<HTMLElement> = (event) => {
    if (enabled) {
      const focusContainer = getFocusContainer();
      switch (event.which) {
        case keys[orientation][0]:
          if (canMoveSelectionLeft(event.target)) {
            break;
          }
          const prevElement = getPreviousFocusable(document.activeElement, focusContainer, focusableElementFilter);
          if (prevElement) {
            prevElement.focus();
            event.preventDefault();
            event.stopPropagation();
          }
          break;
        case keys[orientation][1]:
          if (canMoveSelectionRight(event.target)) {
            break;
          }
          const nextElement = getNextFocusable(document.activeElement, focusContainer, focusableElementFilter);
          if (nextElement) {
            nextElement.focus();
            event.preventDefault();
            event.stopPropagation();
          }
          break;
        case Keys.Tab:
          /**  we don't want to apply this logic when something like a dialog is open as it causes an issue 
          - an element in the background will be focused instead of elements in the dialog/overlay */
          if (!globalUIStore.isOverlayOpen) {
            runInTopEnabledFocuser(
              (focuser) => {
                // To move focus outside the focus container, we transiently focus the first or last
                // element inside the container and then let the keydown event continue to do its thing,
                // moving the focus forward or backward. This is crucially important in the case where
                // the focus container contains the first or last focusable element in the window, because
                // in this case the focus should move into the browser chrome, which we can’t programmatically
                // do; we can only programmatically focus things inside the window. So if we detect that the
                // a tab press should focus the chrome, we quickly focus something near the chrome and then
                // let the focus move on its own.
                const elementToFocus = event.shiftKey
                  ? getFirstFocusable(focuser.focusContainer)
                  : getLastFocusable(focuser.focusContainer);
                if (elementToFocus) {
                  elementToFocus.focus();
                  // In the case the focus should stay on the first or last focusable element inside the container,
                  // such as the toolbar inside a table that has a focusable button, through setting the container
                  // with an extra attribute "data-hastopbar" to determine if the focus should stay on the first
                  // focusable element in backward navigation. For forward navigation, it needs another attribute
                  // something like "data-hasfooterbar" set with the container. So far it looks like there isn't
                  // a place where has a footer bar inside a container wrapped with ArrowKeyFocuser. Here it doesn't
                  // deal with forward navigation.
                  const containerAttributes = focuser.focusContainer.attributes || [];
                  const focusStay =
                    event.shiftKey && containerAttributes["data-hastopbar"] && containerAttributes["data-hastopbar"].value === "true";
                  if (focusStay) {
                    event.preventDefault();
                  }
                }
              },
              event,
              true
            );
          }
      }
    }
  };

  const onFocus: React.FocusEventHandler<HTMLElement> = (event) => {
    // If focus was just brought into an AKF from the outside, and this is the deepest-nested AKF,
    if (!isMousingDownRef.current && getIsReceivingFocus() && !capturingFocusEventsRef.current.has(event.nativeEvent)) {
      // then bubble a function up to the highest-level enabled AKF:
      runInTopEnabledFocuser(
        (focuser) => {
          // If focus was just brought into the highest-level enabled AKF (not redundant with 2 lines above because of nested AKFs),
          if (focuser.isReceivingFocus) {
            // then find a good element to focus. It has to be focusable, obviously, match any filter passed to this component,
            // and our first choice would be an element with `data-akf-default`. (This is used by NavigationListItem on `active` items
            // so that focus will default to the active navigation item.)
            const defaultFocusTarget = getFirstFocusable(
              focuser.focusContainer,
              (el) => focuser.focusableElementFilter!(el) && "akfDefault" in el.dataset
            );
            if (defaultFocusTarget instanceof HTMLElement) {
              defaultFocusTarget.focus();
            } else {
              // If there was no explicit default with `data-akf-default`, then focus should go to the first candidate.
              // (Note this isn’t necessarily the default behavior, since focus can move backwards into the AKF via Shift+Tab.)
              const firstFocusable = getFirstFocusable(focuser.focusContainer, focuser.focusableElementFilter);
              if (firstFocusable) {
                firstFocusable.focus();
              }
            }
          }
        },
        event,
        false
      );
    }

    wasFocusedRef.current = true;
  };

  const onFocusCapture = useCallback(() => {
    clearTimeout(blurTimerRef.current!);
    isFocusedRef.current = true;
  }, []);

  const onBlurCapture = useCallback(() => {
    isFocusedRef.current = false;
    blurTimerRef.current = setTimeout(() => (wasFocusedRef.current = false), 0);
  }, []);

  const onMouseDownCapture = useCallback(() => {
    isMousingDownRef.current = true;
    setTimeout(() => (isMousingDownRef.current = false), 0);
  }, []);

  const ContextProvider = useMemo(
    () =>
      React.memo((props: { children: React.ReactNode }) => (
        <ArrowKeyFocuserContext.Provider value={runInTopEnabledFocuser} {...props} />
      )),
    [runInTopEnabledFocuser]
  );

  return [
    ContextProvider,
    {
      ref: componentRef,
      onKeyDown: onKeyDown,
      onFocus: onFocus,
      onFocusCapture: onFocusCapture,
      onBlurCapture: onBlurCapture,
      onMouseDownCapture: onMouseDownCapture,
    },
  ];
}

export interface ArrowKeyFocuserProps extends UseArrowKeyFocusOptions {
  children: (props: UseArrowKeyFocusProps) => JSX.Element;
}

/**
 * See JSDoc for `useArrowKeyFocus`. This is a simple component that wraps its
 * with a render prop.
 *
 * @example
 * <ArrowKeyFocuser orientation="horizontal">
 *   {(useArrowKeyFocusProps) => (
 *     <ButtonContainer {...useArrowKeyFocusProps}>
 *       <Button onClick={doSomething1}>One</Button>
 *       <Button onClick={doSomething2}>Two</Button>
 *       <Button onClick={doSomething3}>Three</Button>
 *     </ButtonContainer>
 *   )}
 * </ArrowKeyFocuser>
 */
export function ArrowKeyFocuser({ children, ...options }: ArrowKeyFocuserProps) {
  const [ContextProvider, arrowKeyFocusProps] = useArrowKeyFocus(options);
  return <ContextProvider>{children(arrowKeyFocusProps)}</ContextProvider>;
}
