import { PlainRoute } from "react-router";

export class RouteUtils {
  public static DefaultBeacon = "manage";

  public static extractPathTempate(routes: PlainRoute[]): string {
    const pathTemplate: string = routes
      .map((route) => {
        let path: string = route["path"] || "";

        if (path[0] === "/") {
          path = path.slice(1);
        }

        if (path[path.length - 1] === "/") {
          path = path.slice(0, -1);
        }

        return path;
      })
      .filter((path) => {
        return path && path !== "/";
      })
      .join("/");

    return "/" + pathTemplate;
  }

  public static extractBeaconFromPath(host: string, path: string): string {
    if (host && host.split(".")[0].toLowerCase() === "install") {
      return "install";
    }

    if (!path) {
      return this.DefaultBeacon;
    }

    if (path.indexOf("/github-app/") === 0) {
      return "github-app";
    }

    const beacon = path.match(/\/(?:users|orgs)\/[^\/]+\/apps\/[^\/]+\/([^\/]+)/i);
    if (beacon && beacon.length > 1) {
      return beacon[1].toLowerCase();
    } else {
      return this.DefaultBeacon;
    }
  }
}
