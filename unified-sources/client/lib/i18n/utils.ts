import i18next from "i18next";

/**
 * Gets the currently set language in the portal
 */
export function getCurrentLanguage(): string {
  const untyped = i18next as any;
  return untyped && untyped.default && untyped.default.languages && untyped.default.languages.length > 0
    ? untyped.default.languages[0]
    : "en-US";
}
