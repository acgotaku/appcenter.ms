export function supportsAutoTheme(): boolean {
  return window.matchMedia("(prefers-color-scheme)").matches && !navigator.appVersion.includes("Edge/");
}
