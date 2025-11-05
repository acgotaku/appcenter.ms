import { Model } from "../../lib/model";
import { computed, observable } from "mobx";
import { IApp, IOrganization, IUser } from "@lib/common-interfaces";

export interface SerializedInvitation {
  invitation_id: string;
  invited_by: IUser;
  app?: IApp;
  organization?: IOrganization;
}

export interface DeserializedInvitation {
  invitationId?: string;
  invitedBy?: IUser;
  app?: IApp;
  organization?: IOrganization;
}

export class Invitation extends Model<DeserializedInvitation> implements DeserializedInvitation {
  @observable public invitationId?: string;
  @observable public invitedBy?: IUser;
  @observable public app?: IApp;
  @observable public organization?: IOrganization;

  get id(): string | undefined {
    return this.invitationId;
  }

  @computed
  get isOrganizationInvite(): boolean {
    return !!this.organization;
  }
}
