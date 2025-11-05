import {
  ApiBasicReleaseDetailsResponse,
  ApiReleaseDetailsResponse,
  ApiDistributionGroupWithoutIsLatest,
  ApiDistributionStoreWithoutIsLatest,
  ApiDestination,
  ApiBuildInfo,
  ApiDistributionGroup,
  ApiDistributionStore,
  ApiDistributionGroupRelease,
} from "@root/api/clients/releases/api";
import { Model } from "@root/data/lib";
import { observable } from "mobx";

export enum ReleaseResponseType {
  Partial,
  Full,
}

export interface DownloadCount {
  uniqueCount: number;
  totalCount: number;
}

export interface DeserializedPartialRelease extends ApiBasicReleaseDetailsResponse {
  kind: ReleaseResponseType;
  downloadStats?: DownloadCount;
}

export interface DeserializedFullRelease extends ApiReleaseDetailsResponse, ApiDistributionGroupRelease {
  kind: ReleaseResponseType;
  downloadStats?: DownloadCount;
}

export function isPartialRelease(release: Release): release is DeserializedPartialRelease {
  return release.kind === ReleaseResponseType.Partial;
}

export function isFullRelease(release: Release): release is DeserializedFullRelease {
  return release.kind === ReleaseResponseType.Full;
}

export type Release = DeserializedPartialRelease | DeserializedFullRelease;

export class ReleaseModel extends Model<Release> implements DeserializedPartialRelease, DeserializedFullRelease {
  kind!: ReleaseResponseType; // release cast workaround
  @observable id!: number; // release cast workaround
  @observable appName!: string; // release cast workaround
  @observable appDisplayName!: string; // release cast workaround
  @observable version!: string; // release cast workaround
  @observable shortVersion!: string; // release cast workaround
  @observable releaseNotes?: string;
  @observable provisioningProfileName?: string;
  @observable provisioningProfileType?: ApiReleaseDetailsResponse.ApiProvisioningProfileTypeEnum;
  @observable provisioningProfileExpiryDate?: string;
  @observable isProvisioningProfileSyncing?: boolean;
  @observable size?: number;
  @observable minOs?: string;
  @observable deviceFamily?: string;
  @observable androidMinApiLevel?: string;
  @observable bundleIdentifier?: string;
  @observable fingerprint?: string;
  @observable uploadedAt!: string; // release cast workaround
  @observable downloadUrl?: string;
  @observable appIconUrl!: string; // release cast workaround
  @observable installUrl?: string;
  @observable destinationType?:
    | ApiBasicReleaseDetailsResponse.ApiDestinationTypeEnum
    | ApiReleaseDetailsResponse.ApiDestinationTypeEnum;
  @observable distributionGroups?: ApiDistributionGroup[] | ApiDistributionGroupWithoutIsLatest[];
  @observable distributionStores?: ApiDistributionStore[] | ApiDistributionStoreWithoutIsLatest[];
  @observable destinations?: ApiDestination[];
  @observable isUdidProvisioned?: boolean;
  @observable canResign?: boolean;
  @observable build?: ApiBuildInfo;
  @observable enabled!: boolean; // release cast workaround
  @observable isExternalBuild?: boolean;
  @observable downloadStats?: DownloadCount;
  @observable mandatoryUpdate!: boolean; // release cast workaround
  @observable status?: string;
  @observable fileExtension!: string;

  /**
   * Instantiates a model, optionally with initial values.
   * @param initialValues A map of initial values to assign to the model upon creation.
   */
  constructor(initialValues?: Partial<ReleaseModel>) {
    super(initialValues);
  }
}
