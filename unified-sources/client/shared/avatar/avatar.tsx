import * as React from "react";
import classnames from "classnames";
import { Space, spaceValues } from "../common-interfaces/space";
import { Identicon } from "../identicon/identicon";
const css = require("./avatar.scss");

interface BaseProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: any;
  size?: number;
  alt?: string;
  styles?: any;
}

interface AvatarProps extends BaseProps {
  src?: string;
}

interface UserInitialsAvatarProps extends Partial<BaseProps> {
  initialsName: string;
}

function Avatar({ className, src, size = spaceValues[Space.Large], alt, styles = css, ...props }: AvatarProps) {
  const defaultImg = "https://assets.appcenter.ms/assets/default-avatar-128w.png";
  const classes = classnames(styles.avatar, className);
  return (
    <div {...props} className={classes}>
      <img src={src || defaultImg} width={size} height={size} alt={alt} />
    </div>
  );
}

function getInitials(name: string): string {
  const trimmedName = name !== null ? name.trim() : "";
  const splitName = trimmedName.split(" ");
  if (trimmedName.length === 0) {
    return "";
  } else if (splitName.length === 1) {
    return trimmedName[0].toUpperCase(); // keevan -> K
  } else {
    const firstName = splitName[0];
    const lastName = splitName[splitName.length - 1];
    return `${firstName[0]}${lastName[0]}`.toUpperCase(); // Nick plott -> NP / Sean Day9 plott -> SP
  }
}

function UserInitialsAvatar({
  initialsName,
  size = spaceValues[Space.Large],
  styles = css,
  className,
  ...props
}: UserInitialsAvatarProps) {
  if (!initialsName) {
    initialsName = "";
  }
  const classes = classnames(styles["avatar-initials"], className);
  const initials = getInitials(initialsName);

  // cover the chance that we are passed an empty string
  return initials.length > 0 ? (
    <Identicon {...props} size={size} value={initials} className={classes} length={initials.length} />
  ) : (
    <Avatar size={size} alt={props.alt === "" ? "" : props.alt || "default avatar"} />
  );
}

export { Avatar, UserInitialsAvatar };
