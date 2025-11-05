import * as classNames from "classnames/bind";
import { createSFC } from "../utils";
const css = require("./stretch.scss");

export const Stretch = createSFC<{ vertical?: boolean; centered?: boolean }>(
  "Stretch",
  css,
  ({ vertical, centered, styles }) => classNames.call(styles, vertical ? "vertical" : "stretch", { centered }),
  ["vertical", "centered"]
);
