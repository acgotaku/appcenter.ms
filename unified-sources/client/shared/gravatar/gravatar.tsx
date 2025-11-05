import * as React from "react";
import { useGravatar } from "./use-gravatar";
import { Identicon } from "../identicon/identicon";
import { Avatar } from "../avatar/avatar";
import { Space, spaceValues } from "../common-interfaces/space";
const { cloneElement } = React;
const css = require("./gravatar.scss");

interface GravatarProps extends React.HTMLAttributes<HTMLElement> {
  size?: number;
  email?: string;
  skeleton?: boolean;
  alt?: string;
  styles?: any;
  fallback?: JSX.Element; // doesn't account for arrays, but for some reason this works when React.ReactNode doesn't
}

/*
 * Gravatar will return the proper gravatar component if the user has a valid gravatar account/picture.
 * If the user's gravatar url is invalid, then we will render the fallback component
 */
function Gravatar({ email, size = spaceValues[Space.Large], styles = css, fallback, skeleton = false, ...props }: GravatarProps) {
  const { isLoading, gravatarUrl } = useGravatar(email || "", size);

  if (isLoading || skeleton) {
    return <Identicon skeleton size={size} />;
  } else if (gravatarUrl && !isLoading) {
    return <Avatar src={gravatarUrl} size={size} alt="" {...props} />;
  } else if (fallback) {
    return cloneElement(fallback, {
      className: [props.className, fallback.props.className].join(" "),
    });
  } else {
    return <Avatar size={size} alt="" />;
  }
}

export { Gravatar };
