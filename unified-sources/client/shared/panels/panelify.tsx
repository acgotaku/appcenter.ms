import * as React from "react";
import * as PropTypes from "prop-types";
import { RouteComponentProps, WithRouterProps, PlainRoute } from "react-router";
import { Panel, isPanel } from "./panel";
import { PanelPosition } from "./panel-position";
import { isModal } from "../modals/modal";
import { goUp } from "../utils";
import { checkForTranslatedComponents, checkForWithRouterComponent } from "./validation";
import { Path } from "@root/shared/path";
import { BreadcrumbBuilder } from "@root/shared/context-stack-builder/variants/breadcrumb-builder";

const { PureComponent, createElement } = React;

interface PanelWrapperProps extends WithRouterProps {
  willTransitionIn?: boolean;
}

export interface PanelifyOptions {
  fullWidth?: boolean;
  onRequestClose?(): void;
}

export interface PanelWrapperChildContext {
  requestClose?(): void;
}

export const Panelify = (options: PanelifyOptions | React.ComponentType<any>): any => {
  const panelify = (options: PanelifyOptions) => (WrappedComponent: React.ComponentType<any>): any => {
    checkForWithRouterComponent(WrappedComponent, "Panelify");
    const { onRequestClose, fullWidth } = options;
    return class PanelWrapper extends PureComponent<RouteComponentProps<any, any> & PanelWrapperProps, {}> {
      public element: Node | null = null;
      public panelPosition?: PanelPosition;
      public static isFullWidth = fullWidth;
      public static isPanel = true;
      public static childContextTypes: React.ValidationMap<any> = {
        requestClose: PropTypes.func,
      };

      public static defaultProps = { willTransitionIn: false };

      private requestClose = () => {
        const { router, routes, location } = this.props;
        if (onRequestClose) {
          onRequestClose();
        } else {
          goUp(router, routes, location);
        }
      };

      public getChildContext(): PanelWrapperChildContext {
        const { route, routes } = this.props;
        const panelRoutes = (routes || []).filter((r) => isPanel(r.component));
        if (panelRoutes.indexOf(route) !== 0 || this.getPanelPosition(panelRoutes) === PanelPosition.Secondary) {
          return {
            requestClose: this.requestClose,
          };
        }

        return { requestClose: undefined };
      }

      private getPanelRoutes() {
        const { routes } = this.props;
        return (routes || []).filter((r) => isPanel(r.component));
      }

      private getPanelPosition(panelRoutes: PlainRoute[]) {
        const { route } = this.props;
        const index = panelRoutes.length - panelRoutes.indexOf(route) - 1;
        const topPanelIsFullWidth =
          panelRoutes.length &&
          panelRoutes[panelRoutes.length - 1].component &&
          panelRoutes[panelRoutes.length - 1].component!["isFullWidth"];

        switch (index) {
          case 0:
            return PanelPosition.Primary;
          case 1:
            return topPanelIsFullWidth ? PanelPosition.Hidden : PanelPosition.Secondary;
          default:
            return PanelPosition.Hidden;
        }
      }

      private isRoot(panelRoutes: PlainRoute[]) {
        return panelRoutes.indexOf(this.props.route) === 0;
      }

      private isTop(position) {
        const { routes } = this.props;
        if (position === PanelPosition.Primary) {
          const panelOrModalRoutes = (routes || []).filter((r) => isPanel(r.component) || isModal(r.component));
          const topPanelOrModalRoute = panelOrModalRoutes[panelOrModalRoutes.length - 1];
          return this.props.route === topPanelOrModalRoute;
        }
        return false;
      }

      public UNSAFE_componentWillMount() {
        checkForTranslatedComponents(this.props.routes, "Panelify");
      }

      public render() {
        const { willTransitionIn, route, routes, params } = this.props;
        const panelRoutes = this.getPanelRoutes();
        const panelPosition = this.getPanelPosition(panelRoutes);
        const isTop = this.isTop(panelPosition);
        const isRoot = this.isRoot(panelRoutes);
        return (
          <BreadcrumbBuilder.Boundary>
            <Path.Provider route={route} routes={routes} params={params}>
              <Panel
                isTop={isTop}
                isRoot={isRoot}
                position={panelPosition}
                isFullWidth={!!fullWidth}
                willTransitionIn={!!willTransitionIn}
              >
                {createElement(WrappedComponent, Object.assign({}, this.props, { panelPosition }), this.props.children)}
              </Panel>
            </Path.Provider>
          </BreadcrumbBuilder.Boundary>
        );
      }
    };
  };

  if (typeof options === "function") {
    return panelify({})(options);
  }

  return panelify(options);
};
