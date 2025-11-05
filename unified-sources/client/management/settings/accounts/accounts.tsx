import * as React from "react";
import { observer } from "mobx-react";
import {
  Page,
  Panelify,
  PanelOutlet,
  Text,
  TextCell,
  Cell,
  Button,
  IconSize,
  IconName,
  ButtonSize,
  SummaryCell,
  Column,
  autofetch,
  Color,
  Menu,
  Trigger,
  ClickableIcon,
  Action,
  ConfirmationDialog,
  ListVirtualization,
  Table,
  RowHeight,
  Icon,
  EmptyState,
  Size,
  Paragraph,
  EmptyStateButtonType,
  PageHeader,
  MessageBar,
  TextColor,
  MediaObject,
  Space,
  Tooltip,
} from "@root/shared";
import { AccountsUiStore } from "./accounts-ui-store";
import { withTranslation, WithTranslation } from "react-i18next";
import { Row } from "@root/shared/table";
import { AppleCertificateProfile } from "@root/data/shell/models";
import { AppleConnectionDialog, CertificateUploadDialog, AppSpecificPasswordDialog } from "../../../shell/external-credential-dialog";
import { userStore } from "@root/stores";

const styles = require("./accounts.scss");
const noCertificatesImage = require("../../../shared/assets/images/astronomer.svg");

