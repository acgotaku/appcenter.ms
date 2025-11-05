import { Store } from "@root/data/lib";
import { SerializedDistributionGroup, DeserializedDistributionGroup, DistributionGroup } from "@root/data/distribute/models";
import { ReleasesApi, ApiPublicDistributionGroupsResponse } from "@root/api/clients/releases/api";

type ReleaseHashQuery = {
  appSecret: string;
  releaseHash: string;
};

export class DistributionGroupReleaseHashStore extends Store<
  DeserializedDistributionGroup,
  SerializedDistributionGroup,
  DistributionGroup,
  ReleaseHashQuery
> {
  protected ModelClass = DistributionGroup;

  protected generateIdFromResponse(resource: SerializedDistributionGroup, query?: any) {
    return resource.id;
  }

  protected getModelId(model: DistributionGroup): string {
    return model.id;
  }

  protected async getCollection(query: ReleaseHashQuery): Promise<SerializedDistributionGroup[]> {
    const params: ReleasesApi.GetPublicGroupsForReleaseByHashReleasesParams = {
      appSecret: query.appSecret,
      releaseHash: query.releaseHash,
    };
    const publicGroupsResponse: ApiPublicDistributionGroupsResponse[] = await ReleasesApi.getPublicGroupsForReleaseByHashReleases(
      params,
      { noBifrostToken: true }
    );
    return publicGroupsResponse as SerializedDistributionGroup[];
  }

  protected deserialize(serialized: SerializedDistributionGroup, queryOrOptions?: ReleaseHashQuery): DeserializedDistributionGroup {
    return {
      id: serialized.id,
    };
  }
}

export const distributionGroupReleaseHashStore = new DistributionGroupReleaseHashStore();
