declare const window: any;

import * as Sentry from "@sentry/react";
import { scrubPath } from "./telemetry";

const config = window && window.initProps && window.initProps.config ? window.initProps.config : {};

export function startSentry() {
  Sentry.init({
    dsn: "https://3ffeb3ea8fcf4d35af413cad17c4e9db@o205451.ingest.sentry.io/5314820",
    allowUrls: ["assets.appcenter.ms", "assets.dev-pme.avalanch.es"],
    ignoreErrors: [
      // Random plugins/extensions
      "top.GLOBALS",
    ],
    denyUrls: [
      // Chrome extensions
      /extensions\//i,
      /^chrome:\/\//i,
    ],
    release: config.commit,
    environment: config.env,
    maxBreadcrumbs: 100,
    beforeBreadcrumb(breadcrumb, hint) {
      if (breadcrumb.data && breadcrumb.data["url"]) {
        breadcrumb.data.url = scrubPath(breadcrumb.data.url);
      }
      // Only send breadcrumbs that are requests
      if (breadcrumb.type === "http") {
        return breadcrumb;
      }
      return null;
    },
    beforeSend(event) {
      if (!hasStacktrace(event)) {
        return null;
      }
      if (event.request?.url) {
        event.request.url = scrubPath(event.request.url);
      }
      return event;
    },
  });

  Sentry.configureScope(function (scope) {
    if (window.initProps.user) {
      scope.setUser({ id: window.initProps.user.id });
    }
  });
}

/**
 * Does the event have any errors with a stacktrace?
 *
 * Browsers discard stacktrace i.e. when under memory pressure.
 * @param event Sentry Event
 * @returns True if the event has an error with a stacktrace with at least two frames with a line number
 */
export function hasStacktrace(event: Partial<Sentry.Event>): boolean {
  if (!event.exception) {
    return false;
  }
  return (
    !!event.exception.values &&
    event.exception.values.filter(
      (valueException) =>
        !!valueException.stacktrace &&
        !!valueException.stacktrace.frames &&
        valueException.stacktrace.frames.filter((frame) => !!frame.lineno).length > 1
    ).length > 0
  );
}

window.raiseFakeSentryException = () => {
  Sentry.captureException(new Error("This appears in Sentry"));
};
