import * as React from "react";
import {
  Page,
  Panelify,
  PanelInjectedProps,
  PanelOutlet,
  Table,
  SummaryCell,
  TextCell,
  Row,
  Column,
  PrimaryButton,
  RowHeight,
  OrganizationIcon,
  Button,
  IconName,
  ButtonSize,
  Color,
  ButtonContainer,
  Cell,
  ListVirtualization,
  PageHeader,
  MessageBar,
  isMobileBrowser,
} from "@root/shared";
import { Grid, RowCol } from "@root/shared/grid";
import { NotificationType, IOrganization } from "@lib/common-interfaces";
import { observer } from "mobx-react";
import { capitalize } from "lodash";
import { userStore, layoutStore } from "@root/stores";
import { MessageDialog } from "../../shared/message-dialog/message-dialog";
import { invitationStore } from "@root/data/management/stores/invitation-store";
import { OrganizationsUIStore } from "./organizations-ui-store";
import { withTranslation, WithTranslation, Trans } from "react-i18next";
import { ICollaborator } from "@root/data/management";
import { Invitation } from "@root/data/management/models/invitation";

const styles = require("./organizations.scss");
const noOrgsImg = require("../../orgs/images/no-apps.svg");

export interface OrganizationsProps extends PanelInjectedProps {
  // Nothing to add here yet.
}

