import * as bigInt from "big-integer";

export function binaryFill(from: number, to: number, number: number | bigInt.BigInteger = 0) {
  return bigInt(number as any).or(
    bigInt(2)
      .pow(to + 1)
      .minus(bigInt(2).pow(from))
  ); // as any: overload resolution issue
}

export function binarySplit(number: number | bigInt.BigInteger) {
  const input = typeof number === "number" ? bigInt(number) : number;
  if (input.lesser(0)) {
    throw new Error("Argument to `binarySplit` must be greater than or equal to 0");
  }

  let n = input;
  let i = 0;
  const ranges: number[][] = [];
  let range: number[] = [];
  while (n.neq(0)) {
    if (n.and(1) && !range.length) {
      range.push(i);
    } else if (n.and(1)) {
      range[1] = i;
    } else {
      if (range.length === 1) {
        range[1] = range[0];
      }
      if (range.length) {
        ranges.push(range);
        range = [];
      }
    }

    i++;
    n = n.shiftRight(1);
  }

  if (input.neq(0)) {
    if (range.length === 1) {
      range[1] = range[0];
    }
    if (range.length) {
      ranges.push(range);
      range = [];
    }
  }

  return ranges;
}
