import * as React from "react";
import { AppSpecificPasswordDialogStore, HelpLinkAppSpecificPassword } from "./app-specific-password-dialog-store";
import { ExternalCredentialDialog } from "../external-credential-dialog";
import { IconName, Input, Paragraph, Size, Space, TextColor } from "@root/shared";
import { observer } from "mobx-react";
import { withTranslation, WithTranslation } from "react-i18next";
import { ExternalCredential } from "@root/data/shell/models/external-credential";

const css = require("./app-specific-password-dialog.scss");

export interface AppSpecificPasswordDialogProps extends WithTranslation {
  existingCredential: ExternalCredential;
  onSuccess(): void;
  onCancel(): void;
  isVisible: boolean;
  [key: string]: any;
}

export const AppSpecificPasswordDialog = withTranslation("common")(
  observer(
    class AppSpecificPasswordDialog extends React.Component<AppSpecificPasswordDialogProps, {}> {
      public static defaultProps = { styles: css };
      private appSpecificPasswordDialogStore: AppSpecificPasswordDialogStore;

      constructor(props: AppSpecificPasswordDialogProps) {
        super(props);
        this.appSpecificPasswordDialogStore = new AppSpecificPasswordDialogStore();
      }

      public UNSAFE_componentWillReceiveProps(nextProps: AppSpecificPasswordDialogProps) {
        if (nextProps.isVisible && nextProps.existingCredential) {
          this.appSpecificPasswordDialogStore.setExistingCredential(nextProps.existingCredential);
        }
      }

      public render() {
        const {
          isSubmitting,
          allowedToComplete,
          onAppSpecificPasswordChanged,
          updateAppSpecificPassword,
          appSpecificPassword,
          submitErrorMessage,
        } = this.appSpecificPasswordDialogStore;
        const { t, isVisible, onSuccess, onCancel, styles, existingCredential, ...passthrough } = this.props;
        return (
          <ExternalCredentialDialog
            visible={isVisible}
            loading={false}
            title={t("externalCredentialDialog.appSpecificPasswordDialog.dialogTitle")}
            description={t("externalCredentialDialog.appSpecificPasswordDialog.dialogDescription")}
            confirmButton={t("button.update")}
            cancelButton={t("button.cancel")}
            iconName={IconName.AppleIcon}
            progress={isSubmitting}
            confirmDisabled={!allowedToComplete}
            onConfirm={updateAppSpecificPassword}
            onSuccess={onSuccess}
            onCancel={this.onCancel}
            {...passthrough}
            data-test-id="app-specific-password-dialog"
          >
            <div className={styles.inputContainer}>
              <Input
                data-test-class="app-specific-password-input"
                type="password"
                placeholder={t("externalCredentialDialog.appSpecificPasswordDialog.inputPasswordPlaceHolderText")}
                onChange={onAppSpecificPasswordChanged}
                value={appSpecificPassword}
              />
              {!!submitErrorMessage ? (
                <Paragraph
                  data-test-id="app-specific-password-dialog-error-text"
                  size={Size.Small}
                  spaceAbove={Space.XXSmall}
                  color={TextColor.Error}
                  aria-live="polite"
                >
                  {t(submitErrorMessage)}
                </Paragraph>
              ) : (
                <Paragraph className={styles.helpLink} size={Size.Medium} color={TextColor.Secondary}>
                  <a color={TextColor.Secondary} href={HelpLinkAppSpecificPassword} target="_blank">
                    {" "}
                    {t("externalCredentialDialog.appSpecificPasswordDialog.appSpecificPasswordHelpLink")}{" "}
                  </a>
                </Paragraph>
              )}
            </div>
          </ExternalCredentialDialog>
        );
      }

      private onCancel = () => {
        const { onCancel } = this.props;
        const { resetDialog } = this.appSpecificPasswordDialogStore;
        resetDialog();
        onCancel();
      };
    }
  )
);
