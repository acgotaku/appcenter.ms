import { CIBaseStore } from "./ci-base-store";
import { apiGateway } from "@root/lib/http";
import { IXamarinSDKBundle, IApplicationToolsets } from "@root/data/build";
import { storeOptimisticFetchDelta } from "@lib/constants/build";

export class XamarinSDKBundlesStore extends CIBaseStore<IXamarinSDKBundle[] | undefined> {
  public fetchVersions(background: boolean = false): Promise<void> {
    this.lastFetchTimestamp = Date.now();

    const path = this.getPathWithSlug("toolsets");
    const fetchBundlesPromise = apiGateway
      .get<IApplicationToolsets>(path, {
        params: {
          tools: "xamarin",
        },
      })
      .then((toolsets) => toolsets.xamarin);

    if (background) {
      return this.loadInBackgroundVoid(fetchBundlesPromise);
    } else {
      return this.loadVoid(fetchBundlesPromise);
    }
  }

  public refreshOptimistically() {
    const fetchDelta = this.lastFetchToNow();
    if (fetchDelta === undefined || fetchDelta > storeOptimisticFetchDelta || this.isFailed) {
      this.fetchVersions(this.isLoaded);
    }
  }
}
