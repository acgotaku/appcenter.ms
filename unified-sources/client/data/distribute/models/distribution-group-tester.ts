import { Model } from "@root/data/lib/model";
import { observable } from "mobx";
import { distributionGroupTesterAssociationStore } from "@root/data/distribute/stores/distribution-group-tester-association-store";

export interface SerializedDistributionGroupTester {
  display_name: string;
  name: string;
  email: string;
  invite_pending: boolean;
  user_email?: string;
}

export interface DeserializedDistributionGroupTester {
  displayName?: string;
  name?: string;
  email?: string;
  // foreign key
  organizationName?: string;
}

export class DistributionGroupTester
  extends Model<DeserializedDistributionGroupTester>
  implements DeserializedDistributionGroupTester {
  /** init in parent */
  @observable public displayName?: string;
  @observable public name?: string;
  @observable public email?: string;
  @observable public organizationName?: string;

  public invitePending(groupName: string): boolean {
    const association = distributionGroupTesterAssociationStore.getAssociation(this.email || "", this.organizationName, groupName);
    return association ? !!association.invitePending : false;
  }
}
