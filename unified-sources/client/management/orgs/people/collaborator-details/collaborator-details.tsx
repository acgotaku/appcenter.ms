import * as React from "react";
import { RouteComponentProps } from "react-router";
import { observer } from "mobx-react";
import { reaction } from "mobx";
import {
  Page,
  TopBar,
  Panelify,
  PanelInjectedProps,
  PanelOutlet,
  PrimaryButton,
  LinkButton,
  Button,
  MediaObject,
  Select,
  Option,
  Trigger,
  DropdownButton,
  ButtonSize,
  Color,
  PageNotification,
  ButtonContainer,
} from "@root/shared";
import { IOrganization, OrganizationUserRole } from "@lib/common-interfaces";
import { values } from "lodash";
import { Grid, Col, Row, GridSpacing, RowCol } from "@root/shared/grid";
import { Text, TextColor, TextProps, Size } from "@root/shared/typography";
import { CollaboratorBadge } from "./collaborator-badge/collaborator-badge";
import { MessageDialog } from "../../../shared/message-dialog/message-dialog";
import { getCollaboratorsStore } from "../../../stores/people/collaborators/collaborators-store";
import { RemoveCollaboratorStore } from "../../../stores/people/collaborators/remove-collaborator-store";
import { UpdateCollaboratorRoleStore } from "../../../stores/people/collaborators/update-collaborator-role-store";
import { CancelInviteStore } from "../../../stores/people/collaborators/cancel-invite-store";
import { ResendInviteStore } from "../../../stores/people/collaborators/resend-invite-store";
import { notFoundStore } from "../../../../stores/not-found-store";
import { ICollaborator } from "../../../constants/constants";
import { isEmail } from "../../../utils/utils";
import { withTranslation, WithTranslation } from "react-i18next";
import { userStore, locationStore, organizationStore } from "@root/stores";

const classNames = require("classnames");
const styles = require("./collaborator-details.scss");
const subtitleProps: TextProps = { uppercase: true, size: Size.Small, color: TextColor.Secondary };

type CollaboratorDetailsProps = PanelInjectedProps & RouteComponentProps<any, any> & WithTranslation;
interface CollaboratorDetailsState {
  role: string;
}

