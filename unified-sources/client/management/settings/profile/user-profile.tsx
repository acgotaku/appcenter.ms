import * as React from "react";
import { withTranslation, WithTranslation } from "react-i18next";
import { observer } from "mobx-react";
import {
  /* tslint:disable */
  Formsy,
  /* tslint:enable */
  Panelify,
  Page,
  PrimaryButton,
  SecondaryButton,
  Dialog,
  NotificationType,
  PanelOutlet,
  LinkButton,
  PageHeader,
  MessageBar,
  Card,
  HeaderArea,
  InputSize,
} from "@root/shared";
import { userStore } from "@root/stores";
import { Grid, Row, Col, RowCol } from "@root/shared/grid";
import { VALIDATION_ERRORS, VALIDATIONS } from "../../../lib/formsy/validations";
import { VALIDATION_ERRORS as ManagementValidationErrors, VALIDATIONS as ManagementValidations } from "../../utils/formsy/validations";
import { UserProfileUIStore } from "./user-profile-ui-store";

const styles = require("./user-profile.scss");

const UpdateDetailsButton: React.FunctionComponent<{
  confirmUpdateProfile: () => void;
  cancelUpdateProfile: () => void;
  isPending: boolean;
  shouldShowUpdateUsernameConfirmDialog: boolean;
}> = ({ confirmUpdateProfile, cancelUpdateProfile, isPending, shouldShowUpdateUsernameConfirmDialog }) => (
  <div>
    <PrimaryButton type="submit" data-test-id="update-button" progress={isPending}>
      {isPending ? "Updating" : "Update"} details
    </PrimaryButton>
    <Dialog
      title="Do you really want to change your username?"
      data-test-id="username-change-dialog"
      className={styles["user-change-dialog"]}
      visible={shouldShowUpdateUsernameConfirmDialog}
      onRequestClose={cancelUpdateProfile}
    >
      <header role="heading" aria-level={3}>
        <h3>Do you really want to change your username?</h3>
      </header>
      <p>This will break all existing deep links to your apps and to data like analytics or crash reports.</p>
      <div className={styles["buttons"]}>
        <SecondaryButton data-test-id="cancel-button" onClick={cancelUpdateProfile}>
          Cancel
        </SecondaryButton>
        <PrimaryButton data-test-id="confirm-username-change" onClick={confirmUpdateProfile}>
          Change username
        </PrimaryButton>
      </div>
    </Dialog>
  </div>
);

const UsernameInput: React.FunctionComponent<{
  username: string;
  setUsername: (event: React.ChangeEvent<HTMLInputElement>) => void;
  usernameAvailable: boolean;
  checkUsernameExists: (username: string) => Promise<void>;
  isPending: boolean;
}> = ({ username, setUsername, usernameAvailable, checkUsernameExists, isPending }) => {
  const { currentUser } = userStore;
  return (
    <Row middle>
      <Col width={12}>
        <Formsy.InputWithAvailabilityCheck
          id="name"
          data-test-id="username"
          type="text"
          name="name"
          label="Username:"
          availabilityMessageName="Username"
          autoCorrect="none"
          autoCapitalize="none"
          autoComplete="off"
          spellCheck="false"
          isRequired
          disabled={isPending}
          requiredError="Username cannot be empty"
          available={usernameAvailable}
          onCheckAvailability={checkUsernameExists}
          validations={VALIDATIONS.USER_NAME}
          validationErrors={VALIDATION_ERRORS.USER_NAME}
          defaultValue={currentUser.name}
          value={username}
          onChange={setUsername}
        />
      </Col>
    </Row>
  );
};

