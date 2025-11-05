import * as React from "react";
import * as classNames from "classnames";
const css = require("./unstyled-button.scss");

export class UnstyledButton extends React.Component<React.ButtonHTMLAttributes<HTMLButtonElement> & { styles?: any }, {}> {
  public static defaultProps = { styles: css };

  public render() {
    const { styles, children, className, ...props } = this.props;
    const cn = classNames(styles.unbutton, className);
    return (
      <button type="button" className={cn} {...props}>
        {children}
      </button>
    );
  }
}
