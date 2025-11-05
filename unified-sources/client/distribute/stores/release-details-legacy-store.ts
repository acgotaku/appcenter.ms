import { appStore } from "@root/stores";
import { apiGateway } from "@root/lib/http";
import { DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore, ExternalDataState } from "@root/shared";
import { Release } from "../models/release";
import { Urls } from "../utils/constants";
import { ReleaseCountsLegacyStore } from "./release-counts-legacy-store";
import { ReleaseDestination } from "@root/data/distribute/models/release-destination";
import {
  PutReleaseDetailsUpdateResponse,
  PutReleaseDestinationGroupsDetailsResponse,
} from "../../data/distribute/models/put-release-distribution-models";
import { convertSnakeToCamelCase, caseConvertedAny } from "./convert-snake-to-camel-case";

export class ReleaseDetailsLegacyStore extends DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore<Release> {
  public fetchDataPromise?: Promise<Release>;

  private releaseCountsLegacyStore = new ReleaseCountsLegacyStore();

  constructor() {
    super(ExternalDataState.Idle);
  }

  public fetchRelease(releaseId: number): Promise<Release> {
    this.fetchDataPromise = apiGateway
      .get<caseConvertedAny>(Urls.ReleasePath, {
        params: {
          app_name: appStore.name,
          owner_name: appStore.ownerName,
          release_id: String(releaseId),
        },
      })
      .then((result) => {
        return convertSnakeToCamelCase<Release>(result);
      });

    const promise = this.releaseCountsLegacyStore.oldJoinReleaseDepricated(this.fetchDataPromise);

    if (this.data || this.data === null) {
      // `null` is empty, `undefined` is not yet fetched
      return this.loadInBackground(promise);
    } else {
      return this.load(promise);
    }
  }

  public resetCachedPromise(): void {
    this.fetchDataPromise = undefined;
  }

  public updateRelease(
    releaseId: number,
    releaseDetailsUpdateBody: object,
    releaseDestination?: ReleaseDestination,
    mandatoryUpdate?: boolean
  ): Promise<(PutReleaseDetailsUpdateResponse | PutReleaseDestinationGroupsDetailsResponse)[]> {
    const promises: Promise<PutReleaseDetailsUpdateResponse | PutReleaseDestinationGroupsDetailsResponse>[] = [];
    const updateReleaseDetailsPromise = apiGateway.put<PutReleaseDetailsUpdateResponse>(Urls.ReleaseDetailsUpdatePath, {
      body: releaseDetailsUpdateBody,
      params: {
        owner_name: appStore.ownerName,
        app_name: appStore.name,
        release_id: String(releaseId),
      },
    });
    promises.push(updateReleaseDetailsPromise);

    if (releaseDestination && releaseDestination.id && releaseDestination.destinationType === "group") {
      const mandatoryUpdateBody = {
        mandatory_update: mandatoryUpdate,
      };

      const mandatoryUpdatePromise = apiGateway.put<PutReleaseDestinationGroupsDetailsResponse>(
        Urls.ReleaseDestinationGroupsDetailsUpdatePath,
        {
          body: mandatoryUpdateBody,
          params: {
            owner_name: appStore.ownerName,
            app_name: appStore.name,
            release_id: String(releaseId),
            destination_id: releaseDestination.id,
          },
        }
      );
      promises.push(mandatoryUpdatePromise);
    }

    return Promise.all(promises);
  }
}

export const releaseDetailsStore = new ReleaseDetailsLegacyStore();
