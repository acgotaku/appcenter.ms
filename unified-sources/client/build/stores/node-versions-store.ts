import { computed } from "mobx";
import { apiGateway } from "@root/lib/http";
import { CIBaseStore } from "./ci-base-store";

import { INodeVersion, IApplicationToolsets } from "@root/data/build";
import { storeOptimisticFetchDelta } from "@lib/constants/build";

/**
 * NodeVersionsStore fetches the Node versions available to the app
 */
export class NodeVersionsStore extends CIBaseStore<INodeVersion[] | undefined> {
  @computed
  public get currentVersion(): INodeVersion | undefined {
    if (this.hasVersions) {
      return this.data && this.data.find((version) => version.current);
    }
  }

  @computed
  public get hasVersions(): boolean {
    return this.isLoaded && !!this.data && this.data.length > 0;
  }

  public fetchVersions(background: boolean = false): Promise<void> {
    this.lastFetchTimestamp = Date.now();

    const path = this.getPathWithSlug("toolsets");
    const fetchVersionsPromise = apiGateway
      .get<IApplicationToolsets>(path, {
        params: {
          tools: "node",
        },
      })
      .then((toolset) => toolset.node);

    if (background) {
      return this.loadInBackgroundVoid(fetchVersionsPromise);
    } else {
      return this.loadVoid(fetchVersionsPromise);
    }
  }

  public refreshOptimistically() {
    const fetchDelta = this.lastFetchToNow();
    if (fetchDelta === undefined || fetchDelta > storeOptimisticFetchDelta || this.isFailed) {
      this.fetchVersions(this.isLoaded);
    }
  }
}
