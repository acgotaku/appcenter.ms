import { Model } from "../../lib";
import { observable } from "mobx";

export interface IDistributionGroupUser {
  email?: string;
  id?: string;
  display_name?: string;
  name?: string;
  avatar_url?: string;
  invite_pending?: boolean;
  aad_group_id?: string;
  tenant_id?: string;
  distribution_group_name?: string;
}

export class DistributionGroupUser extends Model<IDistributionGroupUser> implements IDistributionGroupUser {
  @observable public email?: string;
  @observable public id?: string;
  @observable public display_name?: string;
  @observable public name?: string;
  @observable public avatar_url?: string;
  @observable public invite_pending?: boolean;
  @observable public aad_group_id?: string;
  @observable public distribution_group_name?: string;
  @observable public tenant_id?: string;
}
