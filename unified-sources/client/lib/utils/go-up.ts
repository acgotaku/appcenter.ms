import { InjectedRouter, PlainRoute } from "react-router";

/**
 * Navigates up a route, e.g. from /beacon/users/123 to /beacon/users
 */
export const goUp = (
  router: InjectedRouter,
  routes: PlainRoute[],
  location: { pathname: string; search: string },
  preserveQuery = true
) => {
  const lastRoute = routes.slice(-1).pop();
  const lastRouteChunkLength = (lastRoute && lastRoute.path && lastRoute.path.split("/").length) || 0;
  const locationChunks = location.pathname.split("/");
  const backPath = locationChunks.slice(0, locationChunks.length - lastRouteChunkLength).join("/");
  router.push(backPath + (preserveQuery ? location.search : ""));
};
