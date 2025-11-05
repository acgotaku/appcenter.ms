export enum DistributionDestinationType {
  DistributionGroup = "distribution_group",
  Tester = "tester",
  AADGroup = "aad_group",
}

export const DistributionDestinationToDestinationType = {
  [DistributionDestinationType.DistributionGroup]: "group",
  [DistributionDestinationType.Tester]: "tester",
};
