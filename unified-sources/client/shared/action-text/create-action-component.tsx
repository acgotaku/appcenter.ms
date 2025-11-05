import * as React from "react";
import { LinkProps, Link } from "react-router";
import { noop } from "lodash";
import { TextColor } from "../utils/color";
import { Text, Size } from "../typography";
import { HTMLTagNames } from "@lib/common-interfaces/html-tag-names";
const css = require("./action-text.scss");

export type ActionProps<P extends React.HTMLAttributes<HTMLElement> = React.HTMLAttributes<HTMLElement>> = P & {
  /** Removes the underline in favor of a strikethrough and changes the color to the default disabled text color (semitransparent black). Also sets the cursor back to the default system cursor and prevents the text from being clickable or focusable. */
  disabled?: boolean;
  /** Renders the text in the default danger text color (red). */
  danger?: boolean;
  /** The size of the text. */
  size?: Size.Small | Size.Medium | Size.Large;
  /** Adjusts the text color for optimal contrast on a dark background. */
  invert?: boolean;
};

const withDefaultPrevented = (handler: React.EventHandler<any>) => (e: React.SyntheticEvent<any>) => {
  e.preventDefault();
  handler(e);
};

export default <P extends ActionProps<any>>(tagName: HTMLTagNames | React.ComponentClass<LinkProps>): React.SFC<P> => ({
  disabled,
  danger,
  className,
  onClick,
  ...props
}: ActionProps) => (
  <Text
    size={Size.Medium} // Only overridable prop
    {...props}
    className={[disabled ? css.disabled : css.actionText, className].join(" ")}
    tagName={tagName}
    {...(tagName === "a" ? { href: "#" } : {})}
    {...(danger ? { color: TextColor.Danger } : {})} // Middle priority: danger color
    {...(disabled ? { color: TextColor.Disabled } : {})} // Highest priority: disabled color
    color={TextColor.Link} // Lowest priority: default color
    tabIndex={disabled ? -1 : props.tabIndex || 0}
    bold={false}
    underline
    strikethrough={disabled}
    {...(disabled ? { onClick: noop } : {})}
    onClick={tagName === Link ? noop : onClick && withDefaultPrevented(onClick)}
  />
);
