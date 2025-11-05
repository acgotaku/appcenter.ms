export function isSemVerFormat(shortVersion: string): boolean {
  const semver = /^v?(?:0|[1-9]\d*)(\.(?:[x*]|0|[1-9]\d*)(\.(?:[x*]|0|[1-9]\d*)(?:-[\da-z\-]+(?:\.[\da-z\-]+)*)?(?:\+[\da-z\-]+(?:\.[\da-z\-]+)*)?)?)?$/i;
  if (typeof shortVersion === "string" && semver.test(shortVersion)) {
    return true;
  }
  return false;
}
