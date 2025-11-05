import { OS as AppOS } from "@lib/common-interfaces/app";

export class OS {
  public static IOS: string = AppOS.IOS;
  public static ANDROID: string = AppOS.ANDROID;

  public static isIos(os: string): boolean {
    return !!os && os.toLowerCase() === AppOS.IOS.toLowerCase();
  }

  public static isMacOS(os: string): boolean {
    return !!os && os.toLowerCase() === AppOS.MACOS.toLowerCase();
  }

  public static isAndroid(os: string): boolean {
    return !!os && os.toLowerCase() === AppOS.ANDROID.toLowerCase();
  }

  public static isWindows(os: string): boolean {
    return !!os && os.toLowerCase().startsWith(AppOS.WINDOWS.toLowerCase());
  }

  public static isLinux(os: string): boolean {
    return !!os && os.toLowerCase().startsWith(AppOS.LINUX.toLowerCase());
  }

  public static isCustom(os: string): boolean {
    return !!os && os.toLowerCase().startsWith(AppOS.CUSTOM.toLowerCase());
  }
}
