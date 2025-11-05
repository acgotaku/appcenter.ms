import { noop } from "lodash";
import { Easing, EasingFunc, easings } from "./easings";

type AnimationOptions = {
  startValue: number;
  endValue: number;
  duration: number;
  easing: Easing | EasingFunc;
  onFirstRun?: () => void;
  onScheduleFrame?: (frameId: number) => void;
  executeStep: (currentValue: number) => void;
  done?: () => void;
};

export const animate = ({
  startValue,
  endValue,
  duration,
  easing,
  executeStep,
  onFirstRun = noop,
  onScheduleFrame = noop,
  done = noop,
}: AnimationOptions) => {
  let i = 0;
  const steps = Math.round((duration / 1000) * 60); // 60 fps
  const ease = typeof easing === "function" ? easing : easings[easing];
  const step = () => {
    if (i === 0) {
      onFirstRun();
    }

    executeStep(ease(i++, startValue, endValue, steps));
    if (i < steps) {
      onScheduleFrame(requestAnimationFrame(step));
    } else {
      done();
    }
  };

  onScheduleFrame(requestAnimationFrame(step));
  return step;
};

// Seems convenient
export { Easing };
