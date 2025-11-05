import { Origin } from "@root/data/distribute/constants";
import { GroupType } from "./group-type";
import { IApp } from "@lib/common-interfaces";
import { MicrosoftInternalGroupId } from "../constants";

export interface DistributionGroup {
  id: string;
  name?: string;
  display_name?: string;
  origin?: Origin;
  group_type?: GroupType;
  is_public?: boolean;
  is_shared?: boolean;
}

export function isMicrosoftInternalGroup(group: DistributionGroup) {
  return group.id === MicrosoftInternalGroupId;
}

export function getGroupDisplayName(group: DistributionGroup): string | undefined {
  return group.display_name || group.name;
}

export function getGroupInstallUrl(app?: IApp, group?: DistributionGroup): string {
  const encodedGroupName = encodeURIComponent(group?.name);
  let installSite = location.protocol + "//install." + location.hostname.toLowerCase();
  if (location.port) {
    installSite += ":" + location.port;
  }

  return `${installSite}/${app?.owner?.type}s/${app?.owner?.name}/apps/${app?.name}/distribution_groups/${encodedGroupName}`.toLowerCase();
}
