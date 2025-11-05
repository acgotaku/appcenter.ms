import * as React from "react";
import { PlainRoute } from "react-router";
import { ParamsParserUtils } from "@root/lib/http/params-parser-utils";

export interface PathProviderProps {
  route: PlainRoute;
  routes: PlainRoute[];
  params: { [key: string]: string | string[] };
}

const PathContext = React.createContext("");

const stripTrailingSlash = (string: string) => (string[string.length - 1] === "/" ? string.substring(0, string.length - 1) : string);

const Provider: React.SFC<PathProviderProps> = ({ route, routes, params, children }) => {
  const pathFragments = routes
    .slice(0, routes.indexOf(route) + 1)
    .reduce(
      (relativePathFragments: string[], route) =>
        route.path && route.path.startsWith("/")
          ? [stripTrailingSlash(route.path)]
          : route.path
          ? [...relativePathFragments, stripTrailingSlash(route.path)]
          : relativePathFragments,
      []
    );
  const path = ParamsParserUtils.parse(pathFragments.join("/"), params, false);
  return <PathContext.Provider value={path} children={children} />;
};
Provider.displayName = "Path.Provider";

export { PathContext };

export const Path = {
  Provider,
  Consumer: PathContext.Consumer,
};
