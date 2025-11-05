import * as React from "react";
import { omit, noop } from "lodash";
import { RefocusManagerChildContext } from "../refocus-manager";
import { doFocus } from "@root/lib/utils/focuser";
import { globalUIStore } from "@root/stores/global-ui-store";
import { pull } from "lodash";
import * as PropTypes from "prop-types";
import { HTMLTagNames } from "@lib/common-interfaces/html-tag-names";

export interface AutofocusProps extends React.HTMLAttributes<HTMLElement> {
  /** The prop that controls when to focus the focusable contents. */
  focus: boolean;
  /** If true, and no focusable elements are found within Autofocus when `focus` becomes `true`, Autofocus will temporarily make the container element focusable, focus it, and then return the container to its previous unfocusable state. */
  force?: boolean;
  /** The tag used as the container element. */
  tagName?: HTMLTagNames;
  /** If true, Autofocus will remember the element that was focused before it moved the focus, and when `focus` switches back to `false` or Autofocus unmounts, that previously focused element will be focused again. */
  refocusOriginalElement?: boolean;
  /** An HTMLElement for Autofocus to operate on instead of its children. This allows you to omit `children` of Autofocus entirely, and it will not render anything into the DOM. Useful if the behavior of Autofocus is needed but the rendered DOM tree can’t easily support an extra wrapper element. */
  getRef?: () => HTMLElement | null;
  /** Callback called when an element is focused. (Not called when a previously focused element is focused via `refocusOriginalElement`.) */
  onFocused?: (element: HTMLElement) => void;
}

interface DefaultProps {
  tagName: string;
  getRef: (...args: any[]) => void;
}

type AutofocusPropsWithDefaultProps = AutofocusProps & DefaultProps;

/**
 * Holds list of initialized Autofocus instances for the scope
 */
class AutofocusScope {
  private instances: Autofocus[] = [];

  /**
   * Add instance to the scope
   * @param autofocus - component instance
   */
  public add(autofocus) {
    this.instances.unshift(autofocus);
  }

  /**
   * Remove instance from the scope
   * @param autofocus - component instance
   */
  public remove(autofocus: Autofocus) {
    pull(this.instances, autofocus);
  }

  /**
   * Check if given instance should handle the focus
   */
  public shouldFocus(instance: Autofocus) {
    return this.instances.find((instance) => instance.props.focus) === instance;
  }

  private previousRefocus: number | null = null;
  /**
   * Perform refocus on instance if there wasn't another refocus
   * performed at least 100ms ago
   * @param instance - instance to perform refocus
   *
   * This fixes cases when multiple Autofocus component instances try to refocus
   * simultaneously.
   *
   * TODO: in the future we may need to collect autofocus instances which wants to refocus
   * and perform refocusing for each instance while activeElement not matches previouslyFocused one.
   * For now I see no cases where it's useful.
   */
  public handleRefocus(instance: Autofocus) {
    const currentRefocus = Date.now();
    if (this.previousRefocus && currentRefocus - this.previousRefocus >= 100) {
      this.previousRefocus = currentRefocus;
      instance.refocus();
    }
  }
}

/**
 * Automatically enables focus of element when `focus` prop becomes `true`
 *
 * @example
 * // As a wrapper: Provide input/textarea on any nested level as children, e.g.
 * <Autofocus focus={isLoaded}>
 *   <input />
 * </Autofocus>
 *
 * // Usage as non-wrapper: Provide callback in `getRef` prop, make sure you put it after `input`, e.g.
 * <input ref={ref => this.input = ref} />
 * <Autofocus focus={isLoaded} getRef={() => this.input} />
 */
export class Autofocus extends React.Component<AutofocusProps> {
  private wrapper: HTMLElement | null = null;
  private scope: AutofocusScope;
  private previouslyFocusedElement?: Element;
  public static defaultProps = {
    tagName: "div",
    getRef: noop,
  };
  public static childContextTypes = {
    autofocusScope: PropTypes.instanceOf(AutofocusScope),
  };
  public static contextTypes = {
    autofocusScope: PropTypes.instanceOf(AutofocusScope),
    refocusManager: PropTypes.shape({
      tryRefocus: PropTypes.func,
    }),
  };

  constructor(props, context) {
    super(props, context);
    this.scope = !context.autofocusScope ? new AutofocusScope() : context.autofocusScope;
  }

  public getChildContext() {
    return {
      autofocusScope: this.scope,
    };
  }

  public context!: RefocusManagerChildContext;

  public getPreviouslyFocusedElement() {
    if (document.activeElement) {
      // If the active element is document.body, there's a chance that a focused
      // element was removed from the DOM. In that case, try to fall back to the
      // fallbackFocusedElement before falling back to document.body
      return document.activeElement === document.body ? globalUIStore.fallbackFocusedElement || document.body : document.activeElement;
    }

    return document.body;
  }

  public UNSAFE_componentWillMount() {
    // Add instances to the list before mounting them and
    // making descision which one should handle the focus
    this.scope.add(this);
  }

  public componentDidMount() {
    // Only handle the focus if there is no another Autofocus
    // instance which is able to handle it
    if (this.scope.shouldFocus(this)) {
      const { refocusOriginalElement } = this.props;
      if (refocusOriginalElement) {
        this.previouslyFocusedElement = this.getPreviouslyFocusedElement();
      }

      this.setFocus();
    }
  }

  public componentDidUpdate(prevProps: AutofocusProps) {
    const { focus: prevFocus, refocusOriginalElement } = prevProps;
    const { focus } = this.props;
    if (!prevFocus && focus) {
      if (refocusOriginalElement) {
        this.previouslyFocusedElement = this.getPreviouslyFocusedElement();
      }
      this.setFocus();
    } else if (refocusOriginalElement && prevFocus && !focus) {
      this.scope.handleRefocus(this);
    }
  }

  public componentWillUnmount() {
    const { getRef } = this.props as AutofocusPropsWithDefaultProps;
    const container = getRef() || this.wrapper;
    if (
      this.props.focus &&
      this.props.refocusOriginalElement &&
      container &&
      (container === document.activeElement || container.contains(document.activeElement))
    ) {
      this.scope.handleRefocus(this);
    }

    this.scope.remove(this);
  }

  public refocus() {
    const { previouslyFocusedElement } = this;
    if (previouslyFocusedElement && previouslyFocusedElement instanceof HTMLElement) {
      this.context.refocusManager.tryRefocus(previouslyFocusedElement);
    }
  }

  private setFocus = (): void => {
    const { getRef, onFocused, force } = this.props as AutofocusPropsWithDefaultProps;
    const container = getRef() || this.wrapper;
    // FIXME: TestCafe is failing to handle the focus on <ImageUploader /> even thought its container is present.
    // Since we don't necessarily test focus states, it's safe to ignore this condition in UI tests
    if (!container || window["%hammerhead%"]) {
      return;
    }

    globalUIStore.setFocusReturnElement(document.activeElement, true);
    doFocus(container, onFocused, force);
  };

  public render() {
    const { children, tagName: TagName, getRef, ...props } = this.props as AutofocusPropsWithDefaultProps;

    if (typeof children === "undefined") {
      return null;
    }

    // if getRef specified we don't need an additional wrapper
    if (getRef !== noop) {
      return children;
    }

    const passthrough = omit(props, "focus", "force", "onFocused", "refocusOriginalElement");
    return (
      <TagName ref={(ref) => (this.wrapper = ref)} {...passthrough}>
        {children}
      </TagName>
    );
  }
}
