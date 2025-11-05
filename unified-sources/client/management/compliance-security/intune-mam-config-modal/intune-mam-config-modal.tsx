import * as React from "react";
import { withTranslation, WithTranslation } from "react-i18next";
import {
  Page,
  Modalify,
  TopBar,
  Title,
  Size,
  BottomBar,
  LinkButton,
  PrimaryButton,
  Space,
  Text,
  TextColor,
  autofetch,
  ConfirmationDialog,
  PageNotification,
  NotificationType,
} from "@root/shared";
import { CredentialDropdown } from "@root/distribute/common-components/credential-dropdown/credential-dropdown";
import { RouteComponentProps } from "react-router";
import { IntuneMAMConfigModalUIStore } from "@root/management/compliance-security/intune-mam-config-modal/intune-mam-config-modal-ui-store";
import { observer } from "mobx-react";
import { CertificateUploadDialog } from "../../../shell/external-credential-dialog";
const styles = require("./intune-mam-config-modal.scss");

export const IntuneMAMConfigModal = withTranslation(["management", "common"])(
  Modalify(
    autofetch(null as any)(
      observer(
        class IntuneMAMConfigModal extends React.Component<WithTranslation & RouteComponentProps<any, any>, {}> {
          private intuneMAMConfigModalUIStore = new IntuneMAMConfigModalUIStore(
            this.props.params["org_name"],
            this.props.params["id"]
          );

          public componentWillUnmount() {
            this.intuneMAMConfigModalUIStore.disposeReactions();
          }

          public fetchData() {
            this.intuneMAMConfigModalUIStore.fetch();
          }
          public render() {
            const { t } = this.props;
            const {
              dismissWizard,
              isFetchingCredentials,
              certificates,
              selectedCertificate,
              onSelectedAppleCertificateChanged,
              showAddCertificateDialog,
              cancelAddNewCertificate,
              finishAddNewCertificate,
              startAddNewCertificate,
              isMAMIntegrated,
              showReplaceCertificateDialog,
              startReplaceCertificate,
              cancelReplaceCertificate,
              finishReplaceCertificate,
              cancelRemoveMAMConfigConfirmationDialog,
              finishRemoveMAMConfigConfirmationDialog,
              startRemoveMAMConfigConfirmationDialog,
              showRemoveIntuneMAMConfigDialog,
              errorMessage,
              errorNotification,
              isOrgSettingsAddUpdateInProgress,
              addUpdateOrgSetting,
              isOrgSettingsDeleteInProgress,
              isSaveComplianceSettingsEnabled,
            } = this.intuneMAMConfigModalUIStore;
            return (
              <Page data-test-id="intune-mam-config-modal">
                <TopBar title={t("management:intuneMAMConfig.title")} onClickClose={dismissWizard} loading={isFetchingCredentials} />
                {errorNotification ? <PageNotification type={NotificationType.Error}>{errorMessage}</PageNotification> : null}
                <div>
                  <Title className={styles["title-container"]} size={Size.Small}>
                    {t("management:intuneMAMConfig.description")}
                  </Title>
                  <Text bold size={Size.Medium} spaceBelow={Space.XXSmall} color={TextColor.Primary}>
                    {t("management:intuneMAMConfig.distributionCertificateTitle")}
                  </Text>
                  <CredentialDropdown
                    placeholder={t("management:intuneMAMConfig.distributionCertificatePlaceHolder")}
                    aria-label={t("management:intuneMAMConfig.distributionCertificateLabel")}
                    onAdd={startAddNewCertificate}
                    credentials={certificates}
                    onChange={onSelectedAppleCertificateChanged(selectedCertificate)}
                    selectedCredential={selectedCertificate}
                    addLabel={t("management:intuneMAMConfig.uploadDistributionCertificate")}
                    onFixCredentialClick={startReplaceCertificate}
                    error={false}
                    data-test-id="mam-dist-cert-select"
                  />
                  <CertificateUploadDialog
                    title={t("management:uploadDistributionCertDialog.title")}
                    description={t("management:uploadDistributionCertDialog.description")}
                    isVisible={showAddCertificateDialog}
                    onSuccess={finishAddNewCertificate}
                    onCancel={cancelAddNewCertificate}
                  />
                  <CertificateUploadDialog
                    isReplace={true}
                    isVisible={showReplaceCertificateDialog}
                    onSuccess={finishReplaceCertificate}
                    onCancel={cancelReplaceCertificate}
                  />
                  <ConfirmationDialog
                    data-test-id="remove-MAM-config-confirmation-dialog-modal"
                    visible={showRemoveIntuneMAMConfigDialog}
                    title={t("management:removeIntuneMAMConfigDialog.title")}
                    description={t("management:removeIntuneMAMConfigDialog.description")}
                    confirmButton={t("common:button.remove")}
                    onConfirm={finishRemoveMAMConfigConfirmationDialog}
                    cancelButton={t("common:button.cancel")}
                    onCancel={cancelRemoveMAMConfigConfirmationDialog}
                    danger
                  />
                </div>
                <BottomBar className={isMAMIntegrated ? styles.bottomBar : null} alignRight={!isMAMIntegrated}>
                  {isMAMIntegrated ? (
                    <LinkButton
                      danger
                      progress={isOrgSettingsDeleteInProgress}
                      onClick={startRemoveMAMConfigConfirmationDialog}
                      data-test-id="remove-mam-config-button"
                    >
                      {t("management:intuneMAMConfig.removeMAMIntegration")}
                    </LinkButton>
                  ) : null}
                  <PrimaryButton
                    progress={isOrgSettingsAddUpdateInProgress}
                    onClick={addUpdateOrgSetting}
                    disabled={!isSaveComplianceSettingsEnabled}
                    data-test-id="config-mam-dist-certificate"
                  >
                    {t("common:button.done")}
                  </PrimaryButton>
                </BottomBar>
              </Page>
            );
          }
        }
      )
    )
  )
);
