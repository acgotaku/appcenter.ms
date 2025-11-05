import * as React from "react";
import * as PropTypes from "prop-types";
import { Link } from "react-router";
import { observer } from "mobx-react";
import { RowContext } from "./types";
import { Keys } from "../utils/keys";
const css = require("./cell.scss");
const textCellStyles = require("./text-cell.scss");

export interface CellProps extends React.HTMLAttributes<HTMLElement> {
  skeleton?: boolean;
  link?: boolean;
  styles?: any;
  hideUntilKeyboardNav?: boolean;
  children?: React.ReactNode | (() => React.ReactNode);
  hideUntilRowHover?: boolean; // currently not used, but kept for backwards compatibility and in case we need it in the future
}

const childrenValidator = (props: CellProps, ...rest: any[]) => {
  const { children, className } = props;
  if (!className || !className.includes(textCellStyles.ellipsize)) {
    const evaluatedChildren = typeof children === "function" ? children() : children;
    if (typeof evaluatedChildren === "string" || typeof evaluatedChildren === "number") {
      console.warn(
        "Warning: you used `Cell` with plain string children. `Cell` no longer ellipsizes its text. " +
          "Consider using `TextCell` instead to enable truncated text to be ellipsized automatically."
      );
    }
  }
  return (PropTypes.oneOfType([PropTypes.node, PropTypes.func]) as Function)(props, ...rest);
};

export class Cell extends React.Component<CellProps, {}> {
  public static displayName = "Cell";
  public static propTypes: React.WeakValidationMap<CellProps> = {
    children: childrenValidator,
    skeleton: PropTypes.bool,
    link: PropTypes.bool,
  };
  public static Observer: typeof Cell = observer(Cell);

  public static defaultProps = {
    styles: css,
    link: false,
  };

  public static contextTypes: React.WeakValidationMap<RowContext> = {
    to: PropTypes.string,
    href: PropTypes.string,
  };
  public context!: RowContext;

  get children() {
    const children: CellProps["children"] = this.props.children;
    if (typeof children === "string") {
      return <span className={css.ellipsize}>{children}</span>;
    }
    if (typeof children === "function") {
      // FIXME: Remove this invocation if Cell.Observer obsoletes it
      // https://xamarinhq.slack.com/archives/C3QAA02M8/p1497894196485153
      return children();
    }
    return children;
  }

  get container() {
    if (!this.props.link) {
      return this.children;
    }
    if (this.context.href) {
      return (
        <a href={this.context.href} className={css.unanchor}>
          {this.children}
        </a>
      );
    }
    if (this.context.to) {
      return (
        <Link to={this.context.to} className={css.unanchor}>
          {this.children}
        </Link>
      );
    }
  }

  private onKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if ([Keys.Enter, Keys.Space].includes(event.which)) {
      event.stopPropagation();
    }

    if (this.props.onKeyDown) {
      this.props.onKeyDown(event);
    }
  };

  public render() {
    const { className, skeleton, hideUntilKeyboardNav, ...props } = this.props;
    const { styles, link, ...passthrough } = props;
    const classNames = [
      css.cell,
      className,
      skeleton ? styles.celleton : null,
      hideUntilKeyboardNav ? styles["hide-until-keyboard-nav"] : null,
    ].join(" ");

    return (
      <div {...passthrough} className={classNames} onKeyDown={this.onKeyDown}>
        {this.container}
      </div>
    );
  }
}
