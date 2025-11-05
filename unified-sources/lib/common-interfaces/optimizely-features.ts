/**
 * Enum type for Optimizely Feature names in App Center.
 * This will enable us to freely use feature names without the fear of typos.
 * Key = name you like, we recommend using the same as the value
 * Value = the value as found on Optimizely.com
 */
export enum OptimizelyFeatureNames {
  // Shell
  portal_show_nps_survey = "portal_show_nps_survey",
  portal_revoke_aad_auth = "portal_revoke_aad_auth",
  portal_revoke_github_auth = "portal_revoke_github_auth",
  portal_revoke_google_auth = "portal_revoke_google_auth",
  portal_revoke_facebook_auth = "portal_revoke_facebook_auth",
  // Distribute
  distribute_external_builds = "distribute_external_builds",
  // Build
  build_secure_files = "build_secure_files",
  build_secure_files_xamarin = "build_secure_files_xamarin",
  // Diagnostics
  diagnostics_more_details_on_report_page = "diagnostics_more_details_on_report_page",
  diagnostics_persistent_filters = "diagnostics_persistent_filters"
}

export const enum OptimizelyExperimentNames {
  "" = "", // required to type as string enum, remove when adding entries
}

export const enum OptimizelyEventNames {
  "" = "", // required to type as string enum, remove when adding entries
}

export interface OptimizelyCustomAttributes {
  internalUser: boolean;
  environment?: string;
  origin: string;
}
