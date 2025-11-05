import { computed } from "mobx";
import { find } from "lodash";

import { apiGateway } from "@root/lib/http";
import { CIBaseStore } from "./ci-base-store";

import { IXcodeVersion, IApplicationToolsets } from "@root/data/build";
import { storeOptimisticFetchDelta } from "@lib/constants/build";

/**
 * XcodeVersionsStore fetches the Xcode versions available to the app
 */
export class XcodeVersionsStore extends CIBaseStore<IXcodeVersion[] | undefined> {
  @computed
  public get currentVersion(): IXcodeVersion | undefined {
    if (this.hasVersions && this.data) {
      for (const version of this.data) {
        if (version.current) {
          return version;
        }
      }
    }
  }

  @computed
  public get xcode941Version(): IXcodeVersion | undefined {
    if (this.hasVersions && this.data) {
      return find(this.data, (version: IXcodeVersion) => version.name.startsWith("9.4.1"));
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
          tools: "xcode",
        },
      })
      .then((toolsets) => toolsets.xcode);

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
