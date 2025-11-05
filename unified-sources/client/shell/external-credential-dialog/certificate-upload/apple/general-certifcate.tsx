import * as React from "react";
import { WithTranslation, withTranslation, Trans } from "react-i18next";

import {
  IconName,
  Paragraph,
  Size,
  TextColor,
  DragDropUpload,
  DragDropUploadVariant,
  Input,
  InputSize,
  IDragDropUploadHandlerStore,
  Color,
  Icon,
  Space,
  IconSize,
} from "@root/shared";
import { PasswordState } from "../certificate-upload-handler";

const styles = require("../certificate-upload.scss");

export interface CertificateUploadProps {
  handler: IDragDropUploadHandlerStore;
  passwordState?: PasswordState;
  password: string;
  onPasswordChange?: React.ChangeEventHandler<HTMLInputElement>;
}

export const GeneralCertificate = withTranslation("common")(
  class GeneralCertificate extends React.Component<CertificateUploadProps & WithTranslation, {}> {
    public render() {
      const { handler, onPasswordChange, passwordState, password, t } = this.props;

      const iconProps = (() => {
        switch (passwordState) {
          case PasswordState.Valid:
            return {
              "aria-label": t("certificateUpload.password.valid"),
              icon: IconName.StatusPassed,
              color: Color.Green,
            };

          case PasswordState.Invalid:
            return {
              "aria-label": t("certificateUpload.password.wrong"),
              icon: IconName.StatusFailed,
              color: Color.Red,
            };

          case PasswordState.Validating:
            return {
              "aria-label": t("certificateUpload.password.checking"),
              icon: IconName.StatusRunning,
              color: Color.Blue,
            };
        }
      })();

      return (
        <div className={styles.certificateUpload}>
          <DragDropUpload
            title={t("certificateUpload.certificateLabel")}
            subtitle={t("certificateUpload.uploadP12File")}
            icon={IconName.CsrFile}
            handler={handler}
            variant={DragDropUploadVariant.Inset}
            accept=".p12"
          >
            <Input
              autoFocus
              data-test-id="certificate-password-input"
              invalid={passwordState === PasswordState.Invalid}
              aria-label={t("certificateUpload.certificatePassword")}
              size={InputSize.Small}
              type="password"
              value={password}
              placeholder={t("certificateUpload.certificatePassword")}
              onChange={onPasswordChange}
            />
            {passwordState != null ? <Icon className={styles.statusIcon} {...iconProps} size={IconSize.Small} /> : null}
            {passwordState === PasswordState.Invalid ? (
              <Paragraph size={Size.Small} spaceAbove={Space.XXSmall} color={TextColor.Error} aria-live="polite">
                {t("certificateUpload.invalidPasswordErrorMessage")}
              </Paragraph>
            ) : null}
          </DragDropUpload>
          <Paragraph className={styles.tip} color={TextColor.Secondary} size={Size.Medium}>
            <Trans i18nKey="certificateUpload.generateP12Instructions">
              <a
                href="https://docs.microsoft.com/en-us/mobile-center/distribution/auto-provisioning-feature#generating-a-p12-file"
                target="_blank"
              >
                link
              </a>
            </Trans>
          </Paragraph>
        </div>
      );
    }
  }
);
