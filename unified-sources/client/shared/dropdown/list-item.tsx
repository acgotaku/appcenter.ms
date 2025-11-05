import * as React from "react";
import * as classNames from "classnames/bind";
import { observable } from "mobx";
import { observer } from "mobx-react";
import { TextColor } from "../typography";
import { uniqueId, deburr } from "lodash";
import { ListItemContext, listItemContextTypes, itemContextTypes } from "./list-item-context";
const { Children, cloneElement } = React;
const css = require("./list-item.scss");

export interface ListItemProps extends React.HTMLAttributes<HTMLElement> {
  tagName?: string | React.ComponentClass<any>;
  focusClassName?: string;
  text: string;
  selected?: boolean;
  disabled?: boolean;
  danger?: boolean;
  styles?: any;
  dontSetTabIndex?: boolean /**  exception for cases where the tabIndex={0} (which is usually needed for screenreaders to announce the list items correctly),
    causes the dropdown/list items to break
  */;
}

interface DefaultProps {
  styles: any;
  tagName: string;
  focusClassName: string;
}

type ListItemPropsWithDefaultProps = ListItemProps & DefaultProps;

@observer
export class ListItem extends React.Component<ListItemProps, {}> {
  public context!: ListItemContext;
  public static contextTypes = listItemContextTypes;
  public static childContextTypes = itemContextTypes;
  public static defaultProps = { styles: css, tagName: "div", focusClassName: "focus" };
  private id = uniqueId("ListItem-");
  private childContext = () => {
    const self = this;
    return observable({
      get disabled() {
        return self.props.disabled;
      },
      get danger() {
        return self.props.danger;
      },
    });
  };

  public getChildContext() {
    return { listItemContext: this.childContext };
  }

  public render() {
    const { className, children, styles, tagName, focusClassName, text, selected, disabled, danger, dontSetTabIndex, ...props } = this
      .props as ListItemPropsWithDefaultProps;
    const { compact, onMouseEnter, onMouseLeave, focusedItemId, dark, query } = this.context.dropdownContext || ({} as any);
    const cx = classNames.bind(styles);
    const focus = focusedItemId === this.id;
    const relaxed = !compact;
    const TagName = tagName;

    if (typeof query === "string" && query.length && !deburr(text.toLocaleLowerCase()).includes(deburr(query.toLocaleLowerCase()))) {
      return null;
    }

    const color = disabled ? TextColor.Disabled : danger ? TextColor.Danger : TextColor.Primary;

    // If the contents inside ListItem are not `aria-hidden`, VoiceOver tells you that the items
    // have interactive content inside that you can navigate into with Ctrl+Option+Shift+Down
    // rather than telling you how to select the current menu item.
    return (
      <TagName
        role="menuitem"
        data-test-class="dropdown-list-item"
        data-list-item-id={this.id}
        data-disabled={disabled}
        id={this.id}
        aria-disabled={disabled}
        aria-label={text}
        className={cx(className, "list-item", `${TextColor[color!].toLowerCase()}-text${dark ? "-invert" : ""}`, "ellipsize", {
          [focusClassName]: focus,
          selected,
          compact,
          relaxed,
          dark,
          disabled,
        })}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        tabIndex={dontSetTabIndex ? undefined : 0}
        {...props}
      >
        {typeof children === "string"
          ? children
          : Children.map(children, (child, index) =>
              child && typeof child === "object" ? cloneElement(child, { key: child.props.key || index, tabIndex: -1 }) : child
            )}
      </TagName>
    );
  }
}
