import { AssociationStore, Association, ResourceRequest } from "../../lib";
import { ReleaseDestination, ReleaseTesterDestination, DistributionGroup } from "@root/data/distribute/models";
import { appStore } from "@root/stores";
import {
  ReleasesApi,
  ApiReleaseDestinationResponse,
  ApiReleaseStoreDestinationResponse,
  ApiReleaseUpdateResponse,
  ApiDestination,
  ApiDestinationGroupUpdateDetails,
} from "@root/api/clients/releases/api";
import { observable, action } from "mobx";
import { t } from "@root/lib/i18n";
import { StoresApi } from "@root/api/clients/stores/api";
import { ReleasesQueryOptions } from "./release-store";

export class DistributeReleaseError extends Error {
  constructor(message: string, private readonly failedDestinations: ReleaseDestination[], public readonly internalError: Error) {
    super(message);
    Object.setPrototypeOf(this, DistributeReleaseError.prototype);
  }

  public get destinations(): ReleaseDestination[] {
    return this.failedDestinations;
  }
}

export type DistributeReleaseResourceRequest = ResourceRequest<
  ReleaseDestinationAssociation | undefined,
  ApiReleaseDestinationResponse | ApiReleaseStoreDestinationResponse | undefined
>;

interface DestinationOptions {
  type: ApiDestination.ApiDestinationTypeEnum;
  mandatoryUpdate: boolean;
  notifyTesters: boolean;
  id: string;
}

export class ReleaseDestinationAssociation extends Association {
  @observable
  public id?: string;
  public type?: ApiDestination.ApiDestinationTypeEnum;
  @observable public mandatoryUpdate?: boolean;
  public provisioningStatusUrl?: string;

  @action
  setMetaInfo(destinationResponse: ApiReleaseDestinationResponse & ApiReleaseStoreDestinationResponse, options: ReleasesQueryOptions) {
    if (options.groupName) {
      this.type = "group";
    } else if (options.storeName) {
      this.type = "store";
    } else if (options.testerEmail) {
      this.type = "tester";
    }
    this.id = destinationResponse.id;
    this.mandatoryUpdate = destinationResponse.mandatoryUpdate;
    this.provisioningStatusUrl = destinationResponse.provisioningStatusUrl;
  }
}

/**
 * Association store between destinations and releases
 */
export class ReleaseDestinationAssociationStore extends AssociationStore<
  ReleaseDestinationAssociation,
  ApiReleaseDestinationResponse | ApiReleaseStoreDestinationResponse | undefined
> {
  public LeftClass = DistributionGroup;
  protected AssociationClass = ReleaseDestinationAssociation;

  // destinationName is the distribution group name or the tester email
  protected associateResources(
    destinationName: string,
    releaseId: string,
    options?: DestinationOptions
  ): Promise<ApiReleaseDestinationResponse | ApiReleaseStoreDestinationResponse | undefined> {
    const { app } = appStore;

    const params = {
      releaseId: parseInt(releaseId, 10),
      ownerName: app.owner.name,
      appName: app.name || "",
    };

    const body: any = { id: destinationName };

    if (options && options.type !== "store") {
      body.mandatoryUpdate = options.mandatoryUpdate;
      body.notifyTesters = options.notifyTesters;
    }

    switch (options?.type) {
      case "group":
        body.id = options.id;
        return ReleasesApi.addDistributionGroupReleases(params, body);
      case "tester":
        body.email = destinationName;
        return ReleasesApi.addTestersReleases(params, body);
      case "store":
        return ReleasesApi.addStoreReleases(params, body);
    }

    return Promise.resolve(undefined);
  }

  protected disassociateResources(destinationName: string, releaseId: string, options?: DestinationOptions): Promise<void> {
    const { app } = appStore;
    switch (options?.type) {
      case "group":
        // We are only taking care of the distribution group case. We can also implement the tester case but there's no UI for this.
        const groupParams: ReleasesApi.DeleteWithDistributionGroupIdReleasesParams = {
          ownerName: app.owner.name,
          appName: app.name || "",
          releaseId: parseInt(releaseId, 10),
          distributionGroupName: destinationName,
        };
        return ReleasesApi.deleteWithDistributionGroupIdReleases(groupParams);

      case "store":
        const storeParams: StoresApi.DeleteStoreReleasesParams = {
          ownerName: app.owner.name,
          appName: app.name || "",
          releaseId,
          storeName: destinationName,
        };
        return StoresApi.deleteStoreReleases(storeParams);
      // TODO Once the functionality is available in the UI, we should handle the tester case.
    }
    return Promise.resolve();
  }

  public async putReleaseDetails(
    releaseId: number,
    releaseNotes: string,
    destinations: ReleaseDestination[]
  ): Promise<ApiReleaseUpdateResponse> {
    let putReleaseDetails: ApiReleaseUpdateResponse;
    try {
      putReleaseDetails = await this.updateRelease(releaseNotes, releaseId);
    } catch (error: any) {
      throw new DistributeReleaseError(
        t("distribute:wizardStrings.distributeDestinationError", { count: destinations.length, releaseNumber: releaseId }),
        destinations,
        error
      );
    }
    return putReleaseDetails;
  }

  public distributeRelease(
    releaseId: number,
    mandatoryUpdate: boolean,
    destinations: ReleaseDestination[],
    notifyTesters: boolean
  ): DistributeReleaseResourceRequest[] {
    const destinationRequests: DistributeReleaseResourceRequest[] = [];

    for (const destination of destinations) {
      let postDestinationRequest: DistributeReleaseResourceRequest;

      switch (destination.destinationType) {
        case "group":
          postDestinationRequest = this.associate(destination.name!, releaseId.toString(), true, {
            type: "group",
            mandatoryUpdate,
            notifyTesters,
            id: destination.id,
          });
          break;
        case "tester":
          const testerDestination = destination as ReleaseTesterDestination;
          postDestinationRequest = this.associate(testerDestination.email, releaseId.toString(), true, {
            type: "tester",
            mandatoryUpdate,
            notifyTesters,
          });
          break;
        case "store":
          postDestinationRequest = this.associate(destination.id, releaseId.toString(), true, { type: "store" });
          break;
        default:
          throw new Error("Unsupported destination type");
      }

      destinationRequests.push(postDestinationRequest);
    }

    return destinationRequests;
  }

  private updateRelease(releaseNotes: string, releaseId: number): Promise<ApiReleaseUpdateResponse> {
    const body = { releaseNotes: releaseNotes };
    const params = {
      releaseId: releaseId,
      appName: appStore.name || "",
      ownerName: appStore.ownerName || "",
    };
    return ReleasesApi.updateDetailsReleases(params, body);
  }

  protected patchAssociation(
    association: ReleaseDestinationAssociation,
    changes: Pick<ReleaseDestinationAssociation, "mandatoryUpdate">,
    options?: ReleasesQueryOptions
  ): Promise<any> {
    const { app } = appStore;

    if (association.type === "group") {
      const params: ReleasesApi.PutDistributionGroupReleasesParams = {
        ownerName: app.owner.name,
        appName: app.name || "",
        releaseId: parseInt(association.rightKey, 10),
        groupId: options?.groupId || "",
      };
      const body: ApiDestinationGroupUpdateDetails = {
        mandatoryUpdate: !!changes.mandatoryUpdate,
      };
      return ReleasesApi.putDistributionGroupReleases(params, body);
    }

    return Promise.resolve();
  }
}

export const releaseDestinationAssociationStore = new ReleaseDestinationAssociationStore();
