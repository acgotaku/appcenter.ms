import * as React from "react";
import { Select, Option, Text, MediaObject, Icon, IconSize, IconName, Space, Size, TextColor, Action, ActionText } from "@root/shared";
import { ExternalCredential } from "@root/data/shell/models";
import { withTranslation, WithTranslation, Trans } from "react-i18next";
const styles = require("./credential-dropdown.scss");

export interface CredentialDropdownProps extends WithTranslation {
  onAdd: () => void;
  credentials: ExternalCredential[];
  onChange: (credential: ExternalCredential) => void;
  selectedCredential: ExternalCredential;
  placeholder: string;
  addLabel?: string;
  onFixCredentialClick?: (credential: ExternalCredential) => void;
  error?: boolean;
  hideInnerErrorMessage?: boolean;
}

export const CredentialDropdown = withTranslation(["common", "distribute"])(
  class CredentialDropdown extends React.Component<CredentialDropdownProps, {}> {
    public render() {
      const { placeholder, credentials, selectedCredential, addLabel, t } = this.props;
      const options = credentials.map((credential: ExternalCredential) => {
        return (
          <Option text={credential.friendlyName} key={credential.id} value={credential.id}>
            <MediaObject hSpace={Space.XSmall} inline={credential.isCredential} textOnly={credential.isCertificate}>
              <Text size={Size.Medium}>{credential.friendlyName}</Text>
              {credential.isCertificate ? (
                !credential.isValid ? (
                  <Text color={TextColor.Danger} size={Size.Medium}>
                    {t("state.expiredAt", { expiryDate: credential.certificateExpiryDate })}
                  </Text>
                ) : (
                  <Text color={TextColor.Secondary} size={Size.Medium}>
                    {t("state.expiresAt", { expiryDate: credential.certificateExpiryDate })}
                  </Text>
                )
              ) : !credential.isValid ? (
                <Text color={TextColor.Danger} size={Size.Medium}>
                  {t("state.invalid")}
                </Text>
              ) : null}
            </MediaObject>
          </Option>
        );
      });
      const showError = selectedCredential && !selectedCredential.isValid;
      const isCertErrorOwner = selectedCredential && selectedCredential.isCertificate && selectedCredential.isOwnedByCurrentUser;

      if (addLabel) {
        options.push(
          <Action role="option" key="add" text={addLabel} onClick={this.props.onAdd} className={styles.addAction}>
            <MediaObject hSpace={Space.XSmall}>
              <Icon size={IconSize.XSmall} icon={IconName.Add} color={TextColor.Link} />
              <Text size={Size.Medium} color={TextColor.Link}>
                {addLabel}
              </Text>
            </MediaObject>
          </Action>
        );
      }
      return (
        <>
          <Select
            input
            placeholder={placeholder}
            triggerClassName={styles.trigger}
            className={styles.select}
            onChange={this.onChangeCredential}
            value={selectedCredential ? selectedCredential.id : "-"}
            error={showError || !!this.props.error}
            aria-label={this.props["aria-label"]}
            data-test-id={this.props["data-test-id"]}
          >
            {options}
          </Select>
          {showError && !this.props.hideInnerErrorMessage ? (
            <div className={styles["error-message"]}>
              {isCertErrorOwner ? (
                <Trans i18nKey="distribute:credentials.apple.certificateAccount.repairAction">
                  <ActionText size={Size.Small} danger={true} key="fix" onClick={this.onFixCredential}>
                    upload
                  </ActionText>
                </Trans>
              ) : (
                <>
                  {selectedCredential.credentialErrorMessage}&nbsp;
                  {selectedCredential.isOwnedByCurrentUser ? (
                    <ActionText size={Size.Small} danger={true} key="fix" onClick={this.onFixCredential}>
                      {selectedCredential.credentialRepairAction}
                    </ActionText>
                  ) : null}
                </>
              )}
            </div>
          ) : null}
        </>
      );
    }

    private onFixCredential = () => {
      const { selectedCredential, onFixCredentialClick } = this.props;
      if (onFixCredentialClick && typeof onFixCredentialClick === "function") {
        onFixCredentialClick(selectedCredential);
      }
    };

    private onChangeCredential = (credentialId: string) => {
      const { credentials, onChange } = this.props;
      const credential = credentials.find((credential) => credential.id === credentialId);
      onChange(credential!);
    };
  }
);
