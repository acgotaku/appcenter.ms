import { PLATFORMS, PLATFORM, IPlatform } from "@lib/common-interfaces";

export function getAvailablePlatforms(os: string) {
  const platforms = Object.entries(PLATFORMS).reduce(
    (acc, [_, value]) => (value.supportedOSs.includes(os) ? [...acc, value] : acc),
    [] as IPlatform[]
  );

  const canCreateElectronApps = false;

  return platforms.filter((platform) => {
    return (
      (platform.value !== PLATFORM.CORDOVA && platform.value !== PLATFORM.UNITY && platform.value !== PLATFORM.ELECTRON) ||
      platform.value === PLATFORM.UNITY ||
      (platform.value === PLATFORM.ELECTRON && canCreateElectronApps)
    );
  });
}

export function isPlatformInPreview(platform: string) {
  return platform === PLATFORM.CORDOVA;
}
