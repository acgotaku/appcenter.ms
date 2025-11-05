import { Store } from "@root/data/lib";
import {
  SerializedDistributionGroupTester,
  DistributionGroupTester,
  DeserializedDistributionGroupTester,
} from "@root/data/distribute/models/distribution-group-tester";
import { apiGateway } from "@root/lib/http";
import { API } from "@root/data/distribute/constants";
import { distributionGroupTesterAssociationStore } from "@root/data/distribute/stores/distribution-group-tester-association-store";
import { DistributionGroup } from "@root/data/distribute/models";

type TestersQuery = {
  organizationName: string;
  groupName?: string;
};

export class DistributionGroupTesterStore extends Store<
  DeserializedDistributionGroupTester,
  SerializedDistributionGroupTester,
  DistributionGroupTester,
  TestersQuery
> {
  protected ModelClass = DistributionGroupTester;

  protected generateIdFromResponse(resource: SerializedDistributionGroupTester, query?: any) {
    return resource.email;
  }

  protected getModelId(model: DistributionGroupTester): string | undefined {
    return model.email;
  }

  protected getCollection(query: TestersQuery): Promise<SerializedDistributionGroupTester[]> {
    const { organizationName: org_name, groupName: group_name } = query;
    const url = group_name ? API.ORG_TESTERS_IN_GROUP : API.ORG_TESTERS_ALL;
    return apiGateway.get<SerializedDistributionGroupTester[]>(url, {
      params: {
        org_name,
        ...(group_name && { group_name }),
      },
    });
  }

  protected deserialize<K extends keyof DeserializedDistributionGroupTester>(
    serialized: SerializedDistributionGroupTester,
    queryOrOptions?: TestersQuery
  ): DeserializedDistributionGroupTester {
    return {
      displayName: serialized.display_name,
      email: serialized.email,
      name: serialized.name,
      organizationName: queryOrOptions?.organizationName,
    };
  }

  public fetchTestersForGroup(organizationName: string, groupName: string) {
    const internalGroupKey = distributionGroupTesterAssociationStore.internalDistributionGroupKey(organizationName, groupName);
    return super.fetchForManyToMany(distributionGroupTesterAssociationStore, internalGroupKey, {
      organizationName,
      groupName,
    });
  }

  public getTestersForGroup(group: DistributionGroup): DistributionGroupTester[] {
    const groupKey = distributionGroupTesterAssociationStore.internalDistributionGroupKey(
      group.organizationName || "",
      group.name || ""
    );

    return this.relatedTo(groupKey, distributionGroupTesterAssociationStore);
  }
}

export const distributionGroupTesterStore = new DistributionGroupTesterStore();