export const Accounts = Panelify(
  withTranslation(["management", "common"])(
    autofetch(null as any)(
      observer(
        class Accounts extends React.Component<WithTranslation, {}> {
          private accountsUiStore = new AccountsUiStore();

          private accountsColumns: Column[] = [
            {
              title: this.props.t("management:accounts.userColumn"),
              width: 1,
            },
            {
              title: this.props.t("management:accounts.statusColumn"),
              width: "130px",
            },
            {
              title: this.props.t("management:accounts.settingsColumn"),
              width: "75px",
            },
          ];
          private appleCertificateColumns: Column[] = [
            {
              title: this.props.t("management:accounts.developerColumn"),
              width: 1.0,
            },
            {
              title: this.props.t("management:accounts.typeColumn"),
              width: "200px",
            },
            {
              title: this.props.t("management:accounts.expirationColumn"),
              width: "200px",
            },
            {
              title: "",
              width: "60px",
            },
          ];
          private appleConnectColumns: Column[] = [
            {
              title: this.props.t("management:accounts.keyNameColumn"),
              width: 1.0,
            },
            {
              title: this.props.t("management:accounts.statusColumn"),
              width: "130px",
            },
            {
              title: this.props.t("management:accounts.settingsColumn"),
              width: "75px",
            },
          ];

          private errorElt = (
            <EmptyState
              imgSrc={noCertificatesImage}
              title={this.props.t("common:certificateUploadDialog.somethingWentWrong")}
              hideButton={true}
            />
          );

          public fetchData() {
            this.accountsUiStore.fetch();
          }

          private get appleAccountsEmptyElt() {
            const { t } = this.props;
            const { isFetchingCredentialsFailed, isAppleAccountsEmpty } = this.accountsUiStore;

            if (isFetchingCredentialsFailed) {
              return this.errorElt;
            } else if (isAppleAccountsEmpty) {
              return (
                <EmptyState
                  hideImage={true}
                  title={() => <Paragraph size={Size.Medium}>{t("management:accounts.emptyState.noAppleAccounts")}</Paragraph>}
                  subtitle=""
                  buttonText={t("management:accounts.emptyState.deviceRegistrationLearnMore")}
                  href="https://docs.microsoft.com/en-us/appcenter/distribution/auto-provisioning#device-registration"
                  buttonType={EmptyStateButtonType.ExternalLink}
                />
              );
            }
            return null;
          }

          private get certificatesEmptyElt() {
            const { t } = this.props;
            const { isFetchingCredentialsFailed, isCertificatesEmpty } = this.accountsUiStore;

            if (isFetchingCredentialsFailed) {
              return this.errorElt;
            } else if (isCertificatesEmpty) {
              return (
                <EmptyState
                  imgSrc={noCertificatesImage}
                  title={t("management:accounts.emptyState.noAppleCertificates.title")}
                  subtitle={t("management:accounts.emptyState.noAppleCertificates.subtitle")}
                  buttonText={t("management:accounts.emptyState.deviceRegistrationLearnMore")}
                  href="https://docs.microsoft.com/en-us/appcenter/distribution/auto-provisioning#device-registration"
                  buttonType={EmptyStateButtonType.ExternalLink}
                />
              );
            }
          }

          private get appleConnectAPIEmptyElt() {
            const { t } = this.props;
            const { isFetchingCredentialsFailed, isKeysEmpty } = this.accountsUiStore;

            if (isFetchingCredentialsFailed) {
              return this.errorElt;
            } else if (isKeysEmpty) {
              return (
                <EmptyState
                  hideImage={true}
                  title={t("management:accounts.emptyState.noAppleConnectKey.title")}
                  subtitle={t("management:accounts.emptyState.noAppleConnectKey.subtitle")}
                  buttonText={t("management:accounts.emptyState.appleConnectLearnMore")}
                  href="https://developer.apple.com/documentation/appstoreconnectapi"
                  buttonType={EmptyStateButtonType.ExternalLink}
                />
              );
            }
          }

          public render() {
            const { t } = this.props;
            const {
              appleAccounts,
              gitlabAccounts,
              certificates,
              isFetchingCredentials,
              startAddNewAccount,
              cancelAddNewAccount,
              finishAddNewAccount,
              isCredentialDialogVisible,
              startAddNewCertificate,
              cancelAddNewCertificate,
              finishAddNewCertificate,
              isCertificateDialogVisible,
              deleteNotification,
              startRemoveAccount,
              finishRemoveAccount,
              accountToRemove,
              hideRemoveAccountConfirmation,
              isDeleteAccountConfirmationVisible,
              startRemoveCertificate,
              startReplaceCertificate,
              startReconnectAccount,
              updateAppSpecificPassword,
              accountToReconnect,
              isCertificateDialogReplaceable,
              finishRemoveCertificate,
              certificateToRemove,
              hideRemoveCertificateConfirmation,
              isDeleteCertificateConfirmationVisible,
              isAppSpecificPasswordDialogVisible,
              accountToUpdateAppSpecificPassword,
              cancelAppSpecificPassword,
              finishAppSpecificPassword,
              appleConnectKeys,
              startAddNewAppleConnectKeys,
              isAppleConnect,
            } = this.accountsUiStore;
            const { currentUser: user } = userStore;
            return (
              <Page
                data-test-id="accounts-page"
                header={<PageHeader title={t("management:accounts.title")} loading={isFetchingCredentials} />}
              >
                {deleteNotification ? <MessageBar type={deleteNotification.type}>{deleteNotification.message}</MessageBar> : null}
                <>
                  {appleConnectKeys.length > 0 || user.isUserWhitelisted ? (
                    <Table
                      data-test-id="apple-keys-table"
                      disableArrowKeyFocuser={true} // Required here to fix an accessibility issue - not being able to access the "Options/More" button with tab
                      virtualize={ListVirtualization.Never}
                      className={styles.accountsTable}
                      title={t("management:accounts.appleConnectTableTitle")}
                      titleAriaHidden={false}
                      toolbar={
                        user.isUserWhitelisted ? (
                          <Tooltip>
                            <Trigger skipAreaExpandedTracking={true}>
                              <Button
                                data-test-id="add-apple-connect-key-button"
                                icon={IconName.Add}
                                size={ButtonSize.Small}
                                color={Color.Blue}
                                onClick={startAddNewAppleConnectKeys}
                                smallerIcon
                                aria-label={t("common:certificateUpload.addAppleConnectKey")}
                              />
                            </Trigger>
                            {t("management:accounts.addAppleConnectKey")}
                          </Tooltip>
                        ) : undefined
                      }
                      columns={this.appleConnectColumns}
                      data={appleConnectKeys}
                      activeRow={undefined}
                      rowHeight={RowHeight.MultiLine}
                      eventualRowCount={isFetchingCredentials ? 1 : appleConnectKeys.length}
                      renderRow={(key, props, info) => (
                        <Row {...props} data-test-class="certificate-row">
                          <TextCell data-test-class="certificate-developer">{key.friendlyName}</TextCell>
                          <TextCell data-test-class="account-validity">
                            {!key.isValid ? (
                              <>
                                <Icon icon={IconName.WarningFilled} size={IconSize.Small} color={Color.Red} />
                                <span className={styles.invalidCredentials}>{t("management:accounts.invalidAccount")}</span>
                              </>
                            ) : (
                              <>
                                <Icon icon={IconName.StatusPassed} size={IconSize.Small} color={Color.Green} />
                                <span className={styles.validCredentials}>{t("management:accounts.validAccount")}</span>
                              </>
                            )}
                          </TextCell>
                          <Cell hideUntilRowHover>
                            <Menu data-test-id={`key-settings-menu-${info.index}`}>
                              <Trigger>
                                <ClickableIcon icon={IconName.More} />
                              </Trigger>
                              <Action
                                danger
                                text={t("management:accounts.actions.removeCertificate")}
                                onClick={startRemoveCertificate(key)}
                              />
                            </Menu>
                          </Cell>
                        </Row>
                      )}
                      error={user.isUserWhitelisted ? this.appleConnectAPIEmptyElt : null}
                    />
                  ) : null}
                  {certificates.length > 0 || user.isUserWhitelisted ? (
                    <Table
                      disableArrowKeyFocuser={true} // Required here to fix an accessibility issue - not being able to access the "Options/More" button with tab
                      virtualize={ListVirtualization.Never}
                      className={styles.accountsTable}
                      title={t("management:accounts.appleCertificatesTableTitle")}
                      titleAriaHidden={false}
                      toolbar={
                        user.isUserWhitelisted ? (
                          <Tooltip>
                            <Trigger skipAreaExpandedTracking={true}>
                              <Button
                                data-test-id="add-certificate-button"
                                icon={IconName.Add}
                                size={ButtonSize.Small}
                                color={Color.Blue}
                                onClick={startAddNewCertificate}
                                smallerIcon
                                aria-label={t("common:certificateUpload.addAppleCertificates")}
                              />
                            </Trigger>
                            {t("management:accounts.addAppleCertificates")}
                          </Tooltip>
                        ) : undefined
                      }
                      columns={this.appleCertificateColumns}
                      data={certificates}
                      activeRow={undefined}
                      rowHeight={RowHeight.MultiLine}
                      eventualRowCount={isFetchingCredentials ? 3 : certificates.length}
                      renderRow={(certificate, props) => (
                        <Row {...props} data-test-class="certificate-row">
                          <TextCell data-test-class="certificate-developer">{certificate.appleCertificateDeveloper}</TextCell>
                          <TextCell data-test-class="certificate-type">{certificate.appleCertificateType || "—"}</TextCell>
                          {!certificate.isValid ? (
                            <TextCell className={styles.invalidCredentials} data-test-class="certificate-expiration">
                              {t("management:accounts.invalidCertificate")}
                            </TextCell>
                          ) : (
                            <TextCell data-test-class="certificate-expiration">
                              {t("management:accounts.expiration", {
                                date: (certificate.profile as AppleCertificateProfile).certificateValidityEndDate,
                              })}
                            </TextCell>
                          )}
                          <Cell hideUntilRowHover>
                            <Menu data-test-id={`certificate-settings-menu-${certificate.id}`}>
                              <Trigger>
                                <ClickableIcon icon={IconName.More} />
                              </Trigger>
                              {!certificate.isValid ? (
                                <Action text={t("management:accounts.actions.replaceCertificate")} onClick={startReplaceCertificate} />
                              ) : null}
                              <Action
                                danger
                                text={t("management:accounts.actions.removeCertificate")}
                                onClick={startRemoveCertificate(certificate)}
                              />
                            </Menu>
                          </Cell>
                        </Row>
                      )}
                      error={user.isUserWhitelisted ? this.certificatesEmptyElt : null}
                    />
                  ) : null}
                  <CertificateUploadDialog
                    isReplace={isCertificateDialogReplaceable}
                    isVisible={isCertificateDialogVisible}
                    onSuccess={finishAddNewCertificate}
                    onCancel={cancelAddNewCertificate}
                    isAppleConnect={isAppleConnect}
                    title={isAppleConnect ? t("common:appleConnectKeyDialog.dialogTitle") : null}
                    description={isAppleConnect ? t("common:appleConnectKeyDialog.dialogDescription") : null}
                  />
                  <ConfirmationDialog
                    data-test-id="delete-certificate-confirmation-dialog"
                    visible={isDeleteCertificateConfirmationVisible}
                    danger
                    confirmButton={t("common:button.delete")}
                    cancelButton={t("common:button.cancel")}
                    title={t("management:accounts.confirmations.removeCertificateTitle", {
                      certificate:
                        certificateToRemove && certificateToRemove.appleCertificateDeveloper
                          ? certificateToRemove.appleCertificateDeveloper
                          : "a",
                    })}
                    onCancel={hideRemoveCertificateConfirmation}
                    onConfirm={finishRemoveCertificate(certificateToRemove)}
                    description={t("management:accounts.confirmations.removeCertificateMessage")}
                  />
                  {gitlabAccounts.length > 0 && user.isUserWhitelisted ? (
                    <Table
                      disableArrowKeyFocuser={true} // Required here to fix an accessibility issue - not being able to access the "Options/More" button with tab
                      virtualize={ListVirtualization.Never}
                      className={styles.accountsTable}
                      title={t("management:accounts.gitlabAccountsTableTitle")}
                      titleAriaHidden={false}
                      columns={this.accountsColumns}
                      data={gitlabAccounts}
                      activeRow={undefined}
                      rowHeight={RowHeight.MultiLine}
                      eventualRowCount={isFetchingCredentials ? 3 : gitlabAccounts.length}
                      renderPlaceholderRow={(props) => (
                        <Row {...props}>
                          <SummaryCell skeleton title="title" subtitle="subtitle" icon={IconName.Default} />
                          <TextCell skeleton></TextCell>
                        </Row>
                      )}
                      renderRow={(account, props) => (
                        <Row {...props} to={`/settings/accounts/gitlab/${account.id}`} data-test-class="account-row">
                          <SummaryCell title={account.friendlyName} icon={IconName.GitLab} iconSize={IconSize.Small}></SummaryCell>
                          <TextCell>
                            <MediaObject data-test-class="account-validity" hSpace={Space.XXSmall}>
                              {!account.isValid ? (
                                <>
                                  <Icon icon={IconName.WarningFilled} size={IconSize.Small} color={Color.Red} />
                                  <Text size={Size.Medium} color={TextColor.Error}>
                                    {t("management:accounts.tokenExpired")}
                                  </Text>
                                </>
                              ) : null}
                            </MediaObject>
                          </TextCell>
                          <Cell hideUntilRowHover>
                            <Menu data-test-id={`account-settings-menu-${account.id}`}>
                              <Trigger>
                                <ClickableIcon icon={IconName.More} />
                              </Trigger>
                              <Action
                                danger
                                text={t("management:accounts.actions.removeAccount")}
                                onClick={startRemoveAccount(account)}
                              />
                            </Menu>
                          </Cell>
                        </Row>
                      )}
                    />
                  ) : null}

                  {appleAccounts.length > 0 || user.isUserWhitelisted ? (
                    <Table
                      disableArrowKeyFocuser={true} // Required here to fix an accessibility issue - not being able to access the "Options/More" button with tab
                      virtualize={ListVirtualization.Never}
                      className={styles.accountsTable}
                      title={t("management:accounts.accountsTableTitle")}
                      titleAriaHidden={false}
                      toolbar={
                        user.isUserWhitelisted ? (
                          <Tooltip>
                            <Trigger skipAreaExpandedTracking={true}>
                              <Button
                                data-test-id="add-account-button"
                                icon={IconName.Add}
                                size={ButtonSize.Small}
                                color={Color.Blue}
                                onClick={startAddNewAccount}
                                smallerIcon
                                aria-label={t("common:externalCredentialDialog.apple.dialogTitle")}
                              />
                            </Trigger>
                            {t("management:accounts.addAppleAccounts")}
                          </Tooltip>
                        ) : undefined
                      }
                      columns={this.accountsColumns}
                      data={appleAccounts}
                      activeRow={undefined}
                      rowHeight={RowHeight.MultiLine}
                      eventualRowCount={isFetchingCredentials ? 3 : appleAccounts.length}
                      renderPlaceholderRow={(props) => (
                        <Row {...props}>
                          <SummaryCell skeleton title="title" subtitle="subtitle" icon={IconName.Default} />
                          <TextCell skeleton></TextCell>
                        </Row>
                      )}
                      renderRow={(account, props) => (
                        <Row {...props} data-test-class="account-row">
                          <SummaryCell title={account.friendlyName} icon={IconName.AppleIcon} iconSize={IconSize.Small}></SummaryCell>
                          <TextCell data-test-class="account-validity">
                            {!account.isValid ? (
                              <>
                                <Icon icon={IconName.WarningFilled} size={IconSize.Small} color={Color.Red} />
                                <span className={styles.invalidCredentials}>{t("management:accounts.invalidAccount")}</span>
                              </>
                            ) : (
                              <>
                                <Icon icon={IconName.StatusPassed} size={IconSize.Small} color={Color.Green} />
                                <span className={styles.validCredentials}>{t("management:accounts.validAccount")}</span>
                              </>
                            )}
                          </TextCell>
                          <Cell hideUntilRowHover>
                            <Menu data-test-id={`account-settings-menu-${account.id}`}>
                              <Trigger>
                                <ClickableIcon icon={IconName.More} />
                              </Trigger>
                              {account.is2FA ? (
                                <Action
                                  text={t("management:accounts.actions.updateAppSpecificPassword")}
                                  onClick={updateAppSpecificPassword(account)}
                                />
                              ) : null}
                              {!account.isValid ? (
                                <Action
                                  text={t("management:accounts.actions.reconnectAccount")}
                                  onClick={startReconnectAccount(account)}
                                />
                              ) : null}
                              <Action
                                danger
                                text={t("management:accounts.actions.removeAccount")}
                                onClick={startRemoveAccount(account)}
                              />
                            </Menu>
                          </Cell>
                        </Row>
                      )}
                      error={user.isUserWhitelisted ? this.appleAccountsEmptyElt : null}
                    />
                  ) : null}
                  <AppleConnectionDialog
                    existingCredential={accountToReconnect}
                    enableTwoFactorAuth={true}
                    isVisible={isCredentialDialogVisible}
                    onSuccess={finishAddNewAccount}
                    onCancel={cancelAddNewAccount}
                  />
                  <AppSpecificPasswordDialog
                    existingCredential={accountToUpdateAppSpecificPassword}
                    isVisible={isAppSpecificPasswordDialogVisible}
                    onSuccess={finishAppSpecificPassword}
                    onCancel={cancelAppSpecificPassword}
                  />
                  <ConfirmationDialog
                    data-test-id="delete-account-confirmation-dialog"
                    visible={isDeleteAccountConfirmationVisible}
                    danger
                    confirmButton={t("common:button.delete")}
                    cancelButton={t("common:button.cancel")}
                    title={t("management:accounts.confirmations.removeAccountTitle", {
                      account: accountToRemove ? accountToRemove.friendlyName : "a",
                    })}
                    onCancel={hideRemoveAccountConfirmation}
                    onConfirm={finishRemoveAccount(accountToRemove)}
                    description={t("management:accounts.confirmations.removeAccountMessage")}
                  />
                </>
                <PanelOutlet>{this.props.children}</PanelOutlet>
              </Page>
            );
          }
        }
      )
    )
  )
);
