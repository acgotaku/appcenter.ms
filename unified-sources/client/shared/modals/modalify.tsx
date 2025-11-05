import * as React from "react";
import * as PropTypes from "prop-types";
import { RouteComponentProps, WithRouterProps } from "react-router";
import { Modal, isModal } from "./modal";
import { goUp } from "../utils";
import { checkForTranslatedComponents, checkForWithRouterComponent } from "../panels/validation";

const { PureComponent, createElement } = React;

export interface ModalifyOptions {
  width?: number | string;
  onRequestClose?(): void;
}

export interface ModalifyProps extends RouteComponentProps<any, any>, React.HTMLAttributes<HTMLElement> {
  willTransitionIn: boolean;
  router: WithRouterProps["router"];
}

export const Modalify = (options: ModalifyOptions | React.ComponentType<any>) => {
  const modalify = (options: ModalifyOptions) => (InnerComponent: React.ComponentType<any>): any => {
    checkForWithRouterComponent(InnerComponent, "Modalify");
    const { onRequestClose } = options;

    return class ModalWrapper extends PureComponent<ModalifyProps, {}> {
      public static childContextTypes: React.ValidationMap<any> = {
        requestClose: PropTypes.func,
      };

      public getChildContext() {
        return { requestClose: this.requestClose };
      }

      private requestClose = () => {
        const { routes, router, location } = this.props;
        if (onRequestClose) {
          onRequestClose();
        } else {
          goUp(router, routes, location);
        }
      };

      public UNSAFE_componentWillMount() {
        checkForTranslatedComponents(this.props.routes, "Modalify");
      }

      public render() {
        const { routes, route, willTransitionIn } = this.props;
        const modalRoutes = (routes || []).filter((r) => isModal(r.component));
        const topModalRoute = modalRoutes[modalRoutes.length - 1];
        const isTop = route === topModalRoute;

        return (
          <Modal isTop={isTop} onRequestClose={this.requestClose} willTransitionIn={willTransitionIn} {...options}>
            {createElement(InnerComponent, this.props)}
          </Modal>
        );
      }
    };
  };

  if (typeof options === "function") {
    return modalify({})(options);
  }

  return modalify(options);
};
