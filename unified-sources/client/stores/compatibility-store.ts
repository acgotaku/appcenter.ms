import { computed, observable } from "mobx";
import { UAParser } from "ua-parser-js";
import { getOsFromUserAgent, getBrowserFromUserAgent } from "@root/lib/utils/user-agent";
import { isIos, isAndroid, isMacOS, isWindows } from "../lib/utils/os-utils";

class CompatibilityStore {
  // See https://github.com/faisalman/ua-parser-js for all possible user-agent OS constants
  public static UserAgent = {
    OSNames: {
      iOS: "iOS",
      macOS: "Mac OS",
      Android: "Android",
      Windows: "Windows",
      WindowsPhone: "Windows Phone",
    },
    OSDisplayNames: {
      "Mac OS": "macOS",
    },
    BrowserNames: {
      MobileSafari: "Mobile Safari",
      Chrome: "Chrome",
      AndroidBrowser: "Android Browser",
      SamsungInternet: "Samsung Internet",
      Edge: "Edge",
      Firefox: "Firefox",
    },
  };

  @observable
  private userAgentOs: IUAParser.IOS;

  @observable
  private userAgentBrowser: IUAParser.IBrowser;

  @computed get isMobileDevice(): boolean {
    return this.isIos || this.isAndroid || this.isWindowsPhone;
  }

  @computed get isIos(): boolean {
    return isIos(this.userAgentOs.name);
  }

  @computed get isAndroid(): boolean {
    return isAndroid(this.userAgentOs.name);
  }

  @computed get isMacOs(): boolean {
    return isMacOS(this.userAgentOs.name);
  }

  @computed get isWindows(): boolean {
    return isWindows(this.userAgentOs.name);
  }

  @computed get isWindowsPhone(): boolean {
    return this.userAgentOs.name === CompatibilityStore.UserAgent.OSNames.WindowsPhone;
  }

  @computed get isSafariBrowser(): boolean {
    return (
      this.isIos && this.userAgentBrowser && this.userAgentBrowser.name === CompatibilityStore.UserAgent.BrowserNames.MobileSafari
    );
  }

  constructor() {
    const parser = new UAParser();

    const userAgent: string = parser.getUA();
    this.userAgentOs = getOsFromUserAgent();
    this.userAgentBrowser = this.identifyAndroidBrowser(getBrowserFromUserAgent(), userAgent);
  }

  /**
   * If the browser is "Android Browser", check if it's actually something more specific,
   * like "Samsung Internet" http://developer.samsung.com/technical-doc/view.do?v=T000000203
   */
  private identifyAndroidBrowser(userAgentBrowser: IUAParser.IBrowser, userAgent: string): IUAParser.IBrowser {
    const browserNames = CompatibilityStore.UserAgent.BrowserNames;
    if (!userAgentBrowser || userAgentBrowser.name !== browserNames.AndroidBrowser) {
      return userAgentBrowser;
    } else {
      const foundSamsungInternet: boolean = /SamsungBrowser/.test(userAgent);
      return foundSamsungInternet ? Object.assign(userAgentBrowser, { name: browserNames.SamsungInternet }) : userAgentBrowser;
    }
  }
}

export const compatibilityStore = new CompatibilityStore();
