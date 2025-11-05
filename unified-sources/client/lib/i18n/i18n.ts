/**
 * Originally from:
 * https://github.com/i18next/react-i18next/blob/a3ca87c32b6fb1f6a6dd5343396eef3c3410a1db/example/app/i18n.js
 * See License in this folder.
 */

import * as i18next from "i18next";
import { webpackBackend } from "./webpack-backend";
import { LocalStorageDetector } from "./local-storage-language-detector";
import { FormatNumbersAndDates } from "./i18next-formatter";

const detector = new LocalStorageDetector();

// :( I have no idea what the deal is, but esModuleInterop will fix it
let i18nTestHackSadFace: typeof import("i18next").default = i18next.default;
if (process.env.NODE_ENV === "test") {
  i18nTestHackSadFace = require("i18next");
}

i18nTestHackSadFace
  .use(webpackBackend)
  .use(detector)
  .init({
    fallbackLng: "en-US",

    // have a common namespace used around the full app
    ns: ["common"],
    defaultNS: "common",

    // Don't try to load fallbacks codes for languages (i.e. don't try to load en for en-US)
    load: "currentOnly",

    // Set to `true` to enable logging
    debug: false,

    // Globally configure wait for react-i18next
    react: {
      useSuspense: true,
    },

    interpolation: {
      escapeValue: false, // not needed for react!!,
      format: FormatNumbersAndDates,
    },
  });

export default i18nTestHackSadFace;
export const t: i18next.TFunction = i18nTestHackSadFace.t.bind(i18nTestHackSadFace);
