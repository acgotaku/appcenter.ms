import * as React from "react";
import { ProgressBarStatus } from "@root/lib/drag-drop-upload";
const classNames = require("classnames");
const css = require("./progress-bar.scss");

export interface ProgressBarProps extends React.HTMLAttributes<HTMLElement> {
  progress: number;
  max?: number;
  status?: ProgressBarStatus;
}

export class ProgressBar extends React.Component<ProgressBarProps, {}> {
  public static defaultProps = {
    max: 100,
    status: ProgressBarStatus.Default,
  };

  public render() {
    const { progress, max, status = ProgressBarStatus.Default } = this.props;

    const progressBarClassName = classNames(css["progress-bar"], this.props.className);
    const fillClassName = classNames(
      css[`${(ProgressBarStatus[status] || "Default").toLowerCase()}-fill`],
      status === ProgressBarStatus.Default && progress > 0 && progress < 100 ? css["filling"] : ""
    );
    const percentage = (progress / max!) * 100;
    const fillStyle = { width: `${status === ProgressBarStatus.Default ? percentage : 100}%` };

    const showToScreenReader = percentage > 0 || status !== ProgressBarStatus.Default;

    return (
      <div className={css["progress-container"]}>
        <div
          className={progressBarClassName}
          role="progressbar"
          aria-label="progress"
          aria-valuemin={0}
          aria-valuemax={max}
          aria-valuenow={percentage}
          aria-hidden={!showToScreenReader}
        >
          <div className={fillClassName} style={fillStyle} />
        </div>
        {status === ProgressBarStatus.Default && percentage > 0 ? (
          <div className={css["progress-percent"]} aria-live="polite">{`${Math.round(percentage / 10) * 10}%`}</div>
        ) : null}
      </div>
    );
  }
}
