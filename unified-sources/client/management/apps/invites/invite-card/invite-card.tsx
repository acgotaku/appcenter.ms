import * as React from "react";
import { Link } from "react-router";
import { observer } from "mobx-react";
import {
  OrganizationIcon,
  AppIcon,
  Text,
  Size,
  PrimaryButton,
  SecondaryButton,
  ButtonSize,
  TextColor,
  MessageBar,
  NotificationType,
  InjectedButtonProps,
} from "@root/shared";
import { Invitation } from "@root/data/management/models/invitation";
import { capitalize } from "lodash";
import { withTranslation, WithTranslation, Trans } from "react-i18next";
import { InviteCardUIStore } from "./invite-card-ui-store";
import { locationStore } from "@root/stores";

const styles = require("./invite-card.scss");

// These props are destined to change after API contract is done.
export interface InviteCardProps {
  index: number;
  invite: Invitation;
  onDismiss?: (invitation) => void;
  onAccept?: (invitation, onAcceptedAppReady) => void;
}

export interface InviteCardState {
  status: "accepted" | "declined" | "acceptedAppReady";
}

export const InviteCard = withTranslation("management")(
  observer(
    class InviteCard extends React.Component<InviteCardProps & WithTranslation, InviteCardState> {
      private inviteCardUiStore = new InviteCardUIStore(this.props.invite);
      state = {
        status: undefined as any,
      };

      public render() {
        const { invite, t } = this.props;

        return (
          <MessageBar
            type={NotificationType.Info}
            renderActionButton={this.renderAcceptButton}
            renderDismissButton={this.renderDeclineButton as any}
            icon={
              invite.organization ? (
                <OrganizationIcon organization={invite.organization} size={32} />
              ) : (
                <AppIcon app={invite.app} size={32} />
              )
            }
          >
            <Text size={Size.Medium}>
              {t("management:inviteCard.message", {
                inviterName: invite.invitedBy?.display_name,
                inviteType: invite.organization ? "org" : "app",
              })}{" "}
              <Text bold size={Size.Medium}>
                {(invite.organization || invite.app)!.display_name}
              </Text>
            </Text>
          </MessageBar>
        );
      }

      private renderAcceptButton = (injectedProps: InjectedButtonProps) => {
        const { invite, t } = this.props;

        if (this.inviteCardUiStore.errorMessageKey) {
          return (
            <Text size={Size.Medium} color={TextColor.Secondary}>
              <Trans i18nKey={this.inviteCardUiStore.errorMessageKey}>
                <a href={window.location.href}></a>
              </Trans>
            </Text>
          );
        } else if (this.state.status === "acceptedAppReady") {
          return (
            <Link to={locationStore.getUrlWithApp("", invite.app)} className={styles.clicked}>
              {t("management:inviteCard.openAppLink")}{" "}
            </Link>
          );
        } else if (this.state.status) {
          return (
            <Text size={Size.Medium} className={styles.clicked} color={TextColor.Secondary}>
              {capitalize(this.state.status)}
            </Text>
          );
        } else {
          return (
            <PrimaryButton {...injectedProps} onClick={this.onAccept} size={ButtonSize.Small}>
              Join
            </PrimaryButton>
          );
        }
      };

      private renderDeclineButton = (injectedProps: InjectedButtonProps) => {
        if (this.state.status || this.inviteCardUiStore.errorMessageKey) {
          return null;
        } else {
          return (
            <SecondaryButton {...injectedProps} onClick={this.onDecline} size={ButtonSize.Small}>
              Decline
            </SecondaryButton>
          );
        }
      };

      private onDecline = () => {
        const { invite, onDismiss } = this.props;
        this.setState({
          status: "declined",
        });
        if (typeof onDismiss === "function") {
          onDismiss(invite);
        }
      };

      private onAccept = () => {
        const { invite, onAccept } = this.props;
        this.setState({
          status: "accepted",
        });
        if (typeof onAccept === "function") {
          onAccept(invite, this.onAcceptedAppReady);
        }
      };

      private onAcceptedAppReady = () => {
        this.setState({
          status: "acceptedAppReady",
        });
      };
    }
  )
);
