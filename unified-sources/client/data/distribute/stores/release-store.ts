import { Store } from "@root/data/lib";
import { Release, ReleaseModel, ReleaseResponseType, DeserializedFullRelease } from "../models/release";
import { appStore } from "@root/stores";
import {
  ReleasesApi,
  ApiBasicReleaseDetailsResponse,
  ApiReleaseDetailsUpdateRequest,
  ApiDestination,
  ApiReleaseUpdateResponse,
  ApiReleaseDetailsResponse,
} from "@root/api/clients/releases/api";
import { AnalyticsApi, ApiReleaseCount, ApiReleaseCounts } from "@root/api/clients/analytics/api";
import { StoresApi } from "@root/api/clients/stores/api";
import { logger } from "@root/lib/telemetry";
import { computed } from "mobx";
import { DistributionGroup } from "../models/distribution-group-model";
import { releaseDestinationAssociationStore } from "./release-destination-association-store";

interface FetchDistributionGroupReleasesQueryOptions {
  groupName?: string;
}

interface FetchDistributionStoreReleasesQueryOptions {
  storeName?: string;
}

interface FetchDistributionTesterReleasesQueryOptions {
  testerEmail?: string;
}

interface UpdateReleaseQueryOptions {
  releaseDestination?: ApiDestination;
  mandatoryUpdate?: boolean;
  groupId?: string;
}

interface FetchReleases {
  top?: boolean;
  releaseId?: number;
}

export type ReleasesQueryOptions = FetchDistributionGroupReleasesQueryOptions &
  UpdateReleaseQueryOptions &
  FetchDistributionStoreReleasesQueryOptions &
  FetchDistributionTesterReleasesQueryOptions &
  FetchReleases;

type ForeignKey = keyof Release;

class ReleaseStore extends Store<Release, Release, ReleaseModel, ReleasesQueryOptions> {
  protected ModelClass = ReleaseModel;

  protected generateIdFromResponse(resource: Release, query?: any) {
    return String(resource.id);
  }

  protected getModelId(model: ReleaseModel): string {
    return String(model.id);
  }

  protected deserialize(
    serialized: Release,
    queryOrOptions?: any,
    foreignKey?: ForeignKey,
    foreignKeyValue?: Release[ForeignKey]
  ): Release {
    // When you fetch one release (without destinations) it returns an empty array
    // when you fetch all releases (without destinations) it returns undefined
    // this will force all empty destination arrays to undefined
    if (serialized.destinations && !serialized.destinations.length) {
      serialized.destinations = undefined;
    }
    return serialized;
  }

  protected async getCollection(
    query?: FetchDistributionGroupReleasesQueryOptions & FetchDistributionStoreReleasesQueryOptions & FetchReleases
  ): Promise<Release[]> {
    const { app } = appStore;
    const baseParams: AnalyticsApi.DistributionReleaseCountsParams = {
      ownerName: app.owner.name,
      appName: app.name || "",
    };

    const numberOfReleasesToLoad = 100;

    let retrievedReleases: ApiBasicReleaseDetailsResponse[];
    if (query && query.groupName) {
      retrievedReleases = await ReleasesApi.listByDistributionGroupReleases({
        ...baseParams,
        distributionGroupName: query.groupName,
        publishedOnly: false,
      });
    } else if (query && query.storeName) {
      retrievedReleases = (await StoresApi.listStoreReleases({
        ...baseParams,
        storeName: query.storeName,
      })) as ApiBasicReleaseDetailsResponse[];
    } else {
      retrievedReleases = await ReleasesApi.listReleases({
        ...baseParams,
        top: query?.top ? numberOfReleasesToLoad : null,
        releaseId: query?.releaseId,
        publishedOnly: false,
      });
    }

    const releaseIds = { releases: retrievedReleases.map((release) => ({ release: `${release.id}` })) };
    let releaseCounts: ApiReleaseCounts = { counts: [] };
    if (releaseIds.releases.length > 0) {
      try {
        releaseCounts = await AnalyticsApi.distributionReleaseCounts(baseParams, releaseIds);
      } catch (err) {
        // Sometimes fetching release counts failing and because of this, whole releases table is not getting disaplyed.
        // In order to display details apart from downloads counts, catching the exception and swallowing it.
      }
    }

    return retrievedReleases.map<Release>((release: any) => {
      const count =
        releaseCounts.counts.length > 0
          ? releaseCounts.counts && releaseCounts.counts.find((count) => count.releaseId === `${release.id}`)
          : // Sending an identifier (-1) as counts based on which apart from download counts, all other details are loaded
            { releaseId: "0", distributionGroup: undefined, uniqueCount: -1, totalCount: -1 };

      return {
        kind: ReleaseResponseType.Partial,
        downloadStats: { totalCount: count?.totalCount, uniqueCount: count?.uniqueCount },
        ...release,
      };
    });
  }

  protected async getResource(id: string, query?: ReleasesQueryOptions): Promise<Release> {
    const { app } = appStore;
    const releaseParams: ReleasesApi.GetLatestByUserReleasesParams = {
      ownerName: app.owner.name,
      appName: app.name || "",
      releaseId: id,
    };
    const distributionParams: AnalyticsApi.DistributionReleaseCountsParams = {
      ownerName: app.owner.name,
      appName: app.name || "",
    };

    const [retrievedRelease, releaseCount]: [ApiReleaseDetailsResponse, ApiReleaseCount | null] = await Promise.all([
      ReleasesApi.getLatestByUserReleases(releaseParams),
      this.getDistributionReleaseCounts(distributionParams, id),
    ]);

    return {
      kind: ReleaseResponseType.Full,
      downloadStats: { totalCount: releaseCount?.totalCount || 0, uniqueCount: releaseCount?.uniqueCount || 0 },
      ...retrievedRelease,
    };
  }

