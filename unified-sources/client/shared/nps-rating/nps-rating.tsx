import * as React from "react";
import { RatingBox } from "./rating-box";
import { range } from "lodash";
const classNames = require("classnames/bind");
const css = require("./nps-rating.scss");
const cx = classNames.bind(css);

export enum NpsRatingTheme {
  Default,
  Gray,
}

export interface NpsRatingProps {
  value: number;
  onChange: (value: number) => void;
  theme?: NpsRatingTheme;
  "aria-labelledby"?: string;
}

export class NpsRating extends React.Component<NpsRatingProps, {}> {
  public render() {
    const min = 0;
    const max = 11;
    const ariaLabelledBy = this.props["aria-labelledby"];

    return (
      <div className={css["container"]}>
        <div className={cx("ratings")} aria-labelledby={ariaLabelledBy}>
          {range(min, max).map((value, index) => {
            return (
              <RatingBox
                theme={this.props.theme}
                key={index}
                selected={this.props.value === value}
                text={`${value}`}
                value={value}
                onClick={(value) => this.handleClick(value)}
                max={max}
              />
            );
          })}
        </div>
        <div className={css["text-container"]}>
          <div className={css["text"]}>Not likely at all</div>
          <div className={css["text"]}>Extremely likely</div>
        </div>
      </div>
    );
  }

  public handleClick(value: number): void {
    const { onChange } = this.props;

    if (typeof onChange === "function") {
      onChange(value);
    }
  }
}
