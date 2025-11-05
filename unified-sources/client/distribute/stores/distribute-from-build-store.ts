import { IApp } from "@lib/common-interfaces";
import { Urls } from "../utils/constants";
import { apiGateway } from "@root/lib/http";
import { ReleaseDestination, ReleaseTesterDestination } from "@root/data/distribute/models/release-destination";

export class DistributeFromBuildStore {
  private appName: string;
  private ownerName: string;

  constructor(app: IApp) {
    this.appName = app.name!;
    this.ownerName = app.owner!.name;
  }

  public distribute(
    buildId: number,
    releaseNotes: string,
    releaseDestinations: ReleaseDestination[],
    mandatoryUpdate: boolean,
    notifyTesters: boolean
  ): Promise<any> {
    const transformedDestinations = this.buildTypedDestinations(releaseDestinations);

    const options = {
      body: {
        destinations: transformedDestinations,
        releaseNotes: releaseNotes || "",
        mandatoryUpdate: mandatoryUpdate,
        notifyTesters: notifyTesters,
      },
      params: {
        app_name: this.appName,
        owner_name: this.ownerName,
        build_id: String(buildId),
      },
    };

    return apiGateway.post<any>(Urls.PostDistributeFromBuildPath, options);
  }

  private buildTypedDestinations(destinations: ReleaseDestination[]) {
    return destinations.map((destination) => {
      return {
        id: this.getIdForDestination(destination),
        type: destination.destinationType,
      };
    });
  }

  private getIdForDestination(destination: ReleaseDestination): string {
    if (destination.destinationType === "tester") {
      return (destination as ReleaseTesterDestination).email;
    }

    return destination.id;
  }
}
