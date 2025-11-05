declare const window: any;
declare const require: any;

import "babel-polyfill";
// use Bluebird, not any other promise library
window.Promise = require("bluebird");

const environments = require("../environments");

import { configure, runInAction } from "mobx";
import { telemetry, logger } from "./lib/telemetry";
import { config } from "./lib/utils/config";
import { FetchError } from "./lib/http/fetch-error";
import * as smoothscroll from "smoothscroll-polyfill";
import { templateSettings } from "lodash";
import { startSentry } from "./lib/sentry";

import "inert-polyfill";
import "url-polyfill";
import "raf";

smoothscroll.polyfill();
const ENV = config.getEnv();

// Expose this to TestCafe if it needs to screw around with observables (currently does for forcing feature flags)
window.__runInAction__ = runInAction;

// Track unhandled promise rejections in Application Insights
Promise.onPossiblyUnhandledRejection((reason) => {
  logger.error("onPossiblyUnhandledRejection", reason instanceof FetchError ? reason.toJs : reason);
});

/**
 * Promise configuration. Enable cancellation. This will allow us to call `cancel()`
 * on any promise.
 */
Promise.config({
  cancellation: true,
});

/**
 * Switching on `strict` mode for MobX. This will force us to use the
 * `@action` decorator to explicitly mark functions which change application state.
 */
if (ENV !== environments.PROD) {
  configure({ enforceActions: "observed" });
}

// App Insights cookies are categorized as essential. We can use them without consent.
telemetry.init();

// Change lodash's template delimiters to {{ and }}
templateSettings.interpolate = /{{([\s\S]+?)}}/g;

startSentry();
