import { IDistributionStore, isAppleStore, isGooglePlayStore, isIntuneStore } from "@root/data/build";

export const ReleaseNotesLength = {
  AppleMinLength: 10,
  AppleMaxLength: 4000,
  IntuneMinLength: 0,
  IntuneMaxLength: 1024,
  GoogleMinLength: 0,
  GoogleMaxLength: 500,
};

export class ReleaseHelper {
  public static getReleaseNotesMinLength(store: IDistributionStore): number {
    if (isAppleStore(store)) {
      return ReleaseNotesLength.AppleMinLength;
    }
    if (isGooglePlayStore(store)) {
      return ReleaseNotesLength.GoogleMinLength;
    }

    if (isIntuneStore(store)) {
      return ReleaseNotesLength.IntuneMinLength;
    }
    // Others - no min limit
    return 0;
  }

  public static getReleaseNotesMaxLength(store: IDistributionStore): number | undefined {
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
    return;
  }
}
