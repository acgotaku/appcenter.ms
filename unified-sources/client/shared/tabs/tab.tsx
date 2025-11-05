import * as React from "react";
import { Link } from "react-router";
import { FakeButton } from "../fake-button";
import { Pill } from "../pill";
import { Color } from "../utils/color";
import { Autofocus } from "@root/shared";

const classNames = require("classnames");
const css = require("./tabs.scss");

export interface TabBadgeProps {
  value: number | string;
  selected: boolean;
}

export class TabBadge extends React.PureComponent<TabBadgeProps> {
  public render(): JSX.Element {
    const { value, selected } = this.props;
    return <Pill color={selected ? Color.Blue : Color.Gray}>{value}</Pill>;
  }
}

export interface TabProps extends React.HTMLAttributes<HTMLElement> {
  "aria-controls"?: string;
  id: string;
  to?: string;
  indicators?: boolean;
  selected?: boolean;
  disabled?: boolean;
  title?: string;
  key?: any;
  styles?: any;
  badge?: number | string | JSX.Element;
  autofocusEnabled?: boolean;
}

export class Tab extends React.Component<TabProps, {}> {
  public static defaultProps = {
    tabIndex: 0,
    styles: css,
  };

  private get tabIndex() {
    // Override 'tabIndex' from 'props' if this Tab is disabled.
    // Otherwise—
    //   if 'tabIndex' from 'props' exists, use it.
    //   if not, don’t set 'tabIndex' at all.
    return this.props.selected && !this.props.disabled ? this.props.tabIndex : -1;
  }

  public render() {
    const { disabled, indicators, selected, styles, to, title, badge, id, ...passthrough } = this.props;
    const TagName = to ? Link : FakeButton;
    const hasBadge = badge !== null && badge !== undefined;
    const tabClassName = classNames(this.props.className, {
      [styles["tab"]]: !title,
      [styles["tab-active"]]: selected,
      [styles["tab-with-title"]]: title,
      [styles["tab-active-with-title"]]: selected && title,
      [styles["tab-with-indicator"]]: indicators,
      [styles["tab-active-with-indicator"]]: selected && indicators,
      [styles["disabled"]]: disabled,
      [styles["tab-with-badge"]]: hasBadge,
    });

    return (
      <Autofocus focus={!!this.props.autofocusEnabled && !!this.props.selected}>
        <TagName
          aria-selected={selected}
          aria-disabled={disabled}
          role="tab"
          id={id}
          to={to!}
          data-test-class={`tab-${id}`}
          {...passthrough}
          className={tabClassName}
          tabIndex={this.tabIndex}
        >
          {this.props.children || title}
          {typeof badge === "string" || typeof badge === "number" ? <TabBadge value={badge} selected={!!selected} /> : badge}
        </TagName>
      </Autofocus>
    );
  }
}
