import { appStore } from "@root/stores";
import { IApp } from "@lib/common-interfaces";
import { CommonStrings, DistributionStoreCommonStrings, DistributeStoreWizardStrings } from "../utils/strings";
import { StringHelper } from "../utils/string-helper";
import { DistributionGroup } from "@root/data/distribute/models/distribution-group";
import { isGooglePlayStore, isIntuneStore, isAppleStore, DistributionStore } from "@root/data/distribute/models/distribution-store";
import { DistributionStoreRelease } from "@root/data/distribute/models/distribution-store";
import { OS } from "../models/os";
import { Release } from "../models/release";
import { ReleaseDestination } from "@root/data/distribute/models/release-destination";
import { ReleaseNotesLength } from "./constants";
import { ArrayHelper } from "./array-helper";
import { IconName } from "@root/shared";
import { PartialRelease } from "@root/data/distribute/models/partial-release";
import { releaseDestinationAssociationStore } from "@root/data/distribute/stores/release-destination-association-store";
import { Release as NewRelease, DeserializedFullRelease } from "@root/data/distribute/models/release";
import { humanizePackageSize } from "@root/lib/domain/package-size";

export type ReleaseDetails = "Normal" | "Details";
export class ReleaseHelper {
  public static createFileSizeLabel(fileSize: number): string {
    if (!fileSize) {
      return CommonStrings.NoValue;
    }
    return humanizePackageSize(fileSize);
  }

  public static versionString(shortVersion: string, version: string): string {
    if (shortVersion) {
      if (version) {
        return StringHelper.format(CommonStrings.VersionWithShortVersion, shortVersion, version);
      } else {
        return shortVersion;
      }
    }

    return version || "";
  }

  public static isAabRelease(downloadUrl?: string): boolean {
    return !!(downloadUrl && (downloadUrl.includes("format=aab") || downloadUrl.includes(".aab")));
  }

  public static isStoreDistributionSupported(): boolean {
    if (OS.isAndroid(appStore.app.os)) {
      return true;
    } else if (OS.isIos(appStore.app.os)) {
      return true;
    } else {
      return false;
    }
  }

  // WPF and WinForms do not yet support Mandatory Update
  public static isMandatoryUpdateSupported(): boolean {
    return !(appStore.app.isWinFormsApp || appStore.app.isWPFApp);
  }

  public static isStoreDestination(releaseDestination?: ReleaseDestination): boolean {
    return !!releaseDestination && releaseDestination.destinationType === "store";
  }

  public static isStoreRelease(destinationType: string) {
    return destinationType && destinationType.toLowerCase() === "store";
  }

  public static firstDistributionGroupName(distribution_groups: DistributionGroup[], defaultName: string): string {
    if (distribution_groups && distribution_groups.length > 0 && distribution_groups[0].name) {
      return distribution_groups[0].name;
    }

    return defaultName;
  }

  public static firstDistributionStoreName(distribution_stores: DistributionStoreRelease[], defaultName: string): string {
    if (distribution_stores && distribution_stores.length > 0 && distribution_stores[0].name) {
      return distribution_stores[0].name;
    }

    return defaultName;
  }

  public static firstDistributionTypeName(distribution_stores: DistributionStoreRelease[], defaultName: string): string {
    if (distribution_stores && distribution_stores.length > 0 && distribution_stores[0].type) {
      if (isGooglePlayStore(distribution_stores[0])) {
        return DistributionStoreCommonStrings.GooglePlayTitle;
      } else if (isIntuneStore(distribution_stores[0])) {
        return DistributionStoreCommonStrings.IntuneTitle;
      }
    }
    return defaultName;
  }

  public static firstDistributionStatus(distribution_stores: DistributionStoreRelease[], defaultName: string): string {
    if (distribution_stores && distribution_stores.length > 0 && distribution_stores[0].publishingStatus) {
      return distribution_stores[0].publishingStatus;
    }

    return defaultName;
  }

