import * as React from "react";
import { Gravatar, MediaObject, InvitedUserIcon, Text, Size, TextColor, Title, UserInitialsAvatar } from "@root/shared";

const styles = require("./collaborator-badge.scss");

export interface CollaboratorBadgeProps {
  displayName: string;
  email: string;
  invitePending: boolean;
  skeleton?: boolean;
}

export class CollaboratorBadge extends React.Component<CollaboratorBadgeProps, {}> {
  public static displayName = "CollaboratorBadge";
  public static defaultProps: CollaboratorBadgeProps = {
    displayName: "",
    email: "",
    invitePending: false,
    skeleton: false,
  };

  public render() {
    const { email, displayName, invitePending, skeleton } = this.props;
    const size = 128;

    return (
      <div>
        {!invitePending ? (
          <Gravatar
            alt="collaborator avatar"
            className={styles.gravatar}
            skeleton={skeleton}
            email={email}
            size={size}
            fallback={<UserInitialsAvatar initialsName={displayName} />}
          />
        ) : (
          <InvitedUserIcon className={styles.gravatar} size={size} />
        )}
        <MediaObject textOnly skeleton={skeleton}>
          <Title size={Size.Large} ellipsize={true}>
            {displayName}
          </Title>
          <Text size={Size.Medium} ellipsize={true} color={TextColor.Secondary}>
            {invitePending ? "Invited" : email}
          </Text>
        </MediaObject>
      </div>
    );
  }
}
