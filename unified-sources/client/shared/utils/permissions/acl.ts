import { CollaboratorRole, IACL } from "@lib/common-interfaces";
import { locationStore } from "@root/stores/location-store";
import { appStore } from "@root/stores/app-store";
import * as memoize from "memoizee";

import { Permissions as PushPermissions } from "./push";
import { Permissions as DistributePermissions } from "./distribute";
import { Permissions as CrashesPermissions } from "./crashes";
import { Permissions as SettingsPermissions } from "./settings";

/**
 * Access Control List management.
 */
export class ACL implements IACL {
  private mapping: { [key: number]: CollaboratorRole[] };

  constructor(mapping: { [key: number]: CollaboratorRole[] }) {
    this.mapping = mapping;
  }

  public checkPermission(permission: any): boolean {
    return this.checkPermissions([permission]);
  }

  public checkPermissions(permissions: any[]): boolean {
    return (
      permissions.map((permission) => appStore.hasAnyCollaboratorRole(this.mapping ? this.mapping[permission] : [])).indexOf(false) ===
      -1
    );
  }
}

// Permissions per beacon name
const Permissions = {
  push: PushPermissions,
  distribute: DistributePermissions,
  crashes: CrashesPermissions,
  settings: SettingsPermissions,
};

// Expose a 'memoized' function to get an access list control manager for the current beacon.
const memoizedGetAcl = memoize((beaconName: string) => new ACL(Permissions[beaconName]));
export const getAcl = () => memoizedGetAcl(locationStore.beacon || "");
