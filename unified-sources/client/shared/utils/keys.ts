/**
 * Numerical codes identifying the unmodified value of pressed keys
 */
export const Keys = {
  Backspace: 8,
  Tab: 9,
  Space: 32,
  Enter: 13,
  Down: 40,
  Up: 38,
  Left: 37,
  Right: 39,
  End: 35,
  Home: 36,
  Escape: 27,
  A: 65,
  Z: 90,
  Zero: 48,
  Nine: 57,
  J: 74,
  K: 75,
  H: 72,
  L: 76,
  Delete: 46,
  Shift: 16,
};

/**
 * Returns true if key character code represents a lowercase letter, uppercase letter or number.
 */
export function isAlphanumeric(key: number): boolean {
  return (Keys.Zero <= key && key <= Keys.Nine) || (Keys.A <= key && key <= Keys.Z);
}
