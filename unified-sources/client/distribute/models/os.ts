import { OS as AppOS } from "@lib/common-interfaces/app";
import { ApiDestination } from "@root/api/clients/releases/api";
export class OS {
  public static iosExtensions: string[] = [".ipa"];
  public static androidExtensions: string[] = [".apk", ".aab"];
  public static storesAndroidExtensions: string[] = [".aab", ".apk"];
  public static linuxExtensions: string[] = [];
  public static windowsExtensions: string[] = [
    ".appx",
    ".appxbundle",
    ".appxupload",
    ".msix",
    ".msixbundle",
    ".msixupload",
    ".zip",
    ".msi",
  ];
  public static macOsExtensions: string[] = [".app.zip"];
  public static newMacOsExtensions: string[] = [".zip", ".app.zip", ".dmg", ".pkg"];
  public static tvOsExtensions: string[] = [".ipa"];
  public static customExtensions: string[] = [".zip"];

  public static isIos(os: string): boolean {
    return !!os && os.toLowerCase() === AppOS.IOS.toLowerCase();
  }

  public static isAndroid(os: string): boolean {
    return !!os && os.toLowerCase() === AppOS.ANDROID.toLowerCase();
  }

  public static isIosOrAndroid(os: string): boolean {
    return this.isIos(os) || this.isAndroid(os);
  }

  public static isWindows(os: string): boolean {
    return !!os && os.toLowerCase().includes(AppOS.WINDOWS.toLowerCase());
  }

  public static isLinux(os: string): boolean {
    return !!os && os.toLowerCase().includes(AppOS.LINUX.toLowerCase());
  }

  public static isMacOs(os: string): boolean {
    return !!os && os.toLowerCase() === AppOS.MACOS.toLowerCase();
  }

  public static isTvOs(os: string): boolean {
    return !!os && os.toLowerCase() === AppOS.TVOS.toLowerCase();
  }

  public static isCustom(os: string): boolean {
    return !!os && os.toLowerCase() === AppOS.CUSTOM.toLowerCase();
  }

  public static packageExtensions(os: string, destination?: ApiDestination.ApiDestinationTypeEnum): string[] {
    if (OS.isIos(os)) {
      return OS.iosExtensions;
    } else if (OS.isAndroid(os)) {
      return destination === "store" ? OS.storesAndroidExtensions : OS.androidExtensions;
    } else if (OS.isWindows(os)) {
      return OS.windowsExtensions;
    } else if (OS.isMacOs(os)) {
      return OS.newMacOsExtensions;
    } else if (OS.isLinux(os)) {
      return OS.linuxExtensions;
    } else if (OS.isTvOs(os)) {
      return OS.tvOsExtensions;
    } else if (OS.isCustom(os)) {
      return OS.customExtensions;
    }

    return [];
  }
}
