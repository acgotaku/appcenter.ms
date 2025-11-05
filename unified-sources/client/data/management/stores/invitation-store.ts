import { apiGateway } from "@root/lib/http";
import { RESPONSE_TYPES } from "@lib/common-interfaces";
import { Store } from "../../lib";
import { Invitation, DeserializedInvitation, SerializedInvitation } from "../models/invitation";
import { API } from "../constants";

type ForeignKey = keyof DeserializedInvitation;

export class InvitationStore extends Store<DeserializedInvitation, SerializedInvitation, Invitation> {
  protected ModelClass = Invitation;

  protected generateIdFromResponse(resource: SerializedInvitation, query?: any) {
    return resource.invitation_id;
  }

  protected getModelId(model: Invitation): string | undefined {
    return model.id;
  }

  protected getCollection(
    query?: any,
    foreignKey?: ForeignKey,
    foreignKeyValue?: DeserializedInvitation[ForeignKey]
  ): Promise<SerializedInvitation[]> {
    return apiGateway.get<SerializedInvitation[]>(API.USER_INVITATIONS);
  }

  protected postResource(resource: Invitation, options?: any): Promise<void | SerializedInvitation> {
    return apiGateway.post<void>(API.USER_INVITATION_ACCEPT, {
      params: {
        invitation_id: resource.id,
      },
      responseType: RESPONSE_TYPES.TEXT,
    });
  }

  protected deleteResource(resource: Invitation, options?: any): Promise<any> {
    return apiGateway.post<void>(API.USER_INVITATION_REJECT, {
      params: {
        invitation_id: resource.id,
      },
      responseType: RESPONSE_TYPES.TEXT,
    });
  }

  protected deserialize(
    serialized: SerializedInvitation,
    queryOrOptions?: any,
    foreignKey?: ForeignKey,
    foreignKeyValue?: DeserializedInvitation[ForeignKey]
  ): DeserializedInvitation {
    return {
      app: serialized.app,
      organization: serialized.organization,
      invitationId: serialized.invitation_id,
      invitedBy: serialized.invited_by,
    };
  }
}

export const invitationStore = new InvitationStore();
