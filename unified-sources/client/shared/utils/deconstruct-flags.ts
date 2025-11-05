/**
 * Deconstructs a number into its powers of 2.
 * Useful with bitmask flag enums.
 */
function _deconstructFlags(flags: number, cursor = 1): number[] {
  const flag = cursor & flags ? [cursor] : [];
  const nextCursor = cursor << 1;
  return nextCursor > flags ? flag : flag.concat(_deconstructFlags(flags, nextCursor));
}

const deconstructFlags = _deconstructFlags as (flags: number) => number[];
export default deconstructFlags;
