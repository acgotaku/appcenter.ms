declare const window: any;

import { scrubPath } from "./data-scrubber";
import { RouteUtils } from "./route-utils";
import { last, some } from "lodash";
import { IApp, IUser } from "@lib/common-interfaces";

export interface TelemetryAppStore {
  app?: IApp;
  apps: IApp[];
}

export class Telemetry {
  private commit: string;
  private appStore?: TelemetryAppStore;
  private path: string;
  private internalUser?: boolean;
  private userOrigin?: string;
  private beacon: string;
  private billingNotifiers?: { isPaid: boolean }[];

  constructor() {
    this.path = "";
    this.beacon = "";
    this.commit = (((window as any).initProps || {}).config || {}).commit || "unknown";
  }

  public init() {
  }

  public setUser(user: IUser, account?: string) {
    if (user.email) {
      const domain = last(user.email.split("@"));
      if (domain) {
        this.internalUser = domain.toLowerCase() === "microsoft.com";
      }
    }

    this.userOrigin = user.origin;
  }

  public setAppStoreContext(appStore: TelemetryAppStore) {
    this.appStore = appStore;
  }

  /**
   * Begins tracking whether the current app has been paid for.
   */
  public startTrackingPaidApps(billingNotifiers: { isPaid: boolean }[]) {
    this.billingNotifiers = billingNotifiers;
  }

  public setPathContext(path: string) {
    this.path = path;
    this.beacon = this.getBeacon(path);
  }

  public get commonProperties() {
    const app = this.appStore && this.appStore.app;
    const props = {
      beacon: this.beacon,
      path: scrubPath(this.path),
      appId: app && app.id,
      internalUser: this.internalUser,
      commit: this.commit,
      appOrigin: app && app.origin,
      isPaid: this.isPaid(),
      userOrigin: this.userOrigin,
    };

    const os = this.getOS();
    if (os) {
      props["os"] = os;
    }

    const platform = this.getPlatform();
    if (platform) {
      props["platform"] = platform;
    }

    if (app && app.microsoft_internal) {
      // track whether or not the current app is enabled for MS-internal dogfooding
      props["microsoftInternalApp"] = true;
    }

    return props;
  }

  private getBeacon(path: string): string {
    return RouteUtils.extractBeaconFromPath(window.location.host, path);
  }

  private isPaid(): boolean | undefined {
    if (this.billingNotifiers) {
      // If there's paid for just _one_ plan, we're happy
      if (some(this.billingNotifiers, (notifier) => notifier.isPaid)) {
        return true;
      }
      // If there are still plans we don't know about, the result is undefined
      if (some(this.billingNotifiers, (notifier) => notifier.isPaid === undefined)) {
        return undefined;
      }

      return false;
    }

    return undefined;
  }

  private getOS(): string | undefined {
    if (this.appStore && this.appStore.app) {
      return this.appStore.app.os;
    }
  }

  private getPlatform(): string | undefined {
    if (this.appStore && this.appStore.app) {
      return this.appStore.app.platform;
    }
  }
}

export const telemetry = new Telemetry();
