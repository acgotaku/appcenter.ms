import { differenceInSeconds } from "date-fns";
import { locationStore } from "@root/stores";
import { relativeDate, formatDate } from "@root/lib/utils/time";
import { FetchError } from "@root/lib/http/fetch-error";

export class Utils {
  public static timeDistance(startTime: string): string {
    const diff = differenceInSeconds(Date.now(), new Date(startTime));
    if (diff <= 60) {
      return "just now";
    }

    return relativeDate(startTime);
  }

  public static longTimeFormat(time: string): string {
    return formatDate(time, "longFullDateTimeWithSecondsAndWeekday");
  }

  public static sourceHostDisplayName(sourceHost: string): string {
    switch (sourceHost) {
      case "github":
        return "GitHub";
      case "bitbucket":
        return "Bitbucket";
      case "vsts":
        return "Azure DevOps";
      case "gitlab":
        return "GitLab";
      default:
        return sourceHost;
    }
  }

  public static sourceHostAuthLink(sourceHost: string, originalUrl: string): string {
    return `/auth/${sourceHost}?original_url=${originalUrl}&get_token=true`;
  }

  public static displayFileAndPath(path: string): { projectName: string; projectPath?: string } {
    if (!path) {
      return { projectName: path };
    }
    const m = path.match(/^[\.]?[\/]?(.*)[\/]([^\/]+)/);
    if (!m) {
      return { projectName: path, projectPath: "/" };
    }
    return {
      projectName: m[2],
      projectPath: "/" + m[1],
    };
  }

  public static getHostedAuthLink(service: string): string {
    const originalUrl = locationStore.getUrlWithCurrentApp(`build/connect/${service}/hosted`);
    return Utils.sourceHostAuthLink(service, originalUrl);
  }

  public static getAuthLink(service: string): string {
    const originalUrl = locationStore.getUrlWithCurrentApp("build/connect/" + service);
    return Utils.sourceHostAuthLink(service, originalUrl);
  }

  public static avatarUrlResized(url: string | undefined, size: number) {
    if (url) {
      const sizeQuery = `s=${size}`;
      const delimeter = url.includes("?") ? "&" : "?";
      return `${url}${delimeter}${sizeQuery}`;
    }
    return url;
  }

  public static getRepoExternalUrl(repoType: string, repoUrl: string): string {
    switch (repoType) {
      case "github":
        return repoUrl.replace(/[.]git$/, "");
      case "bitbucket":
        return repoUrl.replace(/[.]git$/, "").replace(/:\/\/[^@]+@/, "://");
      case "vsts":
        return repoUrl.includes("dev.azure.com") ? repoUrl.replace(/:\/\/[^@]+@/, "://") : repoUrl;
      default:
        return repoUrl;
    }
  }

  public static getRepoShortName(repoType: string, repoUrl: string): string {
    switch (repoType) {
      case "github":
        return repoUrl.replace(/[.]git$/, "").replace(/^https:[/][/]github[.]com[/]/i, "");
      case "bitbucket":
        return repoUrl.replace(/[.]git$/, "").replace(/^https:[/][/][^/]*bitbucket[.]org[/]/i, "");
      case "vsts":
        if (repoUrl.includes("dev.azure.com")) {
          const m = repoUrl.match(/^https:[/][/]([^/]+)[@]dev[.]azure[.]com[/]([^/]+)[/]([^/]+)[/]([^/]+)[/]([^/]+)$/i);
          if (m) {
            return m[2] + "/" + m[3] + "/" + m[5];
          }
        } else {
          let m = repoUrl.match(/^https:[/][/]([^/]+)[.]visualstudio[.]com[/]([^/]+)[/][^/]+[/]([^/]+)$/i);
          if (m) {
            return m[1] + "/" + m[2] + "/" + m[3];
          }
          m = repoUrl.match(/^https:[/][/]([^/]+)[.]visualstudio[.]com[/][^/]+[/]([^/]+)$/i);
          if (m) {
            return m[1] + "/" + m[2];
          }
        }
        return "";
      default:
        return repoUrl.replace(/[.]git$/, "").replace(/^https:[/][/][^/]*[/]/i, "");
    }
  }

  public static isCodeHostNotAuthenticatedErrorResponse(error: FetchError): boolean {
    if (error && error.body && error.body.message && error.body.message.indexOf("auth flow") !== -1) {
      return true;
    }
    return false;
  }
}
