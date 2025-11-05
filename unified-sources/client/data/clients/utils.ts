import { IApp } from "@lib/common-interfaces";

export interface IClientApp {
  app_name?: string;
  app_id?: string;
  owner_name?: string;
  os?: string;
}

export function makeClientApp(app: IApp): IClientApp {
  return {
    app_name: app.name,
    app_id: app.id,
    owner_name: app.owner?.name,
    os: app.os,
  };
}
