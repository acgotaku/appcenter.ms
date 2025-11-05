import * as React from "react";
import * as PropTypes from "prop-types";
import { focusCandidateIsAvailable } from "../utils/focusable";
import { doFocus } from "@root/lib/utils/focuser";
import { globalUIStore } from "@root/stores/global-ui-store";

export interface RefocusManagerChildContext {
  refocusManager: {
    registerContainer(container: HTMLElement, setFocusReturnElement?: boolean): void;
    unregisterContainer(container: HTMLElement): void;
    tryRefocus(container: HTMLElement): void;
  };
}

export class RefocusManager extends React.Component<{}, any> {
  public static childContextTypes: React.ValidationMap<RefocusManagerChildContext> = {
    refocusManager: PropTypes.any,
  };

  private viewportElement: HTMLElement | null = null;
  private containers: HTMLElement[] = [];
  private childObserver?: MutationObserver;

  /**
   * The RefocusManager provides three major functions:
   *
   * 1. Monitors the children of the "topmost" registered container to check whether elements
   * removed from the DOM have focus when they are removed. If so, it attempts to refocus within
   * the registered container. This is useful in scenarios such as wizards when the "Next" button
   * is removed and changes to a submit button at the end of the process.
   *
   * 2. Provides refocus functionality that can be used by other components, such as Autofocus,
   * that will first check the requested element to focus to determine whether it still exists in
   * the DOMm and is focusable. If the element is not, it will attempt to refocus within the topmost
   * registered container.
   *
   * 3. Caching the last non-document.body element that received focus (via global-ui-store) so other
   * components can check that when trying to capture the last focused element. This is useful when
   * elements (or their parents) are hidden from the DOM before a panel transition, for example. This
   * would previously result in capturing document.body as the active element, rather than the element
   * that initiated the transition.
   *
   * note: This component behaves incorrectly if used twice within the same DOM tree.
   * Instead, just use the context functions -- register/unregister container to add your component to the current refocus manager container list
   */
  public registerContainer = (container: HTMLElement, setFocusReturnElement = true): void => {
    if (setFocusReturnElement) {
      globalUIStore.setFocusReturnElement(document.activeElement, true);
    }
    this.setupObserver(container);
    this.containers.push(container);
  };

  public unregisterContainer = (container: HTMLElement): void => {
    const array = this.containers;
    const index = array.indexOf(container);
    // Short-circuit if container queued for removal does not exist
    if (index === -1) {
      return;
    }

    this.containers = array.slice(0, index).concat(array.slice(index + 1));

    // Set up the mutation observer on the next container down on the stack
    if (this.containers.length > 0) {
      if (globalUIStore.focusReturnElements?.length) {
        globalUIStore.returnFocus();
      } else {
        // if the container was removed completely, we want to refocus the last element from the previous container
        doFocus(this.containers[this.containers.length - 1]);
      }
      this.setupObserver(this.containers[this.containers.length - 1]);
    }
  };

  public setupObserver(container: HTMLElement) {
    if (this.childObserver) {
      this.childObserver.disconnect();
    }
    this.childObserver = new MutationObserver(this.handleChildRemoved);
    const options: MutationObserverInit = {
      childList: true,
      subtree: true,
    };
    this.childObserver.observe(container, options);
  }

  public handleChildRemoved = (mutations: MutationRecord[]) => {
    mutations.forEach((mutation) => {
      if (mutation.type === "childList") {
        // Check all the removed elements to see if the focus element was sremoved
        // without explicitly focusing something else
        const removedElements = Array.from(mutation.removedNodes);
        removedElements.forEach((element) => {
          // if we remove an element from the dom, focus will be reset to the document.body object
          const didFocusReset = document.activeElement === document.body;
          if (
            didFocusReset &&
            (element === globalUIStore.fallbackFocusedElement || element.contains(globalUIStore.fallbackFocusedElement || null)) &&
            this.containers.length > 0
          ) {
            // This removed element was focused, so we need to take some kind of action
            // try and add focus to the most recently added container in `this.containers`
            doFocus(this.containers[this.containers.length - 1], this.preventLurching);
            return;
          }
        });
      }
    });
  };

  public tryRefocus = (element: HTMLElement): void => {
    if (element && element !== document.body && focusCandidateIsAvailable(element)) {
      // Protect panel transitions by not doing the focus until the next React cycle
      setTimeout(() => {
        element.focus();
      }, 0);
      return;
    }

    if (this.containers.length > 0) {
      // Protect panel transitions by not doing the focus until the next React cycle
      setTimeout(() => {
        doFocus(this.containers[this.containers.length - 1], this.preventLurching);
      }, 0);
    }
  };

  public getChildContext(): RefocusManagerChildContext {
    return {
      refocusManager: {
        registerContainer: this.registerContainer,
        unregisterContainer: this.unregisterContainer,
        tryRefocus: this.tryRefocus,
      },
    };
  }

  public onFocusIn = (event: Event): void => {
    if (event.target instanceof HTMLElement && event.target !== document.body) {
      globalUIStore.setFallbackFocusedElement(event.target);
    }
  };

  // Comment copied from autofocus-after-transition.tsx (see that file for more discussion):
  //
  // In some circumstances, panels can get focused before a transition has actually finished.
  // When that happens, if the element that receives focus is still transformed outside the bounds
  // of LayoutWithLeftNav’s viewport element, the browser will set that viewport element’s
  // `scrollLeft` to bring the focused element into view. When the transition completes moments
  // later, the viewport element is left in a ridiculous state with the content all scrolled to
  // the left and cut off, and you can’t scroll back to normal because the element doesn’t
  // actually scroll. So, just to make sure that never happens, reset the scroll position after
  // every focus-after-transition.
  private preventLurching = () => {
    document.body.scrollLeft = 0;
    if (this.viewportElement) {
      this.viewportElement.scrollLeft = 0;
    }
  };

  public componentDidMount() {
    this.viewportElement = document.getElementById("layout-viewport");
    // This is a bit of a hack, but it's done to try to counteract the situation where
    // a user opens a link from elsewhere or pastes a URL that opens a page with a panel
    // or modal. In this case, the focusin listener was grabbing the container divs as
    // focused elements, not something the user had focused. This was causing the refocus
    // behavior of autofocus components to try to focus that container div, rather than
    // trying to focus document.body, which we can recognize in tryRefocus and choose to
    // do the focus logic on the topmost registered container
    //
    // Also, this is using a timeout of 500ms rather than just 0 to account for a page
    // with more than one containered element. It was observed through testing that a
    // timeout of 0 would only wait until after the first one had loaded, panel for example.
    // If a modal was also open, the timeout would have expired and the focusin handler active
    // before the Autofocus in the modal ran its componentDidMount. I expect it's because
    // the modal is portaled and therefore renders in a different "loop" than the tree
    // that contains the panel. 500ms seems to wait long enough (though I know this is
    // non-deterministic), and I think it's reasonable to expect that a user won't start
    // tabbing around the UI within 500ms of when this componendDidMount runs.
    setTimeout(() => {
      window.addEventListener("focusin", this.onFocusIn);
    }, 500);
  }

  public componentWillUnmount() {
    window.removeEventListener("focusin", this.onFocusIn);
  }

  public render() {
    const child = React.Children.only(this.props.children);
    return React.cloneElement(child, this.props, child.props.children);
  }
}
