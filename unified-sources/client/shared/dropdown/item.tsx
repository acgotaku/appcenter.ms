import * as React from "react";
import { observer } from "mobx-react";
import { Gravatar } from "../gravatar/gravatar";
import { UserInitialsAvatar } from "../avatar/avatar";
import { MediaObject, MediaObjectProps } from "../media-object/media-object";
import { IconSize, IconName, Icon, IconArea } from "../icon/icon";
import { Text, Size, TextColor } from "../typography";
import { ItemContext, itemContextTypes } from "./list-item-context";
import { Color } from "../utils/color";
const classNames = require("classnames");
const css = require("./item.scss");

export interface CommonItemProps {
  inline?: boolean;
  invert?: boolean;
  disabled?: boolean;
  danger?: boolean;
  styles?: any;
}

export interface IconItemProps extends CommonItemProps, React.HTMLAttributes<HTMLElement> {
  title: string;
  description?: string;
  icon?: IconName | React.ReactElement<any>;
  iconSize?: IconSize.Small | IconSize.Medium;
  iconColor?: Color;
}

export interface AvatarItemProps extends CommonItemProps, React.HTMLAttributes<HTMLElement> {
  email: string;
  name: string;
}

export type ItemProps = Partial<IconItemProps> & Partial<AvatarItemProps> & Partial<MediaObjectProps>;

@observer
export class Item extends React.Component<ItemProps, {}> {
  public context!: ItemContext;
  public static defaultProps = {
    iconSize: IconSize.Small,
    styles: css,
  };

  public static contextTypes = itemContextTypes;

  private get image() {
    const {
      email,
      name,
      icon,
      iconSize,
      iconColor,
      disabled = (this.context.listItemContext || ({} as ItemContext["listItemContext"])).disabled,
      invert = (this.context.dropdownContext || ({} as ItemContext["dropdownContext"])).dark,
    } = this.props;
    if (email) {
      return <Gravatar size={32} email={email} fallback={name ? <UserInitialsAvatar initialsName={name} size={32} /> : undefined} />;
    }

    if (typeof icon === "string") {
      // TODO: later, Icon should support TextColor and invert rather than Color
      const color = iconColor || (disabled ? Color.LightGray : TextColor.Primary);

      return <Icon icon={icon} size={iconSize} color={color} area={IconArea.Normal} invert={invert} />;
    }

    return icon;
  }

  public render() {
    const {
      title,
      name,
      description,
      email,
      inline,
      disabled = (this.context.listItemContext || ({} as ItemContext["listItemContext"])).disabled,
      danger = (this.context.listItemContext || ({} as ItemContext["listItemContext"])).danger,
      invert = (this.context.dropdownContext || ({} as ItemContext["dropdownContext"])).dark,
      styles,
      icon,
      iconSize,
      iconColor,
      ...passthrough
    } = this.props;
    const image = this.image;
    const className = classNames([this.props.className, styles[inline ? "inline" : "item"]], { [styles.disabled]: disabled });
    const color = disabled ? TextColor.Disabled : danger ? TextColor.Danger : TextColor.Primary;

    return (
      <MediaObject inline={inline} textOnly={!image} {...passthrough} className={className}>
        {image}
        <Text
          size={Size.Medium}
          color={color}
          invert={invert}
          className={classNames(styles.title, styles.text)}
          ellipsize
          data-test-class="item-text-primary"
        >
          {title || name}
        </Text>
        {email || description ? (
          <Text
            size={Size.Medium}
            color={disabled ? TextColor.Disabled : TextColor.Secondary}
            invert={invert}
            className={classNames(styles.description, styles.text)}
            ellipsize
            data-test-class="item-text-secondary"
          >
            {email || description}
          </Text>
        ) : null}
      </MediaObject>
    );
  }
}

export const IconItem = Item as React.ComponentClass<IconItemProps>;
export const AvatarItem = Item as React.ComponentClass<AvatarItemProps>;
