import { appStore } from "@root/stores";
import { apiGateway } from "@root/lib/http";
import { DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore } from "@root/shared";
import { ReleaseCounts } from "@root/data/distribute/models/release-counts";
import { Release } from "../models/release";
import { PartialRelease } from "@root/data/distribute/models/partial-release";
import { Urls } from "../utils/constants";
import { compact } from "lodash";
import { convertSnakeToCamelCase, caseConvertedAny } from "./convert-snake-to-camel-case";

export class ReleaseCountsLegacyStore extends DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore<ReleaseCounts> {
  public async oldFetchReleaseCountsDepricated(releaseIds: number[]): Promise<ReleaseCounts> {
    const counts = await apiGateway.post<caseConvertedAny>(Urls.GetReleaseCounts, {
      params: {
        app_name: appStore.name,
        owner_name: appStore.ownerName,
      },
      body: {
        releases: releaseIds.map((releaseId) => ({ release: "" + releaseId })),
      },
    });

    return convertSnakeToCamelCase<ReleaseCounts>(counts);
  }

  public async oldJoinReleaseDepricated(fetchPromise: Promise<Release>): Promise<any> {
    const release = await fetchPromise;
    if (!release) {
      return null;
    }
    const releaseCounts = await this.oldFetchReleaseCountsDepricated([release.id]);

    release.downloadStats = releaseCounts && releaseCounts.counts.length > 0 ? releaseCounts.counts[0] : undefined;

    return release;
  }

  public async oldJoinReleasesDepricated(fetchPromise: Promise<PartialRelease[]>): Promise<PartialRelease[]> {
    const releases = await fetchPromise;
    if (compact(releases).length > 0) {
      const releaseCounts = await this.oldFetchReleaseCountsDepricated(releases.map((release) => release.id));
      releases.forEach((release) => {
        const releaseCount = releaseCounts.counts.find((releaseCount) => releaseCount.releaseId === "" + release.id);
        release.downloadStats = { uniqueCount: releaseCount!.uniqueCount, totalCount: releaseCount!.totalCount };
      });
    }

    return releases;
  }
}
