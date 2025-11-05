import * as React from "react";
import { range } from "lodash";
import { Gravatar, Skeletal, TeamIcon, Avatar } from "@root/shared";
import { Space, spaceValues } from "../common-interfaces/space";
import { IUser } from "@lib/common-interfaces";
import * as classNames from "classnames";

const css = require("./avatar-list.scss");

export interface AvatarListProps extends React.HTMLAttributes<HTMLElement> {
  /** Partial User objects (just `email` and/or `avatar_url`) for whom to display avatars. */
  users: Pick<Partial<IUser>, "email" | "avatar_url">[];
  /** Renders additional TeamIcons in the list if the number of `users` is less than `maxCount`. */
  numOfTeams?: number;
  /** Renders the avatars closer together. */
  squished?: boolean;
  /** The maximum number of avatars to render from `users`. */
  maxCount?: number;
  /** The size (in pixels) of each avatar. (Passed to `Gravatar`.) */
  size?: number;
}

export class AvatarList extends React.Component<AvatarListProps & Skeletal, {}> {
  public static displayName = "AvatarList";
  public static defaultProps: AvatarListProps = {
    size: spaceValues[Space.Large],
    maxCount: 5,
    users: [],
    numOfTeams: 0,
  };

  public render() {
    const { users, size, squished, skeleton, className, maxCount, numOfTeams, ...passthrough } = this.props;
    const skeletonEntries = skeleton ? range(0, Math.max(0, maxCount! - users.length)) : []; // Give skeleton priority to users.
    const usersToShow = users.slice(0, maxCount);
    const numOfTeamsToShow = Math.min(numOfTeams!, maxCount! - usersToShow.length); // Render Teams iff users are falling short of the maxCount.

    return (
      <div
        className={classNames(css.container, className, { [css.squished]: squished }, { [css.skeleton]: skeleton })}
        {...passthrough}
      >
        {usersToShow
          .concat(skeletonEntries as any)
          .map((user: AvatarListProps["users"][0] | number) =>
            typeof user === "number" ? (
              <Gravatar key={user} size={size} alt="Avatar loading" skeleton />
            ) : user.avatar_url ? (
              <Avatar src={user.avatar_url} alt={""} size={size} />
            ) : (
              <Gravatar key={user.email || user.avatar_url} alt="" email={user.email} size={size} />
            )
          )}
        {!skeleton && numOfTeamsToShow ? range(0, numOfTeamsToShow).map((index) => <TeamIcon key={index} />) : null}
      </div>
    );
  }
}
