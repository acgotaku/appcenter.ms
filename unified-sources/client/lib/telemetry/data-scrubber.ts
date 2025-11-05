const params = {
  apps: "app_name",
  azure_subscriptions: "azure_subscription_id",
  branches: "branch",
  builds: "build_id",
  "code-push": "deployment",
  collaborators: "user_id",
  "crashes/groups": "crash_group_id",
  crashes: "crash_id",
  "distribution-groups": "group_name",
  events: "event_name",
  orgs: "owner_name",
  releases: "release_id",
  teams: "team_name",
  "test/runs": "test_run_id",
  users: "owner_name",
  distribution_groups: "group_name",
};

const regExp = new RegExp(
  "/(" + Object.keys(params).join("|") + ")/(?!(create|new|new-group|new-release|groups|{owner_name})(/|$))[^/]+",
  "ig"
);

const replacer = (match, p1: string) => {
  const lowerGroup = p1.toLowerCase();
  return `/${lowerGroup}/{${params[lowerGroup]}}`;
};

export function scrubPath(path: string): string {
  if (!path) {
    return path;
  }

  // Trim query params
  const indexOfQuery = path.indexOf("?");
  if (indexOfQuery > -1) {
    path = path.substr(0, indexOfQuery);
  }

  path = path.replace(/\/api\/(v[0-9.]+)\/apps\/([^/]+)\/([^/]+)\//i, (match, p1: string) => {
    return `/api/${p1}/apps/{owner_name}/{app_name}/`;
  });
  path = path.replace(regExp, replacer);

  return path;
}