export const CollaboratorDetails = Panelify(
  withTranslation(["common", "management"])(
    observer(
      class CollaboratorDetails extends React.Component<CollaboratorDetailsProps, CollaboratorDetailsState> {
        private _updateRoleStore: UpdateCollaboratorRoleStore;
        private _removeCollaboratorStore: RemoveCollaboratorStore;
        private _cancelInviteStore: CancelInviteStore;
        private _resendInviteStore: ResendInviteStore;
        private _defaultCollaborator: ICollaborator = {
          role: undefined,
          id: undefined,
          email: undefined,
          name: undefined,
          display_name: undefined,
        };

        // mobx reactions
        private _fetchCollaboratorsFailedDisposer;
        private _fetchCollaboratorsLoadedDisposer;

        constructor(props: CollaboratorDetailsProps) {
          super(props);
          this._updateRoleStore = new UpdateCollaboratorRoleStore();
          this._removeCollaboratorStore = new RemoveCollaboratorStore();
          this._cancelInviteStore = new CancelInviteStore();
          this._resendInviteStore = new ResendInviteStore();
          this._clearNotifications();

          const { org_name } = props.params;
          const collaboratorsStore = getCollaboratorsStore(org_name);
          this._fetchCollaboratorsFailedDisposer = reaction(
            () => collaboratorsStore.isFailed,
            (isFailed) => {
              if (isFailed) {
                locationStore.goUp();
              }
            }
          );
          this._fetchCollaboratorsLoadedDisposer = reaction(
            () => collaboratorsStore.isLoaded,
            (isLoaded) => {
              // If we can't find current user in the loaded collaborator list, looks like this user doesn't have access to this organization.
              if (isLoaded && !collaboratorsStore.findCollaboratorByName(userStore.currentUser.name)) {
                locationStore.pushAppList();
              }
            }
          );
        }

        public UNSAFE_componentWillUpdate(nextProps: CollaboratorDetailsProps) {
          const { username, org_name } = this.props.params;
          const collaboratorsStore = getCollaboratorsStore(org_name);
          const updateSameCollaborator = nextProps.params && nextProps.params["username"] && nextProps.params["username"] === username;

          // We use email as username in the url if user hasen't accepted the invite yet.
          const email = isEmail(username) ? username : undefined;

          // If we're not navigating to the details for a different collaborator &
          // there is an email in the url but we can't find an "invited but pending" collaborator,
          // it's likely that the collaborator accepted their invite.
          if (updateSameCollaborator && email && !collaboratorsStore.findCollaboratorByName(email)) {
            const collaborator = collaboratorsStore.findCollaboratorByEmail(username);

            if (collaborator) {
              locationStore.router.push(`/orgs/${org_name}/people/collaborators/${collaborator.name}`);
              return;
            }
          }

          // If the collaborator was not found.
          const collaborator = collaboratorsStore.isPending
            ? this._defaultCollaborator
            : collaboratorsStore.findCollaboratorByName(username);
          if (collaboratorsStore.isLoaded && !collaborator) {
            notFoundStore.notify404();
            return null;
          }
        }

        public UNSAFE_componentWillReceiveProps(nextProps: CollaboratorDetailsProps) {
          const { username } = this.props.params;

          if (username !== nextProps.params["username"]) {
            this._clearNotifications();
          }
        }

        public componentWillUnmount() {
          this._fetchCollaboratorsFailedDisposer();
          this._fetchCollaboratorsLoadedDisposer();
        }

        public render() {
          const { params, t } = this.props;
          const { username, org_name } = params;
          const collaboratorsStore = getCollaboratorsStore(org_name);

          // Initialize all things.
          const organization = organizationStore.find(org_name)!;
          const collaborator = collaboratorsStore.isPending
            ? this._defaultCollaborator
            : collaboratorsStore.findCollaboratorByName(username);
          const currentUserCollaborator = collaboratorsStore.findCollaboratorByName(userStore.currentUser.name);
          const organizationDisplayName = organization ? organization.display_name || organization.name : null;

          // Set helper flags
          const areCurrentUserDetails = username === userStore.currentUser.name;
          const currentUserOrgAdmin = currentUserCollaborator && currentUserCollaborator.role === OrganizationUserRole.Admin;
          const needsSkeleton = collaboratorsStore.isPending;
          const dialogButtonClass = styles["dialog-buttons"];

          // Set leave/remove keys
          const leaveRemoveBaseKey = `management:collaboratorDetails.${areCurrentUserDetails ? "leave" : "remove"}`;

          // If the collaborator is not found because they were removed/un-invited.
          if (
            collaboratorsStore.isLoaded &&
            !collaborator &&
            (this._removeCollaboratorStore.isLoaded || this._cancelInviteStore.isLoaded)
          ) {
            return null;
          }

          // If the collaboratorsStore failed to fetch.
          if (collaboratorsStore.isFailed) {
            return null;
          }

          if (!collaborator) {
            return null;
          }

          const roleLabel = t("access.role");

          return (
            <Page data-test-id="collaborator-details-page">
              <TopBar title={t("title.details")} loading={this._updateRoleStore.isPending} />
              {this._renderNotifications()}
              <div className={styles.wrapper}>
                <Grid rowSpacing={GridSpacing.XLarge}>
                  <Row>
                    <Col>
                      <CollaboratorBadge
                        skeleton={needsSkeleton}
                        displayName={collaborator.display_name}
                        email={collaborator.email}
                        invitePending={collaborator.invitePending}
                      />
                    </Col>
                  </Row>

                  <RowCol>
                    <div className={classNames(styles.role)}>
                      {currentUserOrgAdmin ? (
                        <div>
                          <Text {...subtitleProps} className={styles.subtitle}>
                            {roleLabel}
                          </Text>
                          <Select
                            aria-label={roleLabel}
                            value={collaborator.role}
                            onChange={(value: string) =>
                              this._changeCollaboratorRole(collaborator, value as ICollaborator["role"], organization)
                            }
                            className={styles.select}
                          >
                            <Trigger>
                              <DropdownButton size={ButtonSize.Small}>
                                {t(`org.role.${collaborator.role || "collaborator"}`)}
                              </DropdownButton>
                            </Trigger>
                            {values<string>(OrganizationUserRole).map((type, key) => {
                              return <Option key={key} value={`${type}`} text={t(`org.role.${type}`)} />;
                            })}
                          </Select>

                          <MessageDialog
                            visible={this._updateRoleStore.isAdminResignWarningVisible}
                            onRequestClose={() => this._updateRoleStore.hideAdminResignWarning()}
                            title={t("management:collaboratorDetails.resign.title")}
                            message={t("management:collaboratorDetails.resign.message")}
                            buttonsArea={
                              <div className={dialogButtonClass}>
                                <PrimaryButton onClick={() => this._updateRoleStore.hideAdminResignWarning()}>
                                  {t("button.ok")}
                                </PrimaryButton>
                              </div>
                            }
                          />
                        </div>
                      ) : (
                        <MediaObject textOnly skeleton={needsSkeleton}>
                          <Text {...subtitleProps} className={classNames({ [styles.subtitle]: !needsSkeleton })}>
                            {t("access.role")}
                          </Text>
                          <div>{t(`org.role.${collaborator.role || "collaborator"}`)}</div>
                        </MediaObject>
                      )}
                    </div>
                    {!collaborator.invitePending ? (
                      <MediaObject textOnly skeleton={needsSkeleton}>
                        <Text {...subtitleProps} className={classNames({ [styles.subtitle]: !needsSkeleton })}>
                          {t("management:collaboratorDetails.joined")}
                        </Text>
                        <div>{t("management:collaboratorDetails.joinedDate", { collaborator })}</div>
                      </MediaObject>
                    ) : null}
                  </RowCol>

                  {currentUserOrgAdmin || areCurrentUserDetails ? (
                    collaborator.invitePending ? (
                      <RowCol className={styles["invitee-buttons"]}>
                        <ButtonContainer equalize>
                          <Button
                            data-test-id="revoke-button"
                            disabled={this._resendInviteStore.isPending}
                            onClick={() => this._cancelInviteStore.showCancelInviteWarning()}
                          >
                            {t("management:collaboratorDetails.invite.revoke")}
                          </Button>
                          <PrimaryButton
                            data-test-id="resend-button"
                            progress={this._resendInviteStore.isPending}
                            onClick={() => this._resendInvitation(collaborator, organization)}
                          >
                            {this._resendInviteStore.isPending
                              ? t("management:collaboratorDetails.invite.resending")
                              : t("management:collaboratorDetails.invite.resend")}
                          </PrimaryButton>
                        </ButtonContainer>
                        <MessageDialog
                          data-test-id="confirm-revoke-dialog"
                          title={t("management:collaboratorDetails.invite.confirm.title", { collaborator })}
                          message={t("management:collaboratorDetails.invite.confirm.message", { collaborator, organization })}
                          visible={this._cancelInviteStore.isCancelInviteWarningVisible}
                          onRequestClose={() => this._cancelInviteStore.hideCancelInviteWarning()}
                          buttonsArea={
                            <div className={dialogButtonClass}>
                              <Button
                                data-test-id="cancel-button"
                                disabled={this._cancelInviteStore.isPending}
                                onClick={() => this._cancelInviteStore.hideCancelInviteWarning()}
                              >
                                {t("button.dismiss")}
                              </Button>
                              <PrimaryButton
                                data-test-id="confirm-button"
                                progress={this._cancelInviteStore.isPending}
                                onClick={() => this._cancelInvitation(collaborator, organization)}
                              >
                                {this._cancelInviteStore.isPending
                                  ? t("management:collaboratorDetails.invite.confirm.revoking")
                                  : t("management:collaboratorDetails.invite.confirm.revoke")}
                              </PrimaryButton>
                            </div>
                          }
                        />
                      </RowCol>
                    ) : (
                      <Row>
                        <Col>
                          <LinkButton
                            data-test-id="remove-button"
                            danger
                            onClick={() => this._removeCollaboratorStore.showRemoveDialog(collaborator, organization)}
                          >
                            {t(`${leaveRemoveBaseKey}.action`)}
                          </LinkButton>

                          <MessageDialog
                            data-test-id="confirm-remove-dialog"
                            visible={this._removeCollaboratorStore.isRemoveConfirmationVisible}
                            onRequestClose={() => this._removeCollaboratorStore.hideConfirmationDialog()}
                            title={t(`${leaveRemoveBaseKey}.title`, { collaborator, organizationDisplayName })}
                            message={t(`${leaveRemoveBaseKey}.message`, { organizationDisplayName })}
                            buttonsArea={
                              <div className={dialogButtonClass}>
                                <Button
                                  disabled={this._removeCollaboratorStore.isPending}
                                  onClick={() => this._removeCollaboratorStore.hideConfirmationDialog()}
                                >
                                  {t("button.cancel")}
                                </Button>
                                <PrimaryButton
                                  data-test-id="confirm-button"
                                  progress={this._removeCollaboratorStore.isPending}
                                  color={Color.Red}
                                  onClick={() =>
                                    areCurrentUserDetails
                                      ? this._leaveOrganization(collaborator, organization)
                                      : this._removeCollaborator(collaborator, organization)
                                  }
                                >
                                  {this._removeCollaboratorStore.isPending
                                    ? t(`${leaveRemoveBaseKey}.button.pending`)
                                    : t(`${leaveRemoveBaseKey}.button.action`)}
                                </PrimaryButton>
                              </div>
                            }
                          />
                          <MessageDialog
                            visible={this._removeCollaboratorStore.isRemoveAdminMessageVisible}
                            onRequestClose={() => this._removeCollaboratorStore.hideAdminMessageDialog()}
                            title={t("management:collaboratorDetails.leave.cannotLeave.title")}
                            message={t("management:collaboratorDetails.leave.cannotLeave.message")}
                            buttonsArea={
                              <div className={dialogButtonClass}>
                                <PrimaryButton onClick={() => this._removeCollaboratorStore.hideAdminMessageDialog()}>
                                  {t("button.ok")}
                                </PrimaryButton>
                              </div>
                            }
                          />
                        </Col>
                      </Row>
                    )
                  ) : null}
                </Grid>
              </div>
              <PanelOutlet>{this.props.children}</PanelOutlet>
            </Page>
          );
        }

        private _changeCollaboratorRole(
          collaborator: ICollaborator,
          newRole: ICollaborator["role"],
          organization: IOrganization
        ): void {
          this._clearNotifications();
          if (collaborator.invitePending) {
            this._updateRoleStore.updatePendingInvite(collaborator, newRole, organization);
          } else {
            this._updateRoleStore.update(collaborator, newRole!, organization);
          }
        }

        private _removeCollaborator(collaborator: ICollaborator, organization: IOrganization): void {
          this._clearNotifications();
          this._removeCollaboratorStore.remove(collaborator, organization);
        }

        private _leaveOrganization(collaborator: ICollaborator, organization: IOrganization): void {
          this._clearNotifications();
          this._removeCollaboratorStore.leaveFromDetails(collaborator, organization);
        }

        private _cancelInvitation(collaborator: ICollaborator, organization: IOrganization): void {
          this._clearNotifications();
          this._cancelInviteStore.cancel(collaborator, organization);
        }

        private _resendInvitation(collaborator: ICollaborator, organization: IOrganization): void {
          this._clearNotifications();
          this._resendInviteStore.resend(collaborator, organization);
        }

        private _clearNotifications(): void {
          this._updateRoleStore.resetState();
          this._removeCollaboratorStore.resetState();
          this._cancelInviteStore.resetState();
          this._resendInviteStore.resetState();
        }

        private _renderNotifications(): JSX.Element {
          const notification =
            this._updateRoleStore.notification ||
            this._removeCollaboratorStore.notification ||
            this._cancelInviteStore.notification ||
            this._resendInviteStore.notification;

          return notification ? <PageNotification type={notification.type}>{notification.message}</PageNotification> : (null as any);
        }
      }
    )
  )
);