  private async getDistributionReleaseCounts(distributionParams, releaseId): Promise<ApiReleaseCount | null> {
    try {
      const releaseCounts = await AnalyticsApi.distributionReleaseCounts(distributionParams, { releases: [{ release: releaseId }] });
      return releaseCounts?.counts?.[0];
    } catch (ex) {
      // Sometimes fetching release counts fails and because of this, whole release details are not getting displayed.
      // In order to display details apart from downloads counts, catching the exception and swallowing it.
      logger.warn(String(ex));
      return null;
    }
  }

  protected deleteResource(resource: ReleaseModel, options?: ReleasesQueryOptions): Promise<any> {
    const { app } = appStore;
    const params: ReleasesApi.DeleteReleasesParams = {
      ownerName: app.owner.name,
      appName: app.name || "",
      releaseId: resource?.id,
    };
    return ReleasesApi.deleteReleases(params);
  }

  protected async patchResource(
    release: ReleaseModel,
    changes: Partial<DeserializedFullRelease>,
    options?: UpdateReleaseQueryOptions
  ): Promise<any> {
    const promises: Promise<ApiReleaseUpdateResponse | any>[] = [];
    const { app } = appStore;
    const params: ReleasesApi.UpdateDetailsReleasesParams = {
      ownerName: app.owner.name,
      appName: app.name || "",
      releaseId: release.id,
    };
    const body: ApiReleaseDetailsUpdateRequest = Object.keys(changes).reduce<ApiReleaseDetailsUpdateRequest>(
      (accumulator: ApiReleaseDetailsUpdateRequest, key: string) => {
        if (key === "enabled") {
          accumulator.enabled = changes.enabled;
        }
        if (key === "releaseNotes") {
          accumulator.releaseNotes = changes.releaseNotes;
        }
        if (key === "build") {
          accumulator.build = changes.build;
        }

        return accumulator;
      },
      {}
    );

    promises.push(ReleasesApi.updateDetailsReleases(params, body));

    if (
      options &&
      options.releaseDestination &&
      options.releaseDestination.id &&
      options.releaseDestination.destinationType === "group"
    ) {
      promises.push(
        releaseDestinationAssociationStore.updateAssociation(
          options.releaseDestination.name || "",
          release.id.toString(),
          { mandatoryUpdate: options.mandatoryUpdate || false },
          false,
          { groupId: options.releaseDestination.id }
        ).promise
      );
    }

    return Promise.all(promises);
  }

  getGlobalCacheKey() {
    return appStore.app ? appStore.app.id : undefined;
  }

  /**
   * Gets a specific release from the data store.
   *
   * NOTE: Use this instead of `get` in order to differentiate between partial and full releases.
   */
  public getRelease(id: string): Release | undefined;
  /** Gets a single cached resource by pieces of a compound key. */
  public getRelease(...keyPieces: string[]): Release | undefined;
  public getRelease(...keyPieces: string[]): Release | undefined {
    return this.get(...keyPieces);
  }

  protected async getResourceForRelationship<T extends unknown>(foreignModel?: T, foreignKey?: keyof T): Promise<Release> {
    const { app } = appStore;
    const baseParams: AnalyticsApi.DistributionReleaseCountsParams = {
      ownerName: app.owner.name,
      appName: app.name || "",
    };

    if (foreignModel instanceof DistributionGroup && foreignKey === "latestReleaseId") {
      const retrievedRelease = await ReleasesApi.getLatestByDistributionGroupReleases({
        ...baseParams,
        distributionGroupName: foreignModel.name || "",
        releaseId: "latest",
      });
      const releaseCounts = await AnalyticsApi.distributionReleaseCounts(baseParams, {
        releases: [{ release: retrievedRelease.id.toString() }],
      });
      const count = releaseCounts.counts && releaseCounts.counts.length && releaseCounts.counts[0];
      return {
        kind: ReleaseResponseType.Full,
        downloadStats: { totalCount: count && count.totalCount, uniqueCount: count && count.uniqueCount },
        ...retrievedRelease,
      };
    }

    throw new Error(`'fetchOneForRelationship()' is only supported with an DistributionGroup model and foreign Key 'latestReleaseId'`);
  }

  public fetchLatestReleaseForDistributionGroup(distributionGroup: DistributionGroup) {
    return this.fetchOneForRelationship(distributionGroup, "latestReleaseId");
  }

  public toggleEnableRelease(release: ReleaseModel) {
    const releaseDetailsUpdateBody = {
      enabled: !release.enabled,
    };
    return this.update(release, releaseDetailsUpdateBody);
  }

  public fetchReleasesForDistributionGroup(groupName: string) {
    return this.fetchForManyToMany(releaseDestinationAssociationStore, groupName, { groupName });
  }

  public getReleasesForDestination(groupName: string): ReleaseModel[] {
    return this.relatedTo(groupName, releaseDestinationAssociationStore);
  }

  /**
   * Gets all of the releases in the data store.
   *
   * NOTE: Use this prop instead of `resources` in order to differentiate between partial and full releases.
   */
  @computed get releases(): Release[] {
    return this.resources;
  }
}

export const releaseStore = new ReleaseStore();
