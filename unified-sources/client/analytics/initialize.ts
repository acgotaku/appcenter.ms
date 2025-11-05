// Keep this code small, clean, and efficient, as it
// impacts initial load and parse time. You may access
// utilities from `client/lib`, but avoid using
// third-party dependencies that aren’t already loaded
// with the shell.

// To run initialization code at the beginning of a
// user session, simply add code here in the module space:
//
// console.log('Session started');

// To run initialization code at the beginning of each
// app session, use `appStore.onStartAppSession`

import { appStore } from "@root/stores";
import { apiGateway } from "@root/lib/http";
import { RESPONSE_TYPES } from "@lib/common-interfaces";
import { noop } from "lodash";

const unsubscribe = appStore.onStartAppSession((app) => {
  apiGateway
    .post(`v0.1/apps/:owner_name/:app_name/analytics/prepare_overview`, {
      params: {
        owner_name: app.owner.name,
        app_name: app.name,
      },
      responseType: RESPONSE_TYPES.TEXT,
    })
    .catch(noop);
  apiGateway
    .post(`v0.1/apps/:owner_name/:app_name/errors/prepare_overview`, {
      params: {
        owner_name: app.owner.name,
        app_name: app.name,
      },
      responseType: RESPONSE_TYPES.TEXT,
    })
    .catch(noop);
  unsubscribe(app);
});
