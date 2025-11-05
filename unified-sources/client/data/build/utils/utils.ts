export class BuildUtils {
  public static getBranchNameType(branchName: string): string {
    const branchNameConstants = ["master", "feature", "rel", "release", "dev", "beta", "alpha", "rc"];
    let branchNameMatch = "none";
    branchNameConstants.forEach(function (element) {
      if (branchName.toLowerCase().indexOf(element) !== -1) {
        branchNameMatch = element;
      }
    });
    return branchNameMatch;
  }
}
