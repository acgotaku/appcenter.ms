import { computed } from "mobx";
import { IconName } from "@root/shared";
import { locationStore } from "@root/stores";
import { compact } from "lodash";

export interface BugTrackerService {
  type: string;
  name: string;
  icon: IconName;
  url: string;
  isOAuth: boolean;
}

/**
 * UI Store for Services page.
 */
export class ServicesStore {
  @computed
  public static get bugTrackerServices(): BugTrackerService[] {
    return compact([
      {
        type: "vsts",
        name: "Azure DevOps",
        icon: IconName.AzureDevOps,
        url: this.buildAuthUrl("vsts"),
        isOAuth: true,
      },
      {
        type: "github",
        name: "GitHub",
        icon: IconName.GitHub,
        url: this.buildAuthUrl("github"),
        isOAuth: true,
      },
      {
        type: "jira",
        name: "Jira",
        icon: IconName.Jira,
        url: null,
        isOAuth: false,
      },
    ]) as any;
  }

  public static buildAuthUrl(
    service: string,
    originalUrl: string = locationStore.getUrlWithCurrentApp(`settings/services/bugtracker/add/${service}`)
  ) {
    return `/auth/${service}/bugtracker?original_url=${originalUrl}`;
  }
}
