import * as React from "react";
import { observer } from "mobx-react";
import { IconName, Input, TextColor, Size, Paragraph, Keys, Markdown, LiveRegion } from "@root/shared";
import { WithTranslation, withTranslation } from "react-i18next";
import { AppleConnectionDialogStore, HelpLinkNoTrustedDevices } from "./apple-connection-dialog-store";
import { ExternalCredentialDialog } from "../external-credential-dialog";
import { ExternalCredential } from "@root/data/shell/models/external-credential";
const classNames = require("classnames");

const css = require("./apple-connection-dialog.scss");

export interface AppleConnectionDialogProps extends WithTranslation {
  onSuccess(credentials: ExternalCredential | undefined): void;
  onCancel(): void;
  isVisible: boolean;
  enableTwoFactorAuth: boolean;
  existingCredential?: ExternalCredential;
  [key: string]: any;
}

export const AppleConnectionDialog = withTranslation("common")(
  observer(
    class AppleConnectionDialog extends React.Component<AppleConnectionDialogProps, {}> {
      public static defaultProps = { styles: css };
      private appleConnectionDialogStore: AppleConnectionDialogStore;
      private inputBoxRefs: (Input | null)[] = [];

      constructor(props: AppleConnectionDialogProps) {
        super(props);
        this.appleConnectionDialogStore = new AppleConnectionDialogStore();
      }

      public componentDidUpdate() {
        if (this.appleConnectionDialogStore.is2FA && this.appleConnectionDialogStore.isFirstTimeUpdate) {
          this.focusFirstInput();
          this.appleConnectionDialogStore.isFirstTimeUpdate = false;
        }
      }

      public UNSAFE_componentWillReceiveProps(nextProps: AppleConnectionDialogProps) {
        if (nextProps.isVisible && !this.props.isVisible && !!nextProps.existingCredential) {
          this.appleConnectionDialogStore.setExistingCredential(nextProps.existingCredential);
          this.appleConnectionDialogStore.verifyAppleAuthentication(nextProps.existingCredential.id);
        }
      }

      public render() {
        const {
          t,
          className,
          styles,
          onSuccess,
          isVisible,
          onCancel,
          enableTwoFactorAuth,
          existingCredential,
          ...passthrough
        } = this.props;
        const {
          isSubmitting,
          allowedToComplete,
          userName,
          password,
          onUsernameChanged,
          onPasswordChanged,
          twoFactorErrorMessage,
          credentialErrorMessage,
          isAuthenticationFailed,
          finishAppleConnection,
          is2FA,
          authCodeInputs,
          isWrongVerificationCode,
          isVerifying,
          hasNoAccessToConnection,
        } = this.appleConnectionDialogStore;
        const show2FA = enableTwoFactorAuth && is2FA;
        const hasExistingCredential = !!existingCredential;

        return (
          <ExternalCredentialDialog
            visible={isVisible}
            loading={isVerifying}
            title={
              show2FA
                ? t("externalCredentialDialog.apple.dialogTitle2FA")
                : hasExistingCredential
                ? t("externalCredentialDialog.apple.dialogTitleReconnect")
                : t("externalCredentialDialog.apple.dialogTitle")
            }
            description={
              show2FA
                ? t("externalCredentialDialog.apple.dialogDescription2FA")
                : hasExistingCredential
                ? ""
                : t("externalCredentialDialog.apple.dialogDescription")
            }
            confirmButton={is2FA ? null : hasExistingCredential ? t("button.connect") : t("button.add")}
            cancelButton={t("button.cancel")}
            iconName={IconName.AppleIcon}
            progress={isSubmitting}
            confirmDisabled={Boolean(!allowedToComplete || isSubmitting || hasNoAccessToConnection)}
            onConfirm={finishAppleConnection}
            onSuccess={onSuccess}
            onCancel={this.onCancel}
            {...passthrough}
            data-test-id="apple-connection-dialog"
          >
            <div>
              {show2FA ? (
                <div data-test-class="auth-code-inputs-container" className={styles.securityCodeInputsContainer}>
                  {authCodeInputs.map((value, index) => {
                    const id = `${index}`;
                    return (
                      <Input
                        data-test-class={`apple-connection-session-code-input-${id}`}
                        className={classNames(styles.securityCodeInput, { [styles.securityCodeInputExtraMargin]: index === 2 })}
                        aria-label={`Enter digit number ${index + 1} of the 6 digit verification code`}
                        key={id}
                        id={id}
                        maxLength={1}
                        type="text"
                        value={authCodeInputs[index]}
                        autoComplete="off"
                        onKeyDown={this.onSessionCodeKeyDown}
                        onChange={this.onSecurityCodeChanged}
                        disabled={isSubmitting}
                        invalid={isWrongVerificationCode}
                        ref={(ref) => (this.inputBoxRefs[index] = ref)}
                      ></Input>
                    );
                  })}
                  {twoFactorErrorMessage ? (
                    <div data-test-id="apple-connection-two-factor-error-text">
                      <Markdown className={styles.twoFactorErrorMessage}>{twoFactorErrorMessage}</Markdown>
                    </div>
                  ) : null}
                  {!twoFactorErrorMessage ? (
                    <Paragraph className={styles.helpLink} size={Size.Medium} color={TextColor.Secondary}>
                      <a color={TextColor.Secondary} href={HelpLinkNoTrustedDevices} target="_blank">
                        {" "}
                        {t("externalCredentialDialog.apple.twoFactorHelpLink")}{" "}
                      </a>
                    </Paragraph>
                  ) : null}
                </div>
              ) : (
                <div>
                  <div className={styles.credentialsContainer}>
                    <Input
                      label={t("externalCredentialDialog.apple.inputUserNamePlaceHolderText")}
                      data-test-class="apple-connection-username-input"
                      autoFocus
                      placeholder={t("externalCredentialDialog.apple.inputUserNamePlaceHolderText")}
                      onChange={onUsernameChanged}
                      value={userName}
                      disabled={hasExistingCredential}
                      invalid={isAuthenticationFailed}
                    />
                    <Input
                      label={t("externalCredentialDialog.apple.inputPasswordPlaceHolderText")}
                      data-test-class="apple-connection-password-input"
                      type="password"
                      placeholder={t("externalCredentialDialog.apple.inputPasswordPlaceHolderText")}
                      onChange={onPasswordChanged}
                      value={password}
                      disabled={hasNoAccessToConnection}
                      invalid={isAuthenticationFailed}
                    />
                  </div>
                  {credentialErrorMessage ? (
                    !is2FA ? (
                      <LiveRegion data-test-id="apple-connection-credentials-error-text" role="alert">
                        <Markdown className={styles.credentialErrorMessage}>{credentialErrorMessage}</Markdown>
                      </LiveRegion>
                    ) : enableTwoFactorAuth ? null : (
                      <LiveRegion data-test-id="apple-connection-credentials-error-text" role="alert">
                        <Markdown className={styles.credentialErrorMessage}>
                          {t("externalCredentialDialog.apple.twoFactorAuthUnsupported")}
                        </Markdown>
                      </LiveRegion>
                    )
                  ) : null}
                </div>
              )}
            </div>
          </ExternalCredentialDialog>
        );
      }

      public focusFirstInput() {
        if (this.inputBoxRefs[0]) {
          this.inputBoxRefs[0].focus();
        }
      }

      private onSecurityCodeChanged = (event: React.FormEvent<HTMLInputElement>) => {
        const { id, value } = event.currentTarget;
        const isValidInput = !isNaN(Number(value));
        const inputValue = isValidInput ? value : "";
        this.appleConnectionDialogStore.onSessionCodeChanged(id, inputValue, this.props.onSuccess);
        if (isValidInput) {
          const nextInputBoxId = (Number(id) + 1).toString();
          if (this.inputBoxRefs[nextInputBoxId]) {
            this.inputBoxRefs[nextInputBoxId].focus();
          }
        }
      };

      private onSessionCodeKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        const { id } = event.currentTarget;
        if (event.keyCode === Keys.Backspace) {
          const numId = Number(id);
          if (
            numId === this.appleConnectionDialogStore.authCodeInputs.length - 1 &&
            this.appleConnectionDialogStore.authCodeInputs[numId] !== ""
          ) {
            this.appleConnectionDialogStore.setAuthCode(numId, "");
          } else {
            const prevInputBoxId = numId - 1;
            if (this.inputBoxRefs[prevInputBoxId]) {
              this.inputBoxRefs[prevInputBoxId]!.focus();
              this.appleConnectionDialogStore.setAuthCode(prevInputBoxId, "");
            }
          }
        }
      };

      private onCancel = () => {
        const { onCancel } = this.props;
        const { resetAppleDialog } = this.appleConnectionDialogStore;
        resetAppleDialog();
        onCancel();
      };
    }
  )
);
