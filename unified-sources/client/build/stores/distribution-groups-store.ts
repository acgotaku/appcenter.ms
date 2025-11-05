import { IApp } from "@lib/common-interfaces";
import { apiGateway } from "@root/lib/http";
import { CIBaseStore } from "./ci-base-store";
import { IAHDistributionGroup } from "@root/data/build";

/**
 * ProjectsStore fetches and stores the projects for a given app
 */
export class DistributionGroupsStore extends CIBaseStore<IAHDistributionGroup[]> {
  constructor(app: IApp) {
    super(app);
  }

  public fetch(background: boolean = false): Promise<void> {
    this.lastFetchTimestamp = Date.now();

    const path = this.getPathWithSlug("distribution_groups/views/include_users");
    const fetchPromise = apiGateway.get<IAHDistributionGroup[]>(path, { params: { users_limit: "10" } });

    if (background) {
      return this.loadInBackgroundVoid(fetchPromise);
    } else {
      return this.loadVoid(fetchPromise);
    }
  }

  public refreshOptimistically() {
    const fetchDelta = this.lastFetchToNow();
    if (fetchDelta === undefined || fetchDelta > 60 * 1000 || this.isFailed) {
      this.fetch(this.isLoaded);
    }
  }
}
