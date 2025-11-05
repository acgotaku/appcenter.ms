import { useOverflowDetection } from "@root/shared/hooks";
import * as React from "react";
const css = require("./overflow-tooltip.scss");

interface OverflowTooltipProps extends React.HTMLAttributes<HTMLElement> {
  children: string;
}

export function OverflowTooltip({ className, ...props }: OverflowTooltipProps) {
  const [isOverflowing, overflowProps] = useOverflowDetection();

  return (
    <span {...props} {...overflowProps} title={isOverflowing ? props.children : ""} className={[className, css.ellipsize].join(" ")}>
      {props.children}
    </span>
  );
}
