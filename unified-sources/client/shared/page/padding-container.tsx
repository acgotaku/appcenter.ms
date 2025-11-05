import * as React from "react";
const css = require("../panels/panel.scss");

const PaddingContainer: React.StatelessComponent<React.HTMLAttributes<HTMLElement> & { styles?: any }> = ({
  styles,
  className,
  children,
  ...props
}) => (
  <div {...props} className={[className, styles["padding-container"]].join(" ")}>
    {children}
  </div>
);

PaddingContainer.defaultProps = { styles: css };
export { PaddingContainer };
