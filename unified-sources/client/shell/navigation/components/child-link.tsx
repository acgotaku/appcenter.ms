import * as React from "react";
import { Link } from "react-router";
import * as classNames from "classnames/bind";
import { LinkProps } from "../types";
const styles = require("./child-link.scss");

export interface ChildLinkProps extends LinkProps {
  isOuterResource?: boolean;
}

export class ChildLink extends React.Component<ChildLinkProps> {
  public render() {
    const { route, title, active, isOuterResource } = this.props;
    const className = classNames.call(styles, "child-link", { active });

    return isOuterResource ? (
      <a
        href={route}
        className={className}
        data-inverts-on-hover="high-contrast"
        data-inverted={active ? "high-contrast" : null}
        data-test-id={title}
        aria-current={active ? "page" : undefined}
      >
        {title}
      </a>
    ) : (
      <Link
        to={route}
        className={className}
        data-inverts-on-hover="high-contrast"
        data-inverted={active ? "high-contrast" : null}
        data-test-id={title}
        aria-current={active ? "page" : undefined}
      >
        {title}
      </Link>
    );
  }
}
