import { observable } from "mobx";
import { appStore } from "@root/stores";
import { makeClientApp } from "./utils";

import { DefaultApi as AnalyticsClient } from "./analytics-api/browser/api";

export const analyticsClient = observable({
  get value() {
    // @ts-ignore. [Should fix it in the future] Swagger generated non-optional fields.
    return new AnalyticsClient(makeClientApp(appStore.app));
  },
});