  public static isValidWindowsVersion(version: string) {
    const winVer = /^\d+.\d+.\d+.\d+$/g;
    if (typeof version === "string" && winVer.test(version)) {
      return true;
    }
    return false;
  }

  public static isSemVerFormat(shortVersion: string): boolean {
    const semver = /^v?(?:0|[1-9]\d*)(\.(?:[x*]|0|[1-9]\d*)(\.(?:[x*]|0|[1-9]\d*)(?:-[\da-z\-]+(?:\.[\da-z\-]+)*)?(?:\+[\da-z\-]+(?:\.[\da-z\-]+)*)?)?)?$/i;
    if (typeof shortVersion === "string" && semver.test(shortVersion)) {
      return true;
    }
    return false;
  }

  public static getAppForAppIcon(release: Release | DeserializedFullRelease, defaultIcon: string): IApp | undefined {
    if (appStore.app && release && release.appIconUrl) {
      return {
        display_name: appStore.app.display_name,
        os: appStore.app.os,
        icon_url: release.appIconUrl,
      };
    } else {
      return undefined;
    }
  }

  public static getReleaseNotesMinLength(store: DistributionStore): number {
    if (isAppleStore(store)) {
      return ReleaseNotesLength.AppleMinLength;
    }

    // Others - no min limit
    return 0;
  }

  public static getReleaseNotesMaxLength(store: DistributionStore): number | null {
    if (isAppleStore(store)) {
      return ReleaseNotesLength.AppleMaxLength;
    }

    if (isGooglePlayStore(store)) {
      return ReleaseNotesLength.GoogleMaxLength;
    }

    if (isIntuneStore(store)) {
      return ReleaseNotesLength.IntuneMaxLength;
    }

    // Others - no max limit
    return null;
  }

  public static isReleaseNotesLengthValid(releaseNotes: string, store: DistributionStore): boolean {
    // Apple, Intune and Apple TestFlight
    if (isAppleStore(store) || isIntuneStore(store) || isGooglePlayStore(store)) {
      const releaseNotesLength = releaseNotes ? releaseNotes.length : 0;
      const minLength = this.getReleaseNotesMinLength(store);
      const maxLength = this.getReleaseNotesMaxLength(store);
      return minLength <= releaseNotesLength && releaseNotesLength <= maxLength!;
    }

    return true;
  }

  public static formatOsExtensions(extensions: string[], recommended?: string): string {
    const formattedExtensions = extensions.map((ext) =>
      ext === recommended ? ext + DistributeStoreWizardStrings.RecommendedExtensionText : ext
    );
    return ArrayHelper.join(formattedExtensions, "or");
  }

  public static getIconName = (release: PartialRelease | Release, destinationName?: string): IconName =>
    ReleaseHelper.getIconNameCore(release, destinationName, "Normal");

  public static getIconNameDetails = (release: PartialRelease | Release | NewRelease, destinationName?: string): IconName =>
    ReleaseHelper.getIconNameCore(release, destinationName, "Details");

  private static getIconNameCore = (
    release: PartialRelease | Release | NewRelease,
    destinationName?: string,
    typeIcon?: string
  ): IconName => {
    if (!release.enabled) {
      return typeIcon === "Normal" ? IconName.ReleaseDisabled : IconName.ReleaseDisabledDetails;
    }

    if (release.isExternalBuild) {
      return typeIcon === "Normal" ? IconName.ReleaseExternal : IconName.ReleaseExternalDetails;
    }

    if (destinationName) {
      const association = releaseDestinationAssociationStore.get(destinationName, release.id.toString());
      if (association && association.mandatoryUpdate) {
        return IconName.ReleaseMandatory;
      }
    }

    if (typeIcon === "Normal") {
      return IconName.Release;
    } else {
      return IconName.ReleaseEnableDetails;
    }
  };
}
