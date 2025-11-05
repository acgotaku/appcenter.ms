/**
 * Our implementation of Optimizely does not support app feature flags at the moment.
 * This class is intended to support a few legacy feature flags added to apps while
 * the legacy feature flags system is fully removed from the code base.
 * Ideally, the feature flags in this file should be considered a workaround and should
 * be removed at the first opportunity.
 * */

export class AppFeaturesStore {
  /**
   * legacy feature flag `build_extended_branch_search_depth`
   * created at 2019-10-23T16:58:17.000Z
   * @param appId The id of the application
   */
  public isBuildExtendedBranchSearchDepthActive(appId: string | undefined): boolean {
    const buildExtendedBranchSearchDepthIds = (window as any).initProps?.enabledBuildExtendedBranchSearchDepth;
    if (!appId || !buildExtendedBranchSearchDepthIds) {
      return false;
    }
    return buildExtendedBranchSearchDepthIds.includes(appId);
  }

  /**
   * legacy feature flag `build_secure_files`
   * created at 2017-09-29T08:04:55.000Z
   * @param appId The id of the application
   */
  public isBuildSecureFilesActive(appId: string | undefined): boolean {
    const buildSecureFilesIds = (window as any).initProps?.enabledBuildSecureFiles;
    if (!appId || !buildSecureFilesIds) {
      return false;
    }
    return buildSecureFilesIds.includes(appId);
  }
}

/**
 * @deprecated Consider using `optimizelyStore` instead
 */
export const appFeaturesStore = new AppFeaturesStore();
