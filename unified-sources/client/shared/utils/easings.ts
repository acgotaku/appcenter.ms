export type EasingFunc = (i: number, start: number, end: number, nSteps: number) => number;

export enum Easing {
  OutCubic,
}

export const easeOutCubic: EasingFunc = (i, start, end, nSteps) => {
  return (end - start) * (Math.pow(i / nSteps - 1, 3) + 1) + start;
};

export const easings: { [key: number]: EasingFunc } = {
  [Easing.OutCubic]: easeOutCubic,
};
