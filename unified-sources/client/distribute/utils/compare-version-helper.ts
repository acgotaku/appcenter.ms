import { OS } from "../models/os";
import { ReleaseHelper } from "./release-helper";
import { PartialRelease } from "@root/data/distribute/models/partial-release";
const compareVersions = require("compare-versions");

export const compareEntry = (a: any, b: any) => {
  if (a > b) {
    return 1;
  }
  if (a < b) {
    return -1;
  }
  return 0;
};

const compareAndroidVersion = (a: PartialRelease, b: PartialRelease) => {
  return compareEntry(parseInt(a.version, 10), parseInt(b.version, 10));
};

const compareWindowsVersion = (a: PartialRelease, b: PartialRelease) => {
  const aIsValid: boolean = ReleaseHelper.isValidWindowsVersion(a.version);
  const bIsValid: boolean = ReleaseHelper.isValidWindowsVersion(b.version);

  if (!aIsValid && !bIsValid) {
    return 0;
  }
  if (!aIsValid) {
    return -1;
  }
  if (!bIsValid) {
    return 1;
  }

  const componentsA = a.version.split(".");
  const componentsB = b.version.split(".");
  for (let i = 0; i < 4; i++) {
    const a = parseInt(componentsA[i], 10);
    const b = parseInt(componentsB[i], 10);
    const result = compareEntry(a, b);
    if (result !== 0) {
      return result;
    }
  }
  return 0;
};

const compareIOSVersion = (a: PartialRelease, b: PartialRelease) => {
  let result: number = 0;
  const aIsValid: boolean = ReleaseHelper.isSemVerFormat(a.shortVersion);
  const bIsValid: boolean = ReleaseHelper.isSemVerFormat(b.shortVersion);

  if (!aIsValid && !bIsValid) {
    result = 0;
  } else if (aIsValid && !bIsValid) {
    result = 1;
  } else if (!aIsValid && bIsValid) {
    result = -1;
  } else {
    result = compareVersions(a.shortVersion, b.shortVersion);
  }

  if (result === 0) {
    result = compareEntry(parseInt(a.version, 10), parseInt(b.version, 10));
  }
  return result;
};

export const compareVersion = (a: PartialRelease, b: PartialRelease, appOs: string) => {
  if (OS.isWindows(appOs)) {
    return compareWindowsVersion(a, b);
  } else if (OS.isAndroid(appOs)) {
    return compareAndroidVersion(a, b);
  } else {
    return compareIOSVersion(a, b);
  }
};
