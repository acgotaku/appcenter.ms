import * as React from "react";
import { observer } from "mobx-react";
import { WithTranslation, withTranslation } from "react-i18next";
import { Paragraph, Size, TextColor, IconName, DragDropUpload, DragDropUploadVariant } from "@root/shared";
import { GoogleConnectionDialogStore } from "./google-connection-dialog-store";
import { ExternalCredentialDialog } from "../external-credential-dialog";
import { ExternalCredential } from "@root/data/shell/models/external-credential";

const css = require("./google-connection-dialog.scss");

export interface GoogleConnectionDialogProps {
  onSuccess(credentials: ExternalCredential): void;
  onCancel(): void;
  isVisible: boolean;
  [key: string]: any;
}

export const GoogleConnectionDialog = withTranslation("common")(
  observer(
    class GoogleConnectionDialog extends React.Component<GoogleConnectionDialogProps & WithTranslation, {}> {
      public static defaultProps = {
        styles: css,
      };

      private googleConnectionDialogStore = new GoogleConnectionDialogStore();

      public render() {
        const { t, className, styles, onSuccess, isVisible, onCancel, ...props } = this.props;
        const {
          isCreating,
          allowedToCreate,
          jsonHandler,
          onDocsLinkClick,
          createGoogleConnection,
          LearnMoreAboutGooglePlayURL,
        } = this.googleConnectionDialogStore;
        return (
          <ExternalCredentialDialog
            visible={isVisible}
            title={t("externalCredentialDialog.google.dialogTitle")}
            description={t("externalCredentialDialog.google.dialogDescription")}
            confirmButton={t("button.add")}
            cancelButton={t("button.cancel")}
            iconName={IconName.GooglePlay}
            progress={isCreating}
            confirmDisabled={!allowedToCreate}
            onConfirm={createGoogleConnection}
            onSuccess={onSuccess}
            onCancel={this.onCancel}
            {...props}
          >
            <div className={styles.dialogBody}>
              <DragDropUpload
                title={t("externalCredentialDialog.google.uploadTitle")}
                subtitle={t("externalCredentialDialog.google.uploadSubtitle")}
                icon={IconName.JsonFile}
                variant={DragDropUploadVariant.Inset}
                handler={jsonHandler}
              />
              <Paragraph size={Size.Medium} color={TextColor.Secondary}>
                <a color={TextColor.Secondary} href={LearnMoreAboutGooglePlayURL} target="_blank" onClick={onDocsLinkClick}>
                  {" "}
                  {t("externalCredentialDialog.google.whereToFindJson")}{" "}
                </a>
              </Paragraph>
            </div>
          </ExternalCredentialDialog>
        );
      }

      private onCancel = () => {
        const { onCancel } = this.props;
        const { resetDialog } = this.googleConnectionDialogStore;
        resetDialog();
        onCancel();
      };
    }
  )
);
