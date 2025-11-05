import * as React from "react";
import { RouteComponentProps } from "react-router";
import {
  Page,
  TopBar,
  Panelify,
  Title,
  Paragraph,
  MediaObject,
  Space,
  Size,
  Text,
  TextColor,
  GridSpacing,
  Card,
  HeaderArea,
  PrimaryButton,
  ButtonSize,
  PanelOutlet,
  Menu,
  ClickableIcon,
  IconName,
  Trigger,
  Action,
  IconSize,
  Icon,
  autofetch,
  TextCell,
  ConfirmationDialog,
} from "@root/shared";
import { Grid, Row } from "@root/shared/grid";
import { observer } from "mobx-react";
import { withTranslation, WithTranslation, Trans } from "react-i18next";
import { ComplianceSecurityUIStore } from "@root/management/orgs/manage/compliance-security/compliance-security-ui-store";
import { AppleCertificateProfile } from "@root/data/shell/models";

const styles = require("./compliance-security.scss");
const classNames = require("classnames");
const complianceAndSecurityImage = require("@root/management/compliance-security/images/security-dog.svg");

export const ComplianceAndSecurity = Panelify(
  withTranslation(["common", "management"])(
    autofetch(undefined)(
      observer(
        class ComplianceAndSecurity extends React.Component<RouteComponentProps<any, any> & WithTranslation, {}> {
          private complianceSecurityUIStore = new ComplianceSecurityUIStore(this.props.params["org_name"]);

          public fetchData() {
            this.complianceSecurityUIStore.fetch();
          }
          public render() {
            const { t } = this.props;
            const {
              intuneMAMOrgSetting,
              intuneMAMConfiguredCertificate,
              isMAMConfigurationValid,
              cancelRemoveMAMConfigConfirmationDialog,
              finishRemoveMAMConfigConfirmationDialog,
              showRemoveIntuneMAMConfigDialog,
              startRemoveMAMConfigConfirmationDialog,
              isFetchingOrDeletingComplianceSettings,
              isFetchingOrDeletingFailed,
              complianceSecurityConfigURL,
              errorMessage,
            } = this.complianceSecurityUIStore;

            return (
              <Page data-test-id="manage-org-compliance" constrainedWidth>
                <TopBar
                  title={t("management:compliance.title")}
                  closeButton={false}
                  loading={isFetchingOrDeletingComplianceSettings}
                />
                <div>
                  <MediaObject allowWrapping hSpace={Space.Large} vSpace={Space.Small} className={classNames(styles.banner)}>
                    <img alt="Compliance and Security" src={complianceAndSecurityImage} />
                    <Title size={Size.Medium}>{t("management:compliance.headerTitle")}</Title>
                    <Paragraph size={Size.Medium} color={TextColor.Secondary} ellipsize={false}>
                      {t("management:compliance.headerDescription")}&nbsp;
                      <a href="https://www.microsoft.com/en-ie/cloud-platform/microsoft-intune" target="_blank">
                        {t("common:button.learnMore")}
                      </a>
                    </Paragraph>
                  </MediaObject>
                  {!isFetchingOrDeletingComplianceSettings ? (
                    <>
                      <Card
                        withoutPadding={!!intuneMAMOrgSetting && !isFetchingOrDeletingFailed}
                        header={
                          <HeaderArea title={t("management:intuneMobileAppManagementCard.headerTitle")}>
                            {intuneMAMOrgSetting || isFetchingOrDeletingFailed ? (
                              <>
                                {isMAMConfigurationValid && !isFetchingOrDeletingFailed ? (
                                  <div aria-live="assertive">
                                    <Icon
                                      className={styles.statusIcon}
                                      color={TextColor.Success}
                                      icon={IconName.StatusPassed}
                                      size={IconSize.XSmall}
                                    />
                                    <Text
                                      bold
                                      className={styles.status}
                                      color={TextColor.Success}
                                      size={Size.Small}
                                      data-test-id="mam-config-enabled-text"
                                    >
                                      {t("common:state:enabled")}
                                    </Text>
                                  </div>
                                ) : (
                                  <div aria-live="assertive">
                                    <Icon
                                      className={styles.statusIcon}
                                      color={TextColor.Error}
                                      icon={IconName.StatusFailed}
                                      size={IconSize.XSmall}
                                    />
                                    <Text
                                      bold
                                      className={styles.status}
                                      color={TextColor.Error}
                                      size={Size.Small}
                                      data-test-id="mam-config-failed-text"
                                    >
                                      {t("common:state:failed")}
                                    </Text>
                                  </div>
                                )}
                                <Menu data-test-id={`intune-MAM-settings-menu`}>
                                  <Trigger>
                                    <ClickableIcon icon={IconName.More} />
                                  </Trigger>
                                  <Action
                                    text={t("common:button:configure")}
                                    to={complianceSecurityConfigURL(intuneMAMOrgSetting ? intuneMAMOrgSetting.id : undefined)}
                                  />
                                  <Action
                                    danger
                                    text={t("management:intuneMAMConfig.removeMAMIntegration")}
                                    onClick={startRemoveMAMConfigConfirmationDialog}
                                  />
                                </Menu>
                              </>
                            ) : (
                              <PrimaryButton
                                data-test-id="configure-intune-app-management-button"
                                size={ButtonSize.Small}
                                to={complianceSecurityConfigURL()}
                              >
                                {t("common:button:configure")}
                              </PrimaryButton>
                            )}
                          </HeaderArea>
                        }
                        dividedHeader
                      >
                        {intuneMAMOrgSetting && intuneMAMConfiguredCertificate ? (
                          <Grid padded rowSpacing={GridSpacing.Page}>
                            <Row between>
                              <TextCell data-test-class="intune-MAM-certificate-developer">
                                {intuneMAMConfiguredCertificate.appleCertificateDeveloper}
                              </TextCell>
                              <TextCell data-test-class="intune-MAM-certificate-type">
                                {intuneMAMConfiguredCertificate.appleCertificateType || "—"}
                              </TextCell>
                              {intuneMAMConfiguredCertificate && !intuneMAMConfiguredCertificate.isValid ? (
                                <TextCell className={styles.expiredCert} data-test-class="intune-MAM-certificate-expired">
                                  {t("management:intuneMAMConfig.expiredOn", {
                                    date: (intuneMAMConfiguredCertificate.profile as AppleCertificateProfile)
                                      .certificateValidityEndDate,
                                  })}
                                </TextCell>
                              ) : (
                                <TextCell data-test-class="intune-MAM-certificate-expires">
                                  {t("management:intuneMAMConfig.expiresOn", {
                                    date: (intuneMAMConfiguredCertificate.profile as AppleCertificateProfile)
                                      .certificateValidityEndDate,
                                  })}
                                </TextCell>
                              )}
                            </Row>
                          </Grid>
                        ) : isFetchingOrDeletingFailed ? (
                          <Paragraph size={Size.Medium} color={TextColor.Error}>
                            {errorMessage}
                          </Paragraph>
                        ) : (
                          <Paragraph size={Size.Medium} color={TextColor.Secondary}>
                            <Trans i18nKey="management:intuneMobileAppManagementCard.headerDescription">
                              <a
                                href="https://signup.microsoft.com/Signup?OfferId=40BE278A-DFD1-470a-9EF7-9F2596EA7FF9&dl=INTUNE_A&ali=1"
                                target="_blank"
                              >
                                Intune subscription
                              </a>
                            </Trans>
                          </Paragraph>
                        )}
                      </Card>
                      <ConfirmationDialog
                        data-test-id="remove-MAM-config-confirmation-dialog"
                        visible={showRemoveIntuneMAMConfigDialog}
                        title={t("management:removeIntuneMAMConfigDialog.title")}
                        description={t("management:removeIntuneMAMConfigDialog.description")}
                        confirmButton={t("common:button.remove")}
                        onConfirm={finishRemoveMAMConfigConfirmationDialog}
                        cancelButton={t("common:button.cancel")}
                        onCancel={cancelRemoveMAMConfigConfirmationDialog}
                        danger
                      />
                    </>
                  ) : null}
                </div>
                <PanelOutlet>{this.props.children}</PanelOutlet>
              </Page>
            );
          }
        }
      )
    )
  )
);
