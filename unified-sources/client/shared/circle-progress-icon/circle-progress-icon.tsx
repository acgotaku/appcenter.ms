import * as React from "react";
const css = require("./circle-progress-icon.scss");

export interface CircleProgressIconProps extends React.SVGAttributes<SVGSVGElement> {
  progress?: number;
  size?: number;
}

export const CircleProgressIcon: React.SFC<CircleProgressIconProps> = ({ progress, size, ...props }) => (
  <svg {...props} width={size} height={size} viewBox="0 0 32 32" xmlns="https://www.w3.org/2000/svg">
    <g stroke="#FFF" strokeWidth="4" fill="none" fillRule="evenodd">
      <circle strokeOpacity=".2" cx="16" cy="16" r="14" />
      <path
        d="M2,16a14,14 0 1,0 28,0a14,14 0 1,0 -28,0"
        strokeDasharray="91"
        strokeDashoffset={typeof progress === "number" ? 91 * (-1 + progress) : -61}
        className={typeof progress !== "number" ? css.spinning : null}
        transform="rotate(90)"
        style={{ transformOrigin: "center" }}
      />
    </g>
  </svg>
);

CircleProgressIcon.displayName = "CircleProgressIcon";
CircleProgressIcon.defaultProps = {
  size: 32,
};
