import * as React from "react";
import * as classNames from "classnames/bind";
import { Text, Size, TextColor } from "../../typography";
import { preventBubbling } from "../../utils";
import { uniqueId } from "lodash";
const styles = require("../list-item.scss");
const cx = classNames.bind(styles);

export interface ListItemProps extends React.HTMLAttributes<HTMLElement> {
  text: string;
  compact?: boolean;
  selected?: boolean;
  disabled?: boolean;
  danger?: boolean;
  dark?: boolean;
}

export const ListItem = React.forwardRef<HTMLDivElement, ListItemProps>((props, ref) => {
  const { text, compact, selected, danger, dark, disabled, className, children, onClick, ...passthrough } = props;
  const relaxed = !compact;
  const { current: id } = React.useRef(uniqueId("ListItem-"));
  const color = disabled ? TextColor.Disabled : danger ? TextColor.Danger : TextColor.Primary;

  // If the contents inside ListItem are not `aria-hidden`, VoiceOver tells you that the items
  // have interactive content inside that you can navigate into with Ctrl+Option+Shift+Down
  // rather than telling you how to select the current menu item.
  return (
    <div
      role="menuitem"
      data-test-class="dropdown-list-item"
      data-list-item-id={id}
      data-disabled={disabled}
      id={id}
      aria-disabled={disabled}
      aria-label={text}
      className={cx(className, "list-item", { selected, compact, relaxed, dark, disabled })}
      ref={ref}
      onClick={disabled ? preventBubbling : onClick}
      {...passthrough}
    >
      {typeof children === "string" ? (
        <Text aria-hidden size={Size.Medium} color={color} invert={dark} ellipsize tabIndex={-1}>
          {children}
        </Text>
      ) : (
        React.Children.map(children, (child, index) =>
          child && typeof child === "object"
            ? React.cloneElement(child, { "aria-hidden": true, key: child.props.key || index, tabIndex: -1 })
            : child
        )
      )}
    </div>
  );
});

ListItem.displayName = "ListItem";