export const Organizations = Panelify(
  withTranslation(["common", "management"])(
    observer(
      class Organizations extends React.Component<OrganizationsProps & WithTranslation, {}> {
        private organizationsUiStore = new OrganizationsUIStore();
        private _columns: Column[] = [
          {
            title: "Name",
            width: 0.55,
          },
          {
            title: "Role",
            width: 0.2,
          },
          {
            title: "Collaborators",
            width: 0.15,
          },
          {
            title: "Actions",
            width: 0.1,
          },
        ];

        public UNSAFE_componentWillMount() {
          invitationStore.fetchCollection();
        }

        public render() {
          const { t } = this.props;
          const {
            allOrganizations,
            acceptedOrganizations,
            removeCollaboratorStore,
            organizationToLeave,
            leaveOrganization,
            showOrganizations,
          } = this.organizationsUiStore;
          const currentUser = userStore.currentUser;

          return (
            <Page
              data-test-id="organizations"
              supportsMobile={isMobileBrowser}
              header={<PageHeader title={t("management:userOrgSettings.title")} />}
            >
              <Grid>
                {this._renderNotifications()}
                <RowCol>
                  {showOrganizations ? (
                    <div>
                      <Table
                        title={t("management:userOrgSettings.title")}
                        titleAriaHidden={false}
                        columns={this._columns}
                        toolbar={
                          layoutStore.isMobile && isMobileBrowser ? (
                            <PrimaryButton
                              size={ButtonSize.Small}
                              to="/settings/organizations/create"
                              data-test-id="new-organization-button"
                              icon={IconName.Add}
                              aria-label={t("management:org.new")}
                            />
                          ) : (
                            <PrimaryButton
                              size={ButtonSize.Small}
                              to="/settings/organizations/create"
                              data-test-id="new-organization-button"
                            >
                              {t("management:org.new")}
                            </PrimaryButton>
                          )
                        }
                        eventualRowCount={allOrganizations.length || 4}
                        data={allOrganizations}
                        virtualize={ListVirtualization.Never}
                        rowHeight={RowHeight.MultiLine}
                        renderRow={(o, props, rowInfo) => {
                          const isFromOrganizationInvitesArray = rowInfo.index >= acceptedOrganizations.length;
                          const isInvitedOrganization = isFromOrganizationInvitesArray;
                          const invitation = isInvitedOrganization
                            ? invitationStore.resources[rowInfo.index - acceptedOrganizations.length]
                            : undefined;
                          return (
                            <Row
                              {...props}
                              data-test-class="organization"
                              to={!isInvitedOrganization ? `/orgs/${o?.name}` : undefined}
                            >
                              <SummaryCell
                                title={o?.display_name}
                                titleClassName={styles.summaryTitle}
                                data-test-id="organization-name"
                                icon={<OrganizationIcon organization={o} size={30} />}
                              >
                                {layoutStore.isMobile ? this.renderActions(isInvitedOrganization, invitation, currentUser, o) : null}
                              </SummaryCell>
                              <TextCell>{capitalize(o?.collaborator_role)}</TextCell>
                              <TextCell>{o?.collaborators_count}</TextCell>
                              <Cell className={styles.actions}>
                                {this.renderActions(isInvitedOrganization, invitation, currentUser, o)}
                              </Cell>
                            </Row>
                          );
                        }}
                        renderPlaceholderRow={(props) => {
                          return (
                            <Row {...props}>
                              <SummaryCell skeleton title="title" subtitle="subtitle" icon={IconName.Default} />
                              <TextCell skeleton />
                              <TextCell skeleton />
                              <TextCell skeleton />
                              <TextCell skeleton />
                              <TextCell skeleton />
                            </Row>
                          );
                        }}
                      />
                      <MessageDialog
                        data-test-id="confirm-leave-dialog"
                        visible={removeCollaboratorStore.isRemoveConfirmationVisible}
                        onRequestClose={() => removeCollaboratorStore.hideConfirmationDialog()}
                        title={`Leave ${organizationToLeave && organizationToLeave.display_name} organization?`}
                        message={`You will no longer have access to ${
                          organizationToLeave && organizationToLeave.display_name
                        } and all of its apps.`}
                        buttonsArea={
                          <div className={styles["button-group"]}>
                            <Button
                              data-test-id="cancel-button"
                              disabled={removeCollaboratorStore.isPending}
                              onClick={() => removeCollaboratorStore.hideConfirmationDialog()}
                            >
                              Cancel
                            </Button>
                            <PrimaryButton
                              data-test-id="confirm-button"
                              progress={removeCollaboratorStore.isPending}
                              color={Color.Red}
                              onClick={(e) => leaveOrganization(currentUser)}
                            >
                              {removeCollaboratorStore.isPending ? "Leaving" : "Leave"}
                            </PrimaryButton>
                          </div>
                        }
                      />
                    </div>
                  ) : (
                    <div className={styles["no-orgs-wrapper"]}>
                      <img alt="" role="presentation" src={noOrgsImg} />
                      <div className={styles.message}>Nothing to see here.</div>
                      <div className={styles["sub-message"]}>It looks like you're not a member of any organizations yet.</div>
                    </div>
                  )}
                </RowCol>
                <PanelOutlet>{this.props.children}</PanelOutlet>
              </Grid>
            </Page>
          );
        }

        private renderActions(
          isInvitedOrganization: boolean,
          invitation: Invitation | undefined,
          currentUser: ICollaborator,
          o: IOrganization | undefined
        ) {
          const { t } = this.props;
          const { declineInvite, acceptInvite, onLeaveOrganization } = this.organizationsUiStore;
          if (isInvitedOrganization && invitation) {
            return (
              <ButtonContainer>
                <Button size={ButtonSize.Small} onClick={(e) => declineInvite(e, invitation)}>
                  {t("common:button.decline")}
                </Button>
                <PrimaryButton size={ButtonSize.Small} onClick={(e) => acceptInvite(e, invitation)}>
                  {t("common:button.accept")}
                </PrimaryButton>
              </ButtonContainer>
            );
          } else {
            return (
              <Button
                aria-label={`${t("common:button.leave")} ${o?.name || ""}`}
                data-test-id={`${o?.name}-leave-button`}
                size={ButtonSize.Small}
                onClick={(e) => onLeaveOrganization(e, currentUser, o!)}
              >
                {t("common:button.leave")}
              </Button>
            );
          }
        }

        private _renderNotifications(): JSX.Element | undefined {
          const { removeCollaboratorStore, inviteError } = this.organizationsUiStore;

          // We know this will only be returning error notifications from the collaborator store
          if (removeCollaboratorStore.notification && removeCollaboratorStore.notification.type !== NotificationType.Success) {
            return (
              <RowCol>
                <MessageBar type={removeCollaboratorStore.notification.type}>
                  {removeCollaboratorStore.notification.message}
                </MessageBar>
              </RowCol>
            );
          } else if (inviteError) {
            return (
              <RowCol>
                <MessageBar type={NotificationType.Error}>
                  <Trans i18nKey={inviteError}>
                    <a href={window.location.href}></a>
                  </Trans>
                </MessageBar>
              </RowCol>
            );
          }

          return undefined;
        }
      }
    )
  )
);
