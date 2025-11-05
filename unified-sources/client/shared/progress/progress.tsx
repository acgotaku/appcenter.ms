import * as React from "react";
import * as classNames from "classnames";
import { remove } from "lodash";
import { Color } from "../utils/color";
import { random } from "../../lib/utils/random";
const css = require("./progress.scss");

export interface ProgressProps {
  color?: Color.Blue | Color.LightGray | null;
  loading: boolean;
  direction?: ProgressDirection | null;
}

export interface ProgressState {
  progress: number;
}

export enum ProgressDirection {
  Above = "Above",
  Below = "Below",
}

const randomize = (amount: number) => (n: number) => n * (random() * amount * 2 + (1 - amount));
const randomize25 = randomize(0.25);
const randomize75 = randomize(0.75);
const transitionDuration = 350;
const resetDelay = 100;
const incrementDelay = () => randomize75(150);
const asymptoticApproach = (x: number) => 1 - 1 / Math.sqrt(x + 1);

type Update = { fn: Function; timer: NodeJS.Timer; required: boolean };

export class Progress extends React.PureComponent<ProgressProps, ProgressState> {
  private pendingUpdates: Update[] = [];
  private doneOnce = false;
  public state = { progress: 0 };

  private scheduleUpdate(updateFn: () => void, delay: number, required: boolean) {
    const timer = setTimeout(() => {
      updateFn();
      remove(this.pendingUpdates, (update) => update.timer === timer);
    }, delay);

    this.pendingUpdates.push({ fn: updateFn, timer, required });
  }

  private flushUpdates() {
    this.pendingUpdates.forEach((update) => {
      clearTimeout(update.timer);
      if (update.required) {
        update.fn();
      }
    });
    this.pendingUpdates = [];
  }

  private cancelUpdates() {
    this.pendingUpdates.forEach((update) => {
      clearTimeout(update.timer);
    });
    this.pendingUpdates = [];
  }

  public componentDidMount() {
    if (this.shouldRun()) {
      this.scheduleUpdate(this.increment, 0, false);
    }
  }

  public UNSAFE_componentWillReceiveProps(nextProps: ProgressProps) {
    const isRunning = this.shouldRun();
    const shouldRun = this.shouldRun(nextProps);
    if (shouldRun && !isRunning && !this.state.progress) {
      this.increment();
    } else if (!shouldRun && isRunning) {
      this.done();
    }
  }

  public componentDidUpdate(_, prevState: ProgressState) {
    if (prevState.progress < Infinity && this.state.progress === Infinity) {
      this.flushUpdates();
      this.scheduleUpdate(this.reset, transitionDuration + resetDelay, true);
    } else if (this.shouldRun()) {
      this.flushUpdates();
      this.scheduleUpdate(this.increment, transitionDuration + incrementDelay(), false);
    }
  }

  public componentWillUnmount() {
    this.cancelUpdates();
  }

  private done = () => {
    this.doneOnce = true;
    this.setState({ progress: Infinity });
  };
  private reset = () => {
    this.setState({ progress: 0 });
  };
  private increment = () => {
    this.setState({ progress: this.state.progress + randomize25(1) });
  };

  private shouldRun(props: ProgressProps = this.props) {
    return props.loading;
  }

  private get transitionDuration() {
    return this.state.progress ? transitionDuration : 0;
  }

  public render() {
    const barClassName = classNames(css.bar, this.props.color === Color.Blue ? css.barBlue : css.barLightGray);
    const containerClassName = classNames(css.container, this.props.direction === ProgressDirection.Below ? css.below : null);
    const state = this.state.progress < Infinity && this.doneOnce ? "done" : "loading";

    return (
      <span className={containerClassName} data-test-id="page-progress" data-test-state={state}>
        <span
          className={barClassName}
          style={{
            transitionDuration: `${this.transitionDuration}ms, ${transitionDuration}ms, ${transitionDuration}ms`,
            transform: `scaleX(${asymptoticApproach(this.state.progress)})`,
            opacity: this.state.progress < Infinity ? 1 : 0,
          }}
        />
      </span>
    );
  }
}
