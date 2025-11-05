import { OS } from "@lib/common-interfaces/app";

export function isIos(os: string | undefined): boolean {
  return !!os && os.toLowerCase() === OS.IOS.toLowerCase();
}

export function isMacOS(os: string | undefined): boolean {
  return !!os && os.toLowerCase() === OS.MACOS.toLowerCase();
}

export function isAndroid(os: string | undefined): boolean {
  return !!os && os.toLowerCase() === OS.ANDROID.toLowerCase();
}

export function isWindows(os: string | undefined): boolean {
  return !!os && os.toLowerCase().startsWith(OS.WINDOWS.toLowerCase());
}

export function isLinux(os: string | undefined): boolean {
  return !!os && os.toLowerCase().startsWith(OS.LINUX.toLowerCase());
}
