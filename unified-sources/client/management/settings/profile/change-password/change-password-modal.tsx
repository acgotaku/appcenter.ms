import * as React from "react";
import { Modalify, PageHeader, Page, Formsy, FooterArea, ButtonContainer, PrimaryButton } from "@root/shared";
import { Grid, RowCol } from "@root/shared/grid";
import { observer } from "mobx-react";
import { withTranslation, WithTranslation } from "react-i18next";
import { ChangePasswordUIStore } from "./change-password-ui-store";
import { layoutStore } from "@root/stores";

export const ChangePasswordModal = Modalify(
  withTranslation(["common", "management"])(
    observer(
      class ChangePasswordModal extends React.Component<WithTranslation, {}> {
        private uiStore: ChangePasswordUIStore;
        constructor(props) {
          super(props);
          this.uiStore = new ChangePasswordUIStore();
        }

        render() {
          const { submitPasswordChanged, extraValidationErrors, setOldPassword, setNewPassword, isChanging } = this.uiStore;
          const { isMobile } = layoutStore;
          const containerProps = isMobile ? { equalize: true, fullWidth: true } : {};
          return (
            <Page
              data-test-id="user-settings-password"
              supportsMobile
              header={<PageHeader title={"Change Password"} />}
              footer={
                <FooterArea alignRight={!isMobile}>
                  <ButtonContainer {...containerProps}>
                    <PrimaryButton
                      data-test-id={"change-password"}
                      type={"submit"}
                      progress={isChanging}
                      form={"change-password-form"}
                    >
                      Change password
                    </PrimaryButton>
                  </ButtonContainer>
                </FooterArea>
              }
            >
              <Formsy.Form
                key="passwordChange"
                onValidSubmit={submitPasswordChanged}
                validationErrors={extraValidationErrors}
                id="change-password-form"
              >
                <Grid>
                  <RowCol width={12}>
                    <Formsy.Input
                      type="password"
                      id="oldPassword"
                      data-test-id="old-password"
                      name="oldPassword"
                      label="Current password:"
                      isRequired
                      onChange={setOldPassword}
                      requiredError="Current password cannot be empty"
                      disabled={isChanging}
                    />
                  </RowCol>
                  <RowCol width={12}>
                    <Formsy.PasswordInput
                      id="newPassword"
                      data-test-id="new-password"
                      type="password"
                      name="newPassword"
                      label="New password:"
                      oldPasswordFieldName="oldPassword"
                      isRequired
                      onChange={setNewPassword}
                      disabled={isChanging}
                    />
                  </RowCol>
                  <RowCol width={12}>
                    <Formsy.Input
                      id="verifyPassword"
                      data-test-id="verify-password"
                      type="password"
                      name="verifyPassword"
                      label="Confirm new password:"
                      validations="equalsField:newPassword"
                      validationError="Your two new passwords do not match"
                      disabled={isChanging}
                    />
                  </RowCol>
                </Grid>
              </Formsy.Form>
            </Page>
          );
        }
      }
    )
  )
);
