import { IOrganization } from "@lib/common-interfaces";
import { ResourceRequest } from "@root/data/lib";
import { apiGateway } from "@root/lib/http";

export function deleteOrgIcon(organization: IOrganization): ResourceRequest<IOrganization, void> {
  const originalUrl = organization.avatar_url;
  organization.avatar_url = undefined;
  return new ResourceRequest(
    apiGateway.delete(`/v0.1/orgs/${organization.name}/avatar`),
    () => organization,
    (error) => {
      if (error) {
        organization.avatar_url = originalUrl;
      }
    }
  );
}
