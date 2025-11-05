import { IApp, BeaconName, Origin, OS, PLATFORM } from "@lib/common-interfaces";

export type Support = ((app: IApp, beaconName: string) => boolean) | boolean | BeaconName[];
export type PlatformSupport = { [key in PLATFORM]?: Support };
export type OsSupport = { [key in OS]?: PlatformSupport | Support };

export type SupportMatrix = {
  [key in Origin]?: OsSupport | Support;
};

const matrix: SupportMatrix = {
  hockeyapp: {
    [OS.LINUX]: {
      [PLATFORM.ELECTRON]: ["apps", "distribute"],
    },
    [OS.IOS]: {
      [PLATFORM.OBJECTIVE_C_SWIFT]: true,
      [PLATFORM.XAMARIN]: true,
      [PLATFORM.REACT_NATIVE]: true,
      [PLATFORM.UNITY]: ["apps", "test", "distribute", "crashes", "analytics", "settings", "push"],
      [PLATFORM.CORDOVA]: ["apps", "test", "distribute", "crashes", "analytics", "push"],
      [PLATFORM.UNKNOWN]: ["crashes", "analytics"],
    },
    [OS.ANDROID]: {
      [PLATFORM.JAVA]: true,
      [PLATFORM.XAMARIN]: true,
      [PLATFORM.REACT_NATIVE]: true,
      [PLATFORM.UNITY]: ["apps", "test", "distribute", "crashes", "analytics", "settings", "push"],
      [PLATFORM.CORDOVA]: ["apps", "test", "distribute", "crashes", "analytics", "push"],
      [PLATFORM.UNKNOWN]: ["analytics"],
    },
    [OS.WINDOWS]: {
      [PLATFORM.UWP]: ["apps", "crashes", "distribute", "analytics", "build", "push"],
      [PLATFORM.WPF]: ["apps", "crashes", "distribute", "analytics"],
      [PLATFORM.WINFORMS]: ["apps", "crashes", "distribute", "analytics"],
      [PLATFORM.UNITY]: ["apps", "distribute", "crashes", "analytics", "settings", "push"],
      [PLATFORM.ELECTRON]: ["apps", "distribute"],
    },
    [OS.MACOS]: {
      [PLATFORM.OBJECTIVE_C_SWIFT]: ["apps", "crashes", "distribute", "analytics", "build"],
      [PLATFORM.ELECTRON]: ["apps", "distribute"],
    },
    [OS.TVOS]: {
      [PLATFORM.OBJECTIVE_C_SWIFT]: ["apps", "crashes", "distribute", "analytics"],
    },
    [OS.CUSTOM]: ["apps", "distribute", "crashes"],
  },
  "mobile-center": {
    [OS.LINUX]: {
      [PLATFORM.ELECTRON]: ["apps", "distribute", "crashes"],
    },
    [OS.IOS]: {
      [PLATFORM.OBJECTIVE_C_SWIFT]: true,
      [PLATFORM.XAMARIN]: true,
      [PLATFORM.REACT_NATIVE]: true,
      [PLATFORM.UNITY]: ["apps", "test", "distribute", "crashes", "analytics", "settings", "push"],
      [PLATFORM.ELECTRON]: ["apps", "distribute"],
      [PLATFORM.CORDOVA]: ["apps", "test", "distribute", "crashes", "analytics", "push", "settings"],
    },
    [OS.ANDROID]: {
      [PLATFORM.JAVA]: true,
      [PLATFORM.XAMARIN]: true,
      [PLATFORM.REACT_NATIVE]: true,
      [PLATFORM.UNITY]: ["apps", "test", "distribute", "crashes", "analytics", "settings", "push"],
      [PLATFORM.ELECTRON]: ["apps", "distribute"],
      [PLATFORM.CORDOVA]: ["apps", "test", "distribute", "crashes", "analytics", "push", "settings"],
    },
    [OS.WINDOWS]: {
      [PLATFORM.UWP]: ["apps", "crashes", "distribute", "analytics", "build", "push", "settings"],
      [PLATFORM.UNITY]: ["apps", "distribute", "analytics", "settings", "push"],
      [PLATFORM.ELECTRON]: ["apps", "distribute", "crashes"],
      [PLATFORM.WPF]: ["apps", "crashes", "distribute", "analytics"],
      [PLATFORM.WINFORMS]: ["apps", "crashes", "distribute", "analytics"],
    },
    [OS.TIZEN]: () => false,
    [OS.MACOS]: {
      [PLATFORM.XAMARIN]: ["apps", "crashes", "distribute", "analytics", "settings"],
      [PLATFORM.OBJECTIVE_C_SWIFT]: ["apps", "crashes", "distribute", "analytics", "push", "build", "settings"],
      [PLATFORM.ELECTRON]: ["apps", "distribute", "crashes"],
    },
    [OS.LINUX]: {
      [PLATFORM.ELECTRON]: ["apps", "distribute", "crashes"],
    },
    [OS.TVOS]: {
      [PLATFORM.OBJECTIVE_C_SWIFT]: ["apps", "crashes", "distribute", "analytics", "build", "settings"],
    },
    [OS.CUSTOM]: ["apps", "distribute", "crashes"],
  },
  codepush: {
    [OS.IOS]: {
      [PLATFORM.OBJECTIVE_C_SWIFT]: true,
      [PLATFORM.XAMARIN]: true,
      [PLATFORM.REACT_NATIVE]: true,
      [PLATFORM.CORDOVA]: ["apps", "test", "distribute", "crashes", "analytics", "push"],
    },
    [OS.ANDROID]: {
      [PLATFORM.JAVA]: true,
      [PLATFORM.XAMARIN]: true,
      [PLATFORM.REACT_NATIVE]: true,
      [PLATFORM.CORDOVA]: ["apps", "test", "distribute", "crashes", "analytics", "push"],
    },
    [OS.WINDOWS]: {
      [PLATFORM.UWP]: ["apps", "crashes", "distribute", "analytics", "build", "push"],
      [PLATFORM.ELECTRON]: ["apps", "distribute"],
    },
    [OS.MACOS]: {
      [PLATFORM.ELECTRON]: ["apps", "distribute"],
    },
    [OS.LINUX]: {
      [PLATFORM.ELECTRON]: ["apps", "distribute"],
    },
  },
  testcloud: {
    [OS.IOS]: {
      [PLATFORM.OBJECTIVE_C_SWIFT]: true,
      [PLATFORM.XAMARIN]: true,
      [PLATFORM.REACT_NATIVE]: true,
      [PLATFORM.CORDOVA]: ["apps", "test", "distribute", "crashes", "analytics", "push", "settings"],
      [PLATFORM.UNKNOWN]: ["apps", "test", "distribute", "crashes", "analytics", "push", "settings"],
    },
    [OS.ANDROID]: {
      [PLATFORM.JAVA]: true,
      [PLATFORM.XAMARIN]: true,
      [PLATFORM.REACT_NATIVE]: true,
      [PLATFORM.CORDOVA]: ["apps", "test", "distribute", "crashes", "analytics", "push", "settings"],
      [PLATFORM.UNKNOWN]: ["apps", "test", "distribute", "crashes", "analytics", "push", "settings"],
    },
  },
  get appcenter() {
    return this["mobile-center"];
  },
};

export class AppSupport {
  constructor(private supportMatrix: SupportMatrix = {}) {}

  public isSupported = (app: IApp | undefined, beaconName: BeaconName | null | undefined) => {
    if (!app) {
      return false;
    }
    return this.evaluateAppSupport(this.supportMatrix, beaconName, app, [app.origin, app.os, app.platform]);
  };

  private evaluateAppSupport(appSupport, beaconName: BeaconName | null | undefined, app: IApp, appProps: (string | undefined)[]) {
    if (!appSupport) {
      return false;
    } else if (typeof appSupport === "boolean") {
      return appSupport;
    } else if (typeof appSupport === "function") {
      return appSupport(app, beaconName);
    } else if (Array.isArray(appSupport)) {
      return appSupport.includes(beaconName);
    } else if (typeof appSupport === "object") {
      const nextKey = appProps.shift()!;
      return this.evaluateAppSupport(appSupport[nextKey], beaconName, app, appProps);
    }
  }
}

export const appSupport = new AppSupport(matrix);
