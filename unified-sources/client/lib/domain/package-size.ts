const filesize = require("filesize");

/**
 * Check if package size is bigger than max 32bit integer
 *
 * @param packageSize {number} - the size of the package being checked in bytes
 *
 * @returns {string} - actual package size
 */
export function humanizePackageSize(packageSize: number | string): string {
  const MAX_32BIT_INT = Math.pow(2, 31) - 1;
  const sizeOverflow: string = +packageSize >= MAX_32BIT_INT ? "> " : "";
  return sizeOverflow + filesize(packageSize);
}
