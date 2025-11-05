import * as React from "react";
import { Text, Size, TextColor, Gravatar, UserInitialsAvatar } from "@root/shared";
import { IUser } from "@lib/common-interfaces";
import { observer } from "mobx-react";

const styles = require("./user-avatar-info.scss");

export interface IUserAvatarInfoProps {
  user?: IUser;
}

@observer
export class UserAvatarInfo extends React.Component<IUserAvatarInfoProps, {}> {
  public render() {
    const { user } = this.props;

    return (
      <div className={styles["user-avatar-info-container"]}>
        <Gravatar
          email={user!.email}
          size={80}
          fallback={
            user!.display_name ? (
              <UserInitialsAvatar size={80} initialsName={user!.display_name} />
            ) : user!.name ? (
              <UserInitialsAvatar size={80} initialsName={user!.name} />
            ) : undefined
          }
        />
        <Text className={styles["name"]} data-test-id="avatar-info-display-name" ellipsize size={Size.Medium}>
          {user!.display_name}
        </Text>
        <Text className={styles["name"]} data-test-id="avatar-info-username" ellipsize size={Size.Small} color={TextColor.Secondary}>
          {user!.name}
        </Text>
      </div>
    );
  }
}
