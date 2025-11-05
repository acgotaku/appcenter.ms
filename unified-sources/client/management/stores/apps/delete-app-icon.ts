import { App } from "@root/data/shell/models/app";
import { ResourceRequest } from "@root/data/lib";
import { apiGateway } from "@root/lib/http";

interface DeleteAppIconResponse {
  icon_url: string;
  icon_source: string;
}

export function deleteAppIcon(app: App): ResourceRequest<App, DeleteAppIconResponse> {
  const originalUrl = app.icon_url;
  const originalSource = app.icon_source;
  app.icon_url = undefined;
  app.icon_source = undefined;
  return new ResourceRequest(
    apiGateway.delete<DeleteAppIconResponse>(`/v0.1/apps/${app.owner.name}/${app.name}/avatar`),
    () => app,
    (error, responce) => {
      if (error) {
        app.icon_url = originalUrl;
        app.icon_source = originalSource;
      } else if (responce) {
        app.icon_url = responce.icon_url;
        app.icon_source = responce.icon_source;
      }
    }
  );
}
