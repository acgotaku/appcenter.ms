export const BuildStatus = {
  Queued: "notStarted",
  InProgress: "inProgress",
  Completed: "completed",
  Cancelling: "cancelling",
  Postponed: "postponed",
  // there's also "all", who knows what that means
};

export const BuildResult = {
  Succeeded: "succeeded",
  PartiallySucceeded: "partiallySucceeded",
  Failed: "failed",
  Canceled: "canceled",
};

const VERSION = "/v0.1";

export const PLACEHOLDER_PROTECTED = "__protected__";

export const API = {
  VSTS_SOURCE_ACCOUNTS: `${VERSION}/apps/:owner_name/:app_name/source_hosts/vsts/accounts`,
  SOURCE_REPOSITORIES: `${VERSION}/apps/:owner_name/:app_name/source_hosts/vsts/repositories`,
  REPOSITORY_CONFIGURATION: `${VERSION}/apps/:owner_name/:app_name/repo_config`,
};

export const GITHUB_PR_HEAD_BRANCH = "sourceBranch";
export const GITHUB_PR_SHA = "sourceVersion";
export const APP_IDS = "appIds";

// macOS optional provisioning profile
export const EMPTY_PROVISIONING_PROFILE = "none";

export const EXTENDED_REPO_SEARCH_DEPTH = 8;
