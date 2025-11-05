import * as React from "react";
import { observer } from "mobx-react";
import { CSSTransitionGroup } from "react-transition-group";
import {
  autofetch,
  Grid,
  GridRowCol,
  GridSpacing,
  Stretch,
  MediaObject,
  Icon,
  Text,
  Size,
  IconName,
  Color,
  TextColor,
  Space,
  UnstyledButton,
} from "@root/shared";
import { InviteCard } from "./invite-card/invite-card";
import { InvitesUIStore } from "./invites-ui-store";

const styles = require("./invites.scss");

export interface InvitesProps {
  // Nothing to add here.
}

export const Invites = autofetch(undefined)(
  observer(
    class Invites extends React.Component<InvitesProps, {}> {
      private invitesUiStore = new InvitesUIStore();

      public componentWillUnmount() {
        this.invitesUiStore.clearAcceptedInvitations();
      }

      public fetchData() {
        this.invitesUiStore.fetchCollection();
      }

      public render() {
        const { invites, declineInvite, acceptInvite, displayedInvites, shouldTruncateList } = this.invitesUiStore;
        const iconName = this.invitesUiStore.showAllInvites ? IconName.ButtonExpandLess : IconName.ButtonExpandMore;
        const expandPrompt = this.invitesUiStore.showAllInvites ? " Show less" : ` Show all ${invites.length} invitations`;

        return (
          <div className={invites.length === 0 ? styles.hidden : styles.wrapper}>
            <CSSTransitionGroup
              className={styles.container}
              transitionName={{
                enter: styles.enter,
                enterActive: styles["enter-active"],
                appear: styles.appear,
                appearActive: styles["appear-active"],
                leave: styles.leave,
                leaveActive: styles["leave-active"],
              }}
              transitionAppear
              transitionAppearTimeout={parseInt(styles.leaveDuration, 10)}
              transitionEnter
              transitionEnterTimeout={parseInt(styles.leaveDuration, 10)}
              transitionLeaveTimeout={parseInt(styles.leaveDuration, 10)}
              transitionLeave
            >
              {displayedInvites.map((invite, index) => (
                <InviteCard index={index} key={invite.id} invite={invite} onDismiss={declineInvite} onAccept={acceptInvite} />
              ))}
            </CSSTransitionGroup>
            {shouldTruncateList ? (
              <Grid rowSpacing={GridSpacing.Small} padded bordered className={styles.bordered}>
                <GridRowCol width={12}>
                  <Stretch>
                    <MediaObject hSpace={Space.XSmall}>
                      <UnstyledButton onClick={this.invitesUiStore.toggleShowAll}>
                        <Icon color={Color.DarkBlue} icon={iconName} />
                        <Text color={TextColor.Link} size={Size.Medium}>
                          {expandPrompt}
                        </Text>
                      </UnstyledButton>
                    </MediaObject>
                  </Stretch>
                </GridRowCol>
              </Grid>
            ) : null}
          </div>
        );
      }
    }
  )
);
