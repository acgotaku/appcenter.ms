import { IOrganization } from "@lib/common-interfaces";
import { FormDataResourceRequest } from "@root/data/lib";
import { action } from "mobx";

export function updateOrgIcon(
  organization: IOrganization,
  file: File
): FormDataResourceRequest<IOrganization, Pick<IOrganization, "avatar_url">> {
  const formData = new FormData();
  formData.append("avatar", file, file.name);

  return new FormDataResourceRequest(
    `/v0.1/orgs/${organization.name}/avatar`,
    formData,
    () => organization,
    (error, response) => {
      if (!error && response.avatar_url) {
        // Preload image before clearing old one to avoid flash
        const image = document.createElement("img");
        image.onload = image.onerror = action(() => (organization.avatar_url = response.avatar_url));
        image.src = response.avatar_url;
      }
    }
  );
}
