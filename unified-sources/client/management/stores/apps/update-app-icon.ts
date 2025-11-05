import { App } from "@root/data/shell/models/app";
import { FormDataResourceRequest } from "@root/data/lib";
import { action } from "mobx";

export function updateAppIcon(app: App, file: File): FormDataResourceRequest<App, Pick<App, "icon_url">> {
  const formData = new FormData();
  formData.append("avatar", file, file.name);

  return new FormDataResourceRequest(
    `/v0.1/apps/${app.owner.name}/${app.name}/avatar`,
    formData,
    () => app,
    (error, response) => {
      if (!error && response.icon_url) {
        // Preload image before clearing old one to avoid flash
        const image = document.createElement("img");
        image.onload = image.onerror = action(() => {
          app.icon_url = response.icon_url;
          app.icon_source = "uploaded";
        });
        image.src = response.icon_url;
      }
    }
  );
}
