import { IUser } from "@lib/common-interfaces";
import { DistributionDestinationType, DistributionDestinationToDestinationType } from "@root/distribute/models/destination-type";
import { ApiDestination } from "@root/api/clients/releases/api";
import { DestinationWrapper } from "@root/distribute/models/destination-wrapper";
import { IconName } from "@root/shared";
import { DistributionGroup } from "@root/data/distribute";
import { DistributionGroupWithMembers } from "@root/distribute/models/distribution-group-with-members";
import { NormalizedDistributionGroup } from "@root/distribute/models/normalized-distribution-group";
import { ReleaseDestination, ReleaseTesterDestination } from "@root/data/distribute/models/release-destination";

export class DestinationHelper {
  public static createDestinationFromSource(
    source: IUser | DistributionGroup | DistributionGroupWithMembers,
    type: DistributionDestinationType
  ): DestinationWrapper {
    let destination: IUser | NormalizedDistributionGroup;
    if (type === DistributionDestinationType.Tester || type === DistributionDestinationType.AADGroup) {
      destination = source as IUser;
    } else {
      destination = NormalizedDistributionGroup.construct(source as DistributionGroup | DistributionGroupWithMembers);
    }

    const destinationWrapper: DestinationWrapper = {
      key: `${type}-${destination.id}`,
      type,
      destination,
      totalUsersCount: 0,
    };

    if (type === DistributionDestinationType.Tester) {
      const destinationAsUser = destination as IUser;
      destinationWrapper.email = destinationAsUser.email;
      destinationWrapper.totalUsersCount = 1;
      destinationWrapper.displayText = destinationAsUser.display_name;
    }

    if (type === DistributionDestinationType.DistributionGroup) {
      const destinationAsGroup = destination as NormalizedDistributionGroup;
      destinationWrapper.icon = IconName.GroupCircle;
      destinationWrapper.totalUsersCount = destinationAsGroup.totalUsersCount;
      destinationWrapper.displayText = destinationAsGroup.displayName;
      destinationWrapper.ownerName = destinationAsGroup.ownerName;
      destinationWrapper.totalGroupsCount = destinationAsGroup.totalGroupsCount;
    }

    if (type === DistributionDestinationType.AADGroup) {
      destinationWrapper.icon = IconName.AadGroup;
      destinationWrapper.totalUsersCount = 1;
    }

    return destinationWrapper;
  }

  public static createReleaseDestination(wrapper: DestinationWrapper): ReleaseDestination {
    const destinationType: ApiDestination.ApiDestinationTypeEnum = DistributionDestinationToDestinationType[wrapper.type];

    if (!destinationType) {
      throw new Error("Cannot distribute directly to a destination that is not group or tester");
    }

    const destination: ReleaseDestination = {
      id: wrapper.destination.id!,
      name: wrapper.destination.name,
      destinationType: destinationType,
      displayName: wrapper.displayText,
    };

    if (destinationType === "tester") {
      const testerDestination = destination as ReleaseTesterDestination;
      testerDestination.email = wrapper.email!;
      return testerDestination;
    }

    return destination;
  }
}
