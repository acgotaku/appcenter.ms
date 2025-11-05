import * as React from "react";
import { isEqual } from "lodash";
import { createContextStackBuilder } from "../context-stack-builder";
import { Path } from "../../path";
import { PartialBy } from "@lib/common-interfaces";
import { RouteComponentProps } from "react-router";
import hoistNonReactStatics = require("hoist-non-react-statics");

export type Breadcrumb = { path: string; title: string };
const Builder = createContextStackBuilder<Breadcrumb>({ displayName: "BreadcrumbBuilder", isEqual });
const { Collector, Boundary } = Builder;

const Value: React.SFC<PartialBy<Breadcrumb, "path">> = ({ title, path }) => (
  <Path.Consumer>{(injectedPath) => <Builder.Value value={{ title, path: path || injectedPath }} />}</Path.Consumer>
);
Builder.Value.displayName = "ContextStackBuilder.Value";
Value.displayName = "BreadcrumbBuilder.Value";

export const beaconBreadcrumbBoundary = (WrappedComponent: React.ComponentClass<RouteComponentProps<any, any>>): any => {
  const BeaconBreadcrumbBoundary: React.SFC<RouteComponentProps<any, any>> = ({ route, routes, params, children, ...props }) => (
    <Path.Provider route={route} routes={routes} params={params}>
      <Builder.Boundary>
        <WrappedComponent {...props} route={route} routes={routes} params={params} children={children} />
      </Builder.Boundary>
    </Path.Provider>
  );
  BeaconBreadcrumbBoundary.displayName = `BeaconBreadcrumbBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;
  hoistNonReactStatics(BeaconBreadcrumbBoundary, WrappedComponent);
  return BeaconBreadcrumbBoundary;
};

export const BreadcrumbBuilder = {
  Collector,
  Boundary,
  Value,
};
