/**
 * Semi-secure random number generator.
 * Produces decimal values between 0 and 1, like 'Math.random', but uses 'Crypto.getRandomValues' when available.
 */
export const random = (): number => {
  if (!window.crypto) {
    // tslint:disable-next-line:insecure-random
    return Math.random();
  }
  const array = new Uint32Array(1);
  window.crypto.getRandomValues(array);
  return array[0] / (0xffffffff + 1);
};
