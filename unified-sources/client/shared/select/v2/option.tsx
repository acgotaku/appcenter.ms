import * as React from "react";
import * as classNames from "classnames/bind";
import { Checkbox } from "../../checkbox";
import { ListItem, ListItemProps } from "../../dropdown/v2";
import { Text, Size, TextColor } from "../../typography";
import { isWindows } from "../../utils";
const styles = require("../option.scss");
const cx = classNames.bind(styles);

export interface OptionProps extends ListItemProps {
  text: string;
  selected: boolean;
  multiple?: boolean;
  onSelectOption: React.EventHandler<React.SyntheticEvent<HTMLElement>>;
  onDeselectOption: React.EventHandler<React.SyntheticEvent<HTMLElement>>;
}

export const Option = React.forwardRef<HTMLDivElement, OptionProps>((props, ref) => {
  const { text, selected, multiple, onSelectOption, onDeselectOption, children, className, disabled, ...passthrough } = props;
  const content = children || text;
  const onClick: React.MouseEventHandler<HTMLElement> = (event) =>
    selected && multiple ? props.onDeselectOption(event) : props.onSelectOption(event);
  const onChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    if (event.target.checked) {
      props.onSelectOption(event);
    } else {
      props.onDeselectOption(event);
    }
  };

  return (
    <ListItem
      {...passthrough}
      text={text}
      selected={selected}
      role={isWindows ? "option" : "menuitem"}
      aria-label={selected ? `✓, ${text}` : text}
      aria-selected={selected}
      className={cx("option", className, { single: !multiple, selected })}
      disabled={disabled}
      onClick={onClick}
      tabIndex={-1}
      ref={ref}
    >
      {multiple ? (
        <Checkbox disabled={disabled} checked={selected} onChange={onChange} className={styles.checkbox} tabIndex={-1} />
      ) : null}
      {typeof content === "string" ? (
        <Text aria-hidden size={Size.Medium} color={TextColor.Primary} ellipsize tabIndex={-1}>
          {content}
        </Text>
      ) : (
        content
      )}
    </ListItem>
  );
});

Option.displayName = "Option";
