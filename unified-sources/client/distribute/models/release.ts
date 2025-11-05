import { DistributionGroup } from "@root/data/distribute/models/distribution-group";
import { DistributionStoreRelease } from "@root/data/distribute/models/distribution-store";
import { ReleaseDestination } from "@root/data/distribute/models/release-destination";
import { DownloadCount } from "@root/data/distribute/models/release-counts";

export const ProfileType = {
  adhoc: "adhoc",
  enterprise: "enterprise",
  other: "other",
};

export type ProfileType = keyof typeof ProfileType;

export interface Release {
  id: number;
  appName: string;
  appDisplayName: string;
  uploadedAt: string;
  fingerprint?: string;
  releaseNotes?: string;
  version: string;
  shortVersion: string;
  minOs?: string;
  status?: string;
  size?: number;
  provisioningProfileName?: string;
  provisioningProfileType?: ProfileType;
  isProvisioningProfileSyncing?: boolean;
  appIconUrl: string;
  downloadUrl?: string;
  secondaryDownloadUrl?: string;
  mandatoryUpdate: boolean;
  enabled: boolean;
  destinationType?: "group" | "tester" | "store";
  distributionGroups?: DistributionGroup[];
  distributionStores?: DistributionStoreRelease[];
  destinations?: ReleaseDestination[];
  bundleIdentifier?: string;
  downloadStats?: DownloadCount;
  origin?: `hockeyapp` | `appcenter`;
  isExternalBuild?: boolean;
  fileExtension?: string;
}
