import * as React from "react";
import { UnstyledButton } from "@root/shared";
import { NpsRatingTheme } from "@root/shared/nps-rating/nps-rating";
const classNames = require("classnames/bind");
const css = require("./rating-box.scss");
const cx = classNames.bind(css);

export interface RatingBoxProps {
  text: string;
  value: number;
  selected: boolean;
  onClick: (value: number) => void;
  theme?: NpsRatingTheme;
  max?: number;
}

export class RatingBox extends React.Component<RatingBoxProps, {}> {
  public render() {
    const { text, value, selected } = this.props;

    return (
      <UnstyledButton
        className={cx("box", {
          selected: selected,
          gray: this.props.theme && this.props.theme === NpsRatingTheme.Gray,
        })}
        onClick={(event) => this.onClick(event, value)}
        aria-label={this.ariaLabel()}
      >
        {text}
      </UnstyledButton>
    );
  }

  private ariaLabel(): string {
    const { max, value } = this.props;
    if (max) {
      return `${value} points, on a scale of 0 (not at all likely) to ${max - 1} (extremely likely)`;
    }
    return `${value} points`;
  }

  public onClick(event, value: number): void {
    event.stopPropagation();
    const { onClick } = this.props;

    if (typeof onClick === "function") {
      onClick(value);
    }
  }
}
