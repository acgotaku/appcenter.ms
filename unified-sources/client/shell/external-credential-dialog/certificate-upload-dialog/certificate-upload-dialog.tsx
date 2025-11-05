import * as React from "react";
import { observer } from "mobx-react";
import { WithTranslation, withTranslation } from "react-i18next";
import { CertificateUploadDialogStore } from "./certificate-upload-dialog-store";
import { Size, TextColor, Text } from "@root/shared";
import { ExternalCredentialDialog } from "./../external-credential-dialog";
import { ExternalCredential } from "@root/data/shell/models/external-credential";
import { CertificateUpload } from "../certificate-upload/certificate-upload";

const css = require("./certificate-upload-dialog.scss");

export interface CertificateUploadDialogProps {
  onSuccess(credentials: ExternalCredential): void;
  onCancel(): void;
  isVisible: boolean;
  isReplace?: boolean;
  [key: string]: any;
  title?: string;
  description?: string;
  isAppleConnect?: boolean;
}

export const CertificateUploadDialog = withTranslation("common")(
  observer(
    class CertificateUploadDialog extends React.Component<CertificateUploadDialogProps & WithTranslation, {}> {
      public static defaultProps = {
        styles: css,
      };

      private certificateUploadDialogStore = new CertificateUploadDialogStore();

      public render() {
        const {
          t,
          className,
          styles,
          onSuccess,
          isVisible,
          onCancel,
          isReplace,
          title,
          description,
          isAppleConnect,
          ...props
        } = this.props;
        const {
          onPasswordChange,
          password,
          passwordState,
          apiKey,
          setApiKey,
          issuerId,
          setIssuerId,
          keyAlias,
          setKeyAlias,
        } = this.certificateUploadDialogStore.uploadHandler;

        const {
          isCreating,
          allowedToCreate,
          allowedToCreateAppleConnect,
          uploadCertificate,
          uploadAppleConnectKeys,
          errorMessage,
          uploadHandler,
        } = this.certificateUploadDialogStore;

        const appleConnectKeyHandler = {
          apiKey: apiKey,
          issuerId: issuerId,
          keyAlias: keyAlias,
          setApiKey: setApiKey,
          setIssuerId: setIssuerId,
          setKeyAlias: setKeyAlias,
        };

        return (
          <ExternalCredentialDialog
            visible={isVisible}
            title={title || (isReplace ? t("certificateUploadDialog.replaceTitle") : t("certificateUploadDialog.dialogTitle"))}
            description={description || (isReplace ? "" : t("certificateUploadDialog.dialogDescription"))}
            confirmButton={t("button.done")}
            cancelButton={t("button.cancel")}
            progress={isCreating}
            confirmDisabled={isAppleConnect ? !allowedToCreateAppleConnect : !allowedToCreate}
            onConfirm={isAppleConnect ? uploadAppleConnectKeys : uploadCertificate}
            onCancel={this.onCancel}
            onSuccess={onSuccess}
            {...props}
            data-test-id="certificate-upload-dialog"
          >
            <div className={styles.certContainer}>
              <CertificateUpload
                handler={uploadHandler}
                password={password!}
                onPasswordChange={onPasswordChange}
                passwordState={passwordState}
                appleConnectKeyHandler={isAppleConnect ? appleConnectKeyHandler : null}
              />
            </div>
            {errorMessage ? (
              <Text className={styles.errorMessage} color={TextColor.Error} size={Size.Medium}>
                {errorMessage}
              </Text>
            ) : null}
          </ExternalCredentialDialog>
        );
      }

      private onCancel = () => {
        const { onCancel } = this.props;
        const { resetDialog } = this.certificateUploadDialogStore;
        resetDialog();
        onCancel();
      };
    }
  )
);
