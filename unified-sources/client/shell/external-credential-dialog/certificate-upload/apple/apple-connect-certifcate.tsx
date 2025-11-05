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
} from "@root/shared";

const styles = require("../certificate-upload.scss");

export interface CertificateUploadProps {
  handler: IDragDropUploadHandlerStore;
  appleConnectKeyHandler: any;
}

export const AppleConnectCertficate = withTranslation("common")(
  class AppleConnectCertficate extends React.Component<CertificateUploadProps & WithTranslation, {}> {
    public render() {
      const { handler, appleConnectKeyHandler, t } = this.props;

      return (
        <div className={styles.certificateUpload}>
          <div className={styles.connectApiContainer}>
            <DragDropUpload
              title={t("certificateUpload.appleConnectKeyLabel")}
              subtitle={t("certificateUpload.uploadP8File")}
              icon={IconName.CsrFile}
              handler={handler}
              variant={DragDropUploadVariant.Inset}
              accept=".p8"
              isAppleConnect={true}
            />
            <Input
              className={styles.inputBox}
              data-test-id="apple-api-key-alias-input"
              aria-label={t("key name")}
              size={InputSize.Large}
              type="text"
              value={appleConnectKeyHandler.keyAlias}
              placeholder={"Key Name"}
              onChange={appleConnectKeyHandler.setKeyAlias}
            />
            <Paragraph className={styles.hint} color={TextColor.Hint} size={Size.Small}>
              <Trans i18nKey="certificateUpload.keyNameHint" />
            </Paragraph>
            <Input
              className={styles.inputBox}
              data-test-id="apple-issuer-id-input"
              aria-label={t("issuer id")}
              size={InputSize.Large}
              type="text"
              value={appleConnectKeyHandler.issuerId}
              placeholder={t("Issuer ID")}
              onChange={appleConnectKeyHandler.setIssuerId}
            />
            <Input
              className={styles.inputBox}
              data-test-id="apple-api-key-input"
              aria-label={t("api key")}
              size={InputSize.Large}
              type="text"
              value={appleConnectKeyHandler.apiKey}
              placeholder={t("Key ID")}
              onChange={appleConnectKeyHandler.setApiKey}
            />
            <Paragraph className={styles.tip} color={TextColor.Secondary} size={Size.Medium}>
              <Trans i18nKey="certificateUpload.generateP8Instructions">
                <a
                  href="https://developer.apple.com/documentation/appstoreconnectapi/creating_api_keys_for_app_store_connect_api"
                  target="_blank"
                >
                  link
                </a>
              </Trans>
            </Paragraph>
          </div>
        </div>
      );
    }
  }
);
