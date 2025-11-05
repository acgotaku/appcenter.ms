import * as React from "react";
import * as PropTypes from "prop-types";
import { PanelPosition, PanelChildContext } from "../panels";
import { ModalChildContext } from "../modals";
import { SimpleEmitter } from "../utils";

export interface WrappedComponent<P> extends React.Component<P, React.ComponentState> {
  componentDidEnter?(animated: boolean): void;
  panelDidTransition?(toPosition: PanelPosition): void;
}

export interface WrappedComponentClass<P, T extends WrappedComponent<P>> extends React.ComponentClass<P> {
  new (props: P, context?: any): T;
}

export function transitionListener<P, T extends WrappedComponent<P>>(WrappedComponent: WrappedComponentClass<P, T>): any {
  return class extends React.Component<P, React.ComponentState> {
    public static displayName = `transitionListener(${WrappedComponent.displayName || WrappedComponent.name})`;
    private wrappedComponent: WrappedComponent<P> | null = null;

    public static contextTypes = {
      panelPosition: PropTypes.number,
      panelEvents: PropTypes.object,
      inModal: PropTypes.bool,
      modalEvents: PropTypes.object,
    };

    public context!: PanelChildContext & ModalChildContext;
    private onTransition?: () => void;

    public componentDidMount() {
      if (this.wrappedComponent) {
        const { componentDidEnter, panelDidTransition } = this.wrappedComponent;
        if (!componentDidEnter && !panelDidTransition) {
          console.warn(
            `\`${this.constructor["displayName"]}\` contains neither \`componentDidEnter\` ` +
              "nor `panelDidTransition`, so `transitionListener` is useless. Consider removing it."
          );

          return;
        }

        if (!this.context.panelEvents && !this.context.modalEvents) {
          throw new Error(
            `\`transitionListener\` in \`${this.constructor["displayName"]}\` ` + "must be used in the context of a Panel or a Modal."
          );
        }

        const events: {
          didTransition: SimpleEmitter;
          pendingEntranceEvent: boolean;
        } = this.context.modalEvents || this.context.panelEvents;

        // An entrance transition will not occur, so fire `componentDidEnter` immediately
        if (!events.pendingEntranceEvent && componentDidEnter) {
          componentDidEnter.call(this.wrappedComponent, false);
        }

        this.onTransition = () => {
          if (events.pendingEntranceEvent && componentDidEnter) {
            componentDidEnter.call(this.wrappedComponent, true);
          }

          if (!events.pendingEntranceEvent && panelDidTransition && !this.context.inModal) {
            panelDidTransition.call(this.wrappedComponent, this.context.panelPosition);
          }
        };

        events.didTransition.subscribe(this.onTransition);
      }
    }

    public componentWillUnmount() {
      if (this.context.panelEvents && this.onTransition) {
        this.context.panelEvents.didTransition.unsubscribe(this.onTransition);
      }
    }

    public render() {
      return <WrappedComponent ref={(x: WrappedComponent<P>) => (this.wrappedComponent = x)} {...this.props} />;
    }
  };
}