export const UserProfile = Panelify(
  withTranslation(["common", "management"])(
    observer(
      class UserProfile extends React.Component<WithTranslation, {}> {
        private uiStore: UserProfileUIStore;

        constructor(props) {
          super(props);
          this.uiStore = new UserProfileUIStore();
        }

        public render() {
          const { currentUser: user } = userStore;
          const {
            canCloseAccount,
            openCloseAccountWizard,
            openChangePassword,
            editDisabled,
            isPending,
            email,
            setEmail,
            displayName,
            setDisplayName,
            username,
            setUsername,
            usernameAvailable,
            checkUsernameExists,
            updateProfile,
            errorMessage,
            confirmUpdateProfile,
            cancelUpdateProfile,
            shouldShowUpdateUsernameConfirmDialog,
          } = this.uiStore;

          return (
            <Page
              data-test-id="user-settings-profile"
              white
              constrainedWidth
              supportsMobile
              header={
                <PageHeader title="Profile">
                  {canCloseAccount ? (
                    <LinkButton danger onClick={openCloseAccountWizard}>
                      Close account
                    </LinkButton>
                  ) : null}
                </PageHeader>
              }
            >
              <>
                <Grid>
                  {errorMessage ? (
                    <RowCol>
                      <MessageBar type={NotificationType.Error}>{errorMessage}</MessageBar>
                    </RowCol>
                  ) : null}
                  <RowCol>
                    <Card header={<HeaderArea title={editDisabled ? "Info" : "Details"} />}>
                      <Formsy.Form key="userProfile" onValidSubmit={updateProfile}>
                        <Grid>
                          <RowCol width={12}>
                            <Formsy.Input
                              id="displayName"
                              data-test-id="display-name"
                              type="text"
                              name="displayName"
                              label="Name:"
                              disabled={editDisabled || isPending}
                              autoFocus={true}
                              autoCorrect="none"
                              autoCapitalize="none"
                              autoComplete="off"
                              spellCheck="false"
                              isRequired
                              requiredError="Name is required."
                              validations={ManagementValidations.USER_DISPLAY_NAME}
                              validationErrors={ManagementValidationErrors.USER_DISPLAY_NAME}
                              value={displayName}
                              onChange={setDisplayName}
                              size={InputSize.Large}
                            />
                          </RowCol>

                          {editDisabled ? null : (
                            <UsernameInput
                              username={username}
                              setUsername={setUsername}
                              usernameAvailable={usernameAvailable}
                              checkUsernameExists={checkUsernameExists}
                              isPending={isPending}
                            />
                          )}
                          <RowCol middle width={12}>
                            <Formsy.Input
                              id="email"
                              data-test-id="email"
                              label="Email address:"
                              type="text"
                              name="email"
                              disabled={editDisabled || isPending}
                              autoCorrect="none"
                              autoCapitalize="none"
                              autoComplete="off"
                              spellCheck="false"
                              placeholder="Email"
                              isRequired
                              validations="isEmail"
                              validationErrors={{
                                isEmail: "Email address is not valid.",
                              }}
                              requiredError="Email address is required."
                              value={email}
                              onChange={setEmail}
                            />
                          </RowCol>

                          <RowCol end>
                            <UpdateDetailsButton
                              confirmUpdateProfile={confirmUpdateProfile}
                              cancelUpdateProfile={cancelUpdateProfile}
                              isPending={isPending}
                              shouldShowUpdateUsernameConfirmDialog={shouldShowUpdateUsernameConfirmDialog}
                            />
                          </RowCol>
                        </Grid>
                      </Formsy.Form>
                    </Card>
                  </RowCol>
                  {editDisabled ? (
                    <RowCol>
                      <Card header={<HeaderArea title="Details" />}>
                        <Formsy.Form key="userProfileReducedEdit" onValidSubmit={updateProfile}>
                          <Grid>
                            <UsernameInput
                              username={username}
                              setUsername={setUsername}
                              usernameAvailable={usernameAvailable}
                              checkUsernameExists={checkUsernameExists}
                              isPending={isPending}
                            />
                            <RowCol end>
                              <UpdateDetailsButton
                                confirmUpdateProfile={confirmUpdateProfile}
                                cancelUpdateProfile={cancelUpdateProfile}
                                isPending={isPending}
                                shouldShowUpdateUsernameConfirmDialog={shouldShowUpdateUsernameConfirmDialog}
                              />
                            </RowCol>
                          </Grid>
                        </Formsy.Form>
                      </Card>
                    </RowCol>
                  ) : null}
                  {!editDisabled && user.can_change_password ? (
                    <RowCol>
                      <Card header={<HeaderArea title="Password" />}>
                        <SecondaryButton onClick={openChangePassword}>Change password</SecondaryButton>
                      </Card>
                    </RowCol>
                  ) : null}
                </Grid>
                <PanelOutlet>{this.props.children}</PanelOutlet>
              </>
            </Page>
          );
        }
      }
    )
  )
);
