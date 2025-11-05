import { random } from "../utils/random";

export class Utils {
  private static InstallSubdomain: string = "install";
  private static InstallSubdomainPrefix: string = `${Utils.InstallSubdomain}.`;

  /**
   * Checks if the browser is IE.
   */
  public static isIe(): boolean {
    return ((((window as any).navigator || {}).appVersion || "").match(/Trident/) || []).length !== 0;
  }

  /**
   * Checks if the domain is the install subdomain
   */
  public static isInstallSubdomain(): boolean {
    const initProps = (window as any).initProps;
    if (
      location.hostname &&
      (location.hostname.indexOf(Utils.InstallSubdomainPrefix) === 0 ||
        (initProps && initProps.forceSubdomain === Utils.InstallSubdomain))
    ) {
      return true;
    }

    return false;
  }

  /**
   * Get a random cache buster value.
   */
  public static randomCacheBusterValue(): string {
    return (new Date().valueOf() + random() * 100).toString(36);
  }
}
