import * as React from "react";
import { RouteComponentProps } from "react-router";
import {
  Page,
  TopBar,
  Panelify,
  PanelInjectedProps,
  PanelOutlet,
  PanelPosition,
  Table,
  Row,
  TextCell,
  Column,
  SummaryCell,
  RowHeight,
  Gravatar,
  IconName,
  Formsy,
  PageNotification,
  InputVariant,
  InvitedUserIcon,
  OrganizationIcon,
  RowCol,
  Grid,
  UserInitialsAvatar,
} from "@root/shared";
import { reaction } from "mobx";
import { observer } from "mobx-react";
import { trim } from "lodash";
import { getCollaboratorsStore } from "../../../stores/people/collaborators/collaborators-store";
import { InviteCollaboratorStore } from "../../../stores/people/collaborators/invite-collaborator-store";
import { userStore } from "@root/stores";
import { ICollaborator } from "../../../constants/constants";
import { withTranslation, WithTranslation } from "react-i18next";

const classNames = require("classnames");
const styles = require("./collaborators.scss");
const errorImg = require("../../../../shared/assets/images/astronomer.svg");

type CollaboratorsProps = PanelInjectedProps & RouteComponentProps<any, any> & WithTranslation;

export const Collaborators = Panelify(
  withTranslation(["common", "management"])(
    observer(
      class Collaborators extends React.Component<CollaboratorsProps, {}> {
        private columns: Column[] = [
          {
            title: this.props.t("access.name"),
            width: 0.7,
          },
          {
            title: this.props.t("access.role"),
            width: 0.3,
          },
        ];
        private _emailInput: any;
        private _inviteCollaboratorsStore: InviteCollaboratorStore;

        // mobx reactions
        private _inviteSuccessDisposer: any;

        constructor(props) {
          super(props);
          const { org_name } = this.props.params;
          this._inviteCollaboratorsStore = new InviteCollaboratorStore(org_name);

          this._inviteSuccessDisposer = reaction(
            () => this._inviteCollaboratorsStore.isLoaded,
            (isLoaded) => {
              if (isLoaded && this._emailInput) {
                this._emailInput.resetValue();
              }
            }
          );
        }

        public UNSAFE_componentWillMount() {
          const { org_name } = this.props.params;
          getCollaboratorsStore(org_name).fetch();
        }

        public UNSAFE_componentWillReceiveProps(nextProps: CollaboratorsProps) {
          const { panelPosition } = nextProps;

          // Clear notifications if we're not the primary panel.
          if (panelPosition !== PanelPosition.Primary) {
            this._clearNotifications();
          }
        }

        public componentWillUnmount() {
          this._inviteSuccessDisposer();
        }

        public render() {
          const { params, panelPosition, t } = this.props;
          const { username, org_name } = params;
          const collaboratorsStore = getCollaboratorsStore(org_name);
          const { collaborators } = collaboratorsStore;
          const topBarSubtitle =
            collaborators && collaborators.length > 0
              ? `${collaborators.length} collaborator${collaborators.length > 1 ? "s" : ""}`
              : "Loading ...";

          const currentUserCollaborator = collaboratorsStore.findCollaboratorByName(userStore.currentUser.name);
          const canInvite = panelPosition === PanelPosition.Primary && collaboratorsStore.isAdmin(currentUserCollaborator);
          const inviteClassName = classNames(styles.invite, { [styles.hidden]: !canInvite });

          return (
            <Page data-test-id="collaborators-page">
              <TopBar
                loading={this._inviteCollaboratorsStore.isPending}
                title={t("access.collaborator", { count: 0 })}
                subtitle={panelPosition === PanelPosition.Secondary ? topBarSubtitle : null}
                closeButton={false}
              />
              {this._renderNotifications()}
              <Grid>
                <RowCol>
                  <div className={inviteClassName}>
                    <Formsy.Form>
                      <Formsy.Input
                        data-test-id="collaborators-email-input"
                        variant={InputVariant.Card}
                        ref={(ref: any) => {
                          this._emailInput = ref;
                        }}
                        name="invite_email"
                        type="text"
                        placeholder={t("management:common.collaborators.invite")}
                        autoCorrect="none"
                        autoCapitalize="none"
                        autoComplete="off"
                        spellCheck="false"
                        onKeyDown={(event: React.KeyboardEvent<HTMLInputElement>) => this._inviteUser(event)}
                        icon={IconName.EmailAdd}
                        validations={{
                          isEmail: true,
                          isInvited: (values: any, value: any) => {
                            const user = collaboratorsStore.findCollaboratorByEmail(trim(value));
                            return user ? `${user.display_name || user.email} has already been invited to this organization.` : true;
                          },
                        }}
                        validationErrors={{
                          isEmail: "Please enter a valid email address.",
                        }}
                      />
                    </Formsy.Form>
                  </div>
                  <Table
                    title={this.props.t("access.collaborator", { count: 0 })}
                    data-test-class="collaborators"
                    columns={this.columns}
                    eventualRowCount={collaborators.length || 4}
                    activeRow={(i) => i.name === username}
                    data={collaborators}
                    rowHeight={RowHeight.MultiLine}
                    renderRow={(item: ICollaborator, props) => {
                      const subtitle = item.invitePending ? "Invited" : item.email;
                      const icon = this.getIcon(item);

                      return (
                        <Row
                          {...props}
                          className={props.active ? styles["icon-wrapper-active-fix"] : styles["icon-wrapper-fix"]}
                          to={item.isTenant ? undefined : `/orgs/${org_name}/people/collaborators/${item.name}`}
                        >
                          <SummaryCell title={item.display_name} subtitle={subtitle} icon={icon} />
                          <TextCell.Observer>{() => t(`org.role.${item["role"] || "collaborator"}`)}</TextCell.Observer>
                        </Row>
                      );
                    }}
                    renderPlaceholderRow={(props) => {
                      return (
                        <Row {...props}>
                          <SummaryCell skeleton title="title" subtitle="subtitle" icon={IconName.Default} />
                          <TextCell skeleton />
                        </Row>
                      );
                    }}
                    error={
                      collaboratorsStore.isFailed ? (
                        <div className={styles["error-wrapper"]}>
                          <img alt="" role="presentation" src={errorImg} />
                          <div>We’re having trouble finding your collaborators.</div>
                        </div>
                      ) : null
                    }
                  />
                </RowCol>
              </Grid>
              <PanelOutlet>{this.props.children}</PanelOutlet>
            </Page>
          );
        }

        private getIcon(user: ICollaborator) {
          if (user.isTenant) {
            return <OrganizationIcon organization={user} size={30} />;
          }
          return user.invitePending ? (
            <InvitedUserIcon size={30} />
          ) : (
            <Gravatar
              email={user.email}
              size={30}
              fallback={
                user.display_name ? (
                  <UserInitialsAvatar initialsName={user.display_name} size={30} />
                ) : user.name ? (
                  <UserInitialsAvatar initialsName={user.name} size={30} />
                ) : undefined
              }
            />
          );
        }

        /**
         * Invites a user to the organization.
         */
        private _inviteUser(event: React.KeyboardEvent<HTMLInputElement>): void {
          if (event.which === 13 /* Enter */) {
            event.preventDefault();
            this._inviteCollaboratorsStore.resetState();

            const email = trim((event.target as HTMLInputElement).value);
            if (!email) {
              return;
            }

            this._emailInput.context.validate(this._emailInput);
            // Only invite if its a valid value.
            if (this._emailInput.isValidValue(email)) {
              this._inviteCollaboratorsStore.invite(email);
            }
          }
        }

        /**
         * Clears all notifications on the page.
         */
        private _clearNotifications(): void {
          this._inviteCollaboratorsStore.resetState();
        }

        /**
         * Renders the notifications for the page.
         */
        private _renderNotifications(): JSX.Element | undefined {
          if (this._inviteCollaboratorsStore.notification) {
            return (
              <PageNotification type={this._inviteCollaboratorsStore.notification.type}>
                {this._inviteCollaboratorsStore.notification.message}
              </PageNotification>
            );
          }
        }
      }
    )
  )
);
