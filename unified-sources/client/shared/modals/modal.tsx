import * as React from "react";
import * as PropTypes from "prop-types";
import { createPortal } from "react-dom";
import { observer } from "mobx-react";
import { noop } from "lodash";
import { SimpleEmitter, portalRootNode } from "../utils";
import { ModalifyOptions } from "./modalify";
import { KeyboardEventManagerChildContext } from "../keyboard-event-manager";
import { RefocusManagerChildContext } from "../refocus-manager";
import { TabTrap } from "../tabtrap";
import { AutofocusAfterTransition } from "../autofocus";
import { globalUIStore } from "@root/stores/global-ui-store";
import { loadingStore } from "@root/stores/loading-store";
import { GlobalProgress } from "../global-progress";
const css = require("../panels/panel.scss");
const { cloneElement } = React;

export interface ModalProps extends ModalifyOptions {
  isTop: boolean;
  children?: React.ReactElement<any>;
  onRequestClose(): void;
  willTransitionIn: boolean;
}

export interface ModalChildContext {
  inModal: boolean;
  modalEvents: {
    pendingEntranceEvent: boolean;
    didTransition: SimpleEmitter<void>;
  };
}

@observer
export class Modal extends React.Component<ModalProps, {}> {
  public refs!: {
    container: HTMLElement;
    overlay: HTMLElement;
    [key: string]: React.Component<any, any> | Element;
  };

  public static defaultProps = {
    onRequestClose: noop,
  };

  public static contextTypes: React.ValidationMap<KeyboardEventManagerChildContext & RefocusManagerChildContext> = {
    keyboardEventManager: PropTypes.any,
    refocusManager: PropTypes.any,
  };

  public static childContextTypes: React.ValidationMap<any> = {
    inModal: PropTypes.bool,
    modalEvents: PropTypes.object,
  };

  public getChildContext() {
    return { inModal: true, modalEvents: this.modalEvents };
  }

  public context!: KeyboardEventManagerChildContext & RefocusManagerChildContext;

  private onMutateDOM = () => {
    this.refs.overlay.className = [css.overlay, this.refs.container.className].join(" ");
  };

  private classObserver = new MutationObserver(this.onMutateDOM);
  private modalEvents: ModalChildContext["modalEvents"] = {
    pendingEntranceEvent: this.props.willTransitionIn,
    didTransition: new SimpleEmitter<void>(),
  };

  private get styles(): Object {
    const { width } = this.props;
    if (!width) {
      return {};
    }

    return { width };
  }

  public onRequestClose = () => {
    this.props.onRequestClose();
  };

  /**
   * What is this MutationObserver stuff doing? Modals get loaded inside a
   * ReactCSSTransitionGroup via <PanelOutlet>, which adds transition classes to
   * its child. However, using a <Portal> would break that behavior by relocating
   * DOM elements. So we need our root element to stay in place, un-portaled, so
   * it can be managed by the ReactCSSTransitionGroup: hence this.refs.container.
   * So the container gets CSS classes applied to it, and needs to use those
   * classes to animate its children (the overlay and the actual modal). Ideally
   * that would look something like this:
   *
   * .container.entering, .container.leaving {
   *   .overlay { background-color: rgba(0, 0, 0, 0); } // Fade to transparent
   *   .modal { transform: translateX(100%); } // Slide in/out
   * }
   *
   * However, that also doesn’t work because of the portal. The overlay and the
   * modal are no longer actually descendents of the container, which means we
   * can’t target them with CSS selectors like that. So the solution is to observe
   * any changes to the container’s class attribute, and then copy them from the
   * container to the overlay (what happens in `onMutateDOM`). This way, the
   * ReactCSSTransitionGroup can manage the container however it wants, and any
   * changes to it get proxied to the new, separate render tree inside the portal.
   */
  public componentDidMount() {
    this.context.refocusManager.registerContainer(this.refs.overlay);
    this.classObserver.observe(this.refs.container, {
      attributes: true,
      attributeFilter: ["class"],
    });
    this.context.keyboardEventManager.addEscapeListener(this.onRequestClose);
    loadingStore.setModal(true);
    // Try to make things a little better for Edge, prevent it from start at document root if focused element is lost
    globalUIStore.setModalOpen(true);
  }

  public componentWillUnmount() {
    this.classObserver.disconnect();
    this.context.keyboardEventManager.removeEscapeListener(this.onRequestClose);
    this.context.refocusManager.unregisterContainer(this.refs.overlay);
    globalUIStore.setModalOpen(false);
    loadingStore.setModal(false);
  }

  private onTransitionEnd = (event: React.TransitionEvent<HTMLDivElement>) => {
    this.modalEvents.didTransition.emit();
    this.modalEvents.pendingEntranceEvent = false;
  };

  public render() {
    const { onRequestClose, children, isTop, willTransitionIn, ...props } = this.props;
    const modalProps = {
      inert: globalUIStore.isOverlayOpen ? "true" : undefined,
      "aria-hidden": globalUIStore.isDialogOrPopoverOpen ? true : undefined,
      tabindex: globalUIStore.isDialogOrPopoverOpen ? -1 : undefined,
    };
    // tslint:disable:react-a11y-event-has-role
    return (
      <div ref="container" {...(this.props.isTop ? { role: "main" } : {})}>
        <span className={css.transitionWatcher} onTransitionEnd={this.onTransitionEnd} />
        {portalRootNode &&
          createPortal(
            <div ref="overlay" onClick={this.onRequestClose} role="dialog" {...modalProps}>
              <div className={css.backdrop} />
              <React.Suspense fallback={<GlobalProgress loading />}>
                <TabTrap role="presentation" active onClick={(e) => e.stopPropagation()}>
                  <AutofocusAfterTransition refocusOriginalElement className={css.modal} style={this.styles} force>
                    {children && cloneElement(children, props)}
                  </AutofocusAfterTransition>
                </TabTrap>
              </React.Suspense>
            </div>,
            portalRootNode
          )}
      </div>
    );
  }
}

export const isModal = (componentClass?: any) => Boolean(componentClass ? componentClass.isModal : false);
