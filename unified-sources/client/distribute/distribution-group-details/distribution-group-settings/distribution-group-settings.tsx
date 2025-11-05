import * as React from "react";
import { observer } from "mobx-react";
import { RouteComponentProps } from "react-router";
import {
  Button,
  IconName,
  Input,
  PrimaryButton,
  Modalify,
  Page,
  PageNotification,
  TopBar,
  BottomBar,
  Text,
  TextColor,
  Size,
  Paragraph,
  Well,
  HeaderArea,
  Toggle,
  Stretch,
  Space,
  HeaderAreaTitleSize,
  ConfirmationDialog,
  MessageBar,
  NotificationType,
  Color,
  Autofocus,
} from "@root/shared";
import { notFoundStore } from "@root/stores/not-found-store";
import { DistributionGroupSettingsStrings } from "../../utils/strings";
import { DistributionGroupRemoveDialog } from "../../common-components/distribution-group-remove-dialog";
import { removeUrlProtocol } from "@root/lib/utils/url";
import { appStore } from "@root/stores";
import * as PageTimer from "@root/shared/page-timer";
import { locationStore } from "@root/stores";
import { WithTranslation, withTranslation } from "react-i18next";
import { CredentialDropdown } from "@root/distribute/common-components/credential-dropdown/credential-dropdown";
import { DistributionGroupSettingsUIStore } from "@root/distribute/distribution-group-details/distribution-group-settings/distribution-group-settings-ui-store";
import { CertificateUploadDialog, AppleConnectionDialog } from "client/shell/external-credential-dialog";
import { uniqueId } from "lodash";
import { DisableDogfoodingDialog } from "@root/distribute/common-components/disable-dogfooding-dialog";
import { DogfoodingNotAllowedDialog } from "@root/distribute/common-components/dogfooding-not-allowed-dialog";

const classNames = require("classnames");
const styles = require("./distribution-group-settings.scss");

type ConfigureWellProps = {
  disabled?: boolean;
  active?: boolean;
  onChanged?: (e) => void;
  title?: string;
  subtitle?: string;
};

export const ConfigureWell = withTranslation(["distribute"])(
  class ConfigureWell extends React.PureComponent<ConfigureWellProps & WithTranslation, {}> {
    public titleId = uniqueId("configure-wall-title-");

    public static defaultProps = {
      disabled: true,
      active: false,
    };

    public renderHeaderArea() {
      const { active, t, onChanged, disabled, title, subtitle } = this.props;
      return (
        <HeaderArea
          titleSize={HeaderAreaTitleSize.Small}
          title={title}
          renderTitle={(TitleText) => <TitleText id={this.titleId}>{title}</TitleText>}
          subtitle={subtitle}
        >
          <Toggle aria-labelledby={this.titleId} disabled={disabled} onChange={onChanged} checked={active}>
            {active ? t("common:state.on") : t("common:state.off")}
          </Toggle>
        </HeaderArea>
      );
    }

    public render() {
      const { disabled, active } = this.props;
      return (
        <Well
          bordered={false}
          className={styles.publicModeContainer}
          header={this.renderHeaderArea()}
          data-test-id={this.props["data-test-id"]}
        >
          {!disabled && active ? this.props.children : null}
        </Well>
      );
    }
  }
);

export const DistributionGroupSettings = Modalify(
  withTranslation(["distribute", "common"])(
    observer(
      class DistributionGroupSettings extends React.Component<RouteComponentProps<any, any> & WithTranslation, {}> {
        private distributionGroupSettingsUIStore: DistributionGroupSettingsUIStore;

        constructor(props: RouteComponentProps<any, any> & WithTranslation) {
          super(props);
          const selectedTab = this.props.params["tab"];
          const groupName = this.props.params["name"];
          this.distributionGroupSettingsUIStore = new DistributionGroupSettingsUIStore(selectedTab, groupName);
        }

        public UNSAFE_componentWillMount() {
          const { isLoadingGroup, hasDistributionGroup } = this.distributionGroupSettingsUIStore;
          if (!isLoadingGroup && !hasDistributionGroup(this.props.params["name"])) {
            notFoundStore.notify404();
          } else {
            this.distributionGroupSettingsUIStore.fetchSettings();
          }
        }

        public componentWillUnmount() {
          this.distributionGroupSettingsUIStore.disposeReactions();
        }

        public render() {
          const { t } = this.props;
          const {
            isLoading,
            cancelWizard,
            updateNotification,
            isDeleteInProgress,
            isUpdateInProgress,
            distributionGroup,
            isDefaultDistributionGroup,
            isDogfoodDistributionGroup,
            disableDogfoodingDialogVisible,
            showDisableDogfoodingConfirmationDialog,
            disableDogfooding,
            cancelDisableDogfooding,
            dogfoodNotAllowedDialogVisible,
            dismissDogfoodNotAllowedDialog,
            confirmDialogVisible,
            showRemoveGroupConfirmationDialog,
            applyButtonEnabled,
            updateSettings,
            removeGroup,
            cancelRemoveGroupConfirmationDialog,
            onNameChange,
            name,
            onIsPublicToggleChanged,
            publicUrl,
            isPublicGroup,
            isSharedGroup,
            automaticallyManageDevices,
            onAutomaticallyManageDevicesToggleChanged,
            selectedAppleCertificate,
            selectedAppleCredential,
            appleCertificates,
            appleCredentials,
            startAddNewAccount,
            startAddNewCertificate,
            showAddCertificateDialog,
            showAddCredentialDialog,
            finishAddNewCertificate,
            cancelAddNewCertificate,
            finishAddNewAccount,
            cancelAddNewAccount,
            onReconnectAppleCredentialsClicked,
            showReconnectCredentialDialog,
            finishReconnectAccount,
            cancelReconnectAccount,
            onReplaceAppleCertificateClicked,
            showReplaceCertificateDialog,
            finishReplaceCertificate,
            cancelReplaceCertificate,
            switchCredentialDialogTitle,
            switchCredentialDialogDescription,
            updateCredentialDialogVisible,
            cancelConfirmUpdateCredential,
            finishConfirmUpdateCredential,
            onCredentialSelect,
            turnOffAutoprovisioningVisible,
            turnOffPublicAccessDialogVisible,
            finishTurnOffAutoProvisioning,
            finishTurnOffPublicAccess,
            hideTurnOffAutoProvisioning,
            hideTurnOffPublicAccess,
          } = this.distributionGroupSettingsUIStore;
          const publicUrlWithoutProtocol = removeUrlProtocol(publicUrl);
          const pagerTimerReporterPath = locationStore.getUrlWithCurrentApp(
            `/distribute/distribution-groups/${encodeURIComponent(this.props.params.name)}/${encodeURIComponent(
              this.props.params.tab
            )}/settings`
          );

          let bottomBar: JSX.Element;
          if (isDogfoodDistributionGroup) {
            bottomBar = (
              <BottomBar>
                <Stretch className={classNames(styles.bottomBar, styles.end)}>
                  <Button
                    color={Color.Red}
                    icon={isUpdateInProgress ? IconName.Loading : (null as any)}
                    onClick={showDisableDogfoodingConfirmationDialog}
                    data-test-id="disable-dogfood--button"
                  >
                    {t("common:button.disable")}
                  </Button>
                </Stretch>
                <DisableDogfoodingDialog
                  visible={disableDogfoodingDialogVisible}
                  onDisableButtonClicked={disableDogfooding}
                  onCancelButtonClicked={cancelDisableDogfooding}
                />
                <DogfoodingNotAllowedDialog visible={dogfoodNotAllowedDialogVisible} onDismiss={dismissDogfoodNotAllowedDialog} />
              </BottomBar>
            );
          } else {
            bottomBar = (
              <BottomBar>
                <Stretch className={classNames(styles.bottomBar, { [styles.end]: isDefaultDistributionGroup })}>
                  {!isDefaultDistributionGroup ? (
                    <Button
                      icon={isDeleteInProgress ? IconName.Loading : (null as any)}
                      className={styles.removeItemLink}
                      disabled={isDeleteInProgress}
                      onClick={showRemoveGroupConfirmationDialog}
                    >
                      {isSharedGroup ? t("distribute:group.removeSharedGroup") : t("distribute:group.delete")}
                    </Button>
                  ) : null}
                  <PrimaryButton
                    icon={isUpdateInProgress ? IconName.Loading : (null as any)}
                    disabled={!applyButtonEnabled}
                    onClick={updateSettings}
                    data-test-id="save-button"
                  >
                    {t("common:button.done")}
                  </PrimaryButton>
                </Stretch>
                {distributionGroup ? (
                  <DistributionGroupRemoveDialog
                    sharedGroup={isSharedGroup}
                    visible={confirmDialogVisible}
                    groupName={distributionGroup.name!}
                    onRemoveButtonClicked={removeGroup}
                    onCancelButtonClicked={cancelRemoveGroupConfirmationDialog}
                  />
                ) : null}
              </BottomBar>
            );
          }

          return (
            <Page data-test-id="distribution-group-settings">
              <TopBar title={DistributionGroupSettingsStrings.Title} onClickClose={cancelWizard} loading={isLoading} />
              <PageTimer.Reporter path={pagerTimerReporterPath} loading={isLoading} />
              {updateNotification ? (
                <PageNotification type={updateNotification.type}>{updateNotification.message}</PageNotification>
              ) : null}
              <Autofocus focus={!isLoading}>
                <MessageBar
                  visible={!isDogfoodDistributionGroup && isSharedGroup}
                  className={styles.messageBar}
                  container="Well"
                  type={NotificationType.Info}
                  renderActionButton={(props) => (
                    <Button
                      {...props}
                      to={`/orgs/${locationStore.ownerName}/people/distribution-groups/${encodeURIComponent(
                        this.props.params.name
                      )}/testers/manage`}
                    >
                      {t("common:button.manage")}
                    </Button>
                  )}
                  compact
                >
                  {t("distribute:groupSettings.messageBar.sharedGroup")}
                </MessageBar>
                <Input
                  disabled={isLoading || isDefaultDistributionGroup || isDogfoodDistributionGroup || isSharedGroup}
                  value={name}
                  onChange={onNameChange}
                  placeholder={DistributionGroupSettingsStrings.InputGroupNamePlaceholderText}
                  data-test-id="group-name-input"
                />

                {!(isDefaultDistributionGroup || isDogfoodDistributionGroup) ? (
                  <div className={styles.groupId}>
                    <Text size={Size.Small} color={TextColor.Secondary} bold>
                      {DistributionGroupSettingsStrings.Id + ": "}
                    </Text>
                    <Text size={Size.Small} color={TextColor.Secondary}>
                      {distributionGroup ? distributionGroup.id : undefined}
                    </Text>
                  </div>
                ) : null}

                {!(isDefaultDistributionGroup || isDogfoodDistributionGroup) ? (
                  <>
                    <ConfigureWell
                      active={isPublicGroup}
                      disabled={isLoading || isSharedGroup}
                      title={t("distribute:groupSettings.publicDistributionGroup")}
                      onChanged={onIsPublicToggleChanged}
                      data-test-id="is-public-configure-well"
                    >
                      <div className={styles.publicUrlContainer}>
                        <Paragraph className={styles.publicUrlTitle} size={Size.Small} color={TextColor.Secondary}>
                          {DistributionGroupSettingsStrings.PublicUrl}
                        </Paragraph>
                        <a target="_blank" href={publicUrl}>
                          <Text
                            className={styles.publicUrl}
                            size={Size.Small}
                            color={TextColor.Primary}
                            underline
                            data-test-id="public-url"
                          >
                            {publicUrlWithoutProtocol}
                          </Text>
                        </a>
                      </div>
                    </ConfigureWell>
                    <ConfirmationDialog
                      visible={turnOffPublicAccessDialogVisible}
                      title={t("distribute:groupSettings.turnOffPublicAccess.title")}
                      description={t("distribute:groupSettings.turnOffPublicAccess.description")}
                      confirmButton={t("common:button.turnOff")}
                      onConfirm={finishTurnOffPublicAccess}
                      cancelButton={t("common:button.cancel")}
                      onCancel={hideTurnOffPublicAccess}
                    />
                  </>
                ) : null}

                {appStore.app.isIosApp && !(isSharedGroup || isDogfoodDistributionGroup) ? (
                  <>
                    <ConfigureWell
                      active={automaticallyManageDevices}
                      disabled={isLoading}
                      title={t("distribute:groupSettings.automaticallyManageDevices.title")}
                      subtitle={
                        automaticallyManageDevices
                          ? (null as any)
                          : t("distribute:groupSettings.automaticallyManageDevices.description")
                      }
                      onChanged={onAutomaticallyManageDevicesToggleChanged}
                      data-test-id="automatically-manage-devices-configure-well"
                    >
                      <>
                        <Text size={Size.Medium} spaceBelow={Space.XXSmall} color={TextColor.Primary}>
                          {t("distribute:credentials.apple.developerAccount.label")}
                        </Text>
                        <CredentialDropdown
                          placeholder={t("distribute:registerNewDevices.appleDeveloperAccountPlaceHolder")}
                          aria-label={t("distribute:credentials.apple.developerAccount.label")}
                          onAdd={startAddNewAccount}
                          credentials={appleCredentials}
                          onChange={onCredentialSelect(selectedAppleCredential!)}
                          selectedCredential={selectedAppleCredential!}
                          addLabel={t("distribute:groupSettings.addAccount")}
                          onFixCredentialClick={onReconnectAppleCredentialsClicked}
                          data-test-id="apple-developer-account-select"
                        />
                        <Text size={Size.Medium} color={TextColor.Primary} spaceBelow={Space.XXSmall} spaceAbove={Space.Medium}>
                          {t("distribute:credentials.apple.certificateAccount.label")}
                        </Text>
                        <CredentialDropdown
                          placeholder={t("distribute:registerNewDevices.appleCertificatePlaceHolder")}
                          aria-label={t("distribute:credentials.apple.certificateAccount.label")}
                          onAdd={startAddNewCertificate}
                          credentials={appleCertificates}
                          onChange={onCredentialSelect(selectedAppleCertificate!)}
                          selectedCredential={selectedAppleCertificate!}
                          addLabel={t("distribute:groupSettings.addCertificate")}
                          onFixCredentialClick={onReplaceAppleCertificateClicked}
                          data-test-id="apple-certificate-select"
                        />
                        <CertificateUploadDialog
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
                        <AppleConnectionDialog
                          enableTwoFactorAuth={true}
                          isVisible={showAddCredentialDialog}
                          onSuccess={finishAddNewAccount}
                          onCancel={cancelAddNewAccount}
                        />
                        <AppleConnectionDialog
                          enableTwoFactorAuth={true}
                          existingCredential={selectedAppleCredential}
                          isVisible={showReconnectCredentialDialog}
                          onSuccess={finishReconnectAccount}
                          onCancel={cancelReconnectAccount}
                        />
                        <ConfirmationDialog
                          visible={updateCredentialDialogVisible}
                          title={switchCredentialDialogTitle}
                          description={switchCredentialDialogDescription}
                          confirmButton={t("common:button.change")}
                          onConfirm={finishConfirmUpdateCredential}
                          cancelButton={t("common:button.cancel")}
                          onCancel={cancelConfirmUpdateCredential}
                          danger
                        />
                      </>
                    </ConfigureWell>
                    <ConfirmationDialog
                      visible={turnOffAutoprovisioningVisible}
                      title={t("distribute:groupSettings.turnOffAutoManageDevices.title")}
                      description={t("distribute:groupSettings.turnOffAutoManageDevices.description")}
                      confirmButton={t("common:button.turnOff")}
                      onConfirm={finishTurnOffAutoProvisioning}
                      cancelButton={t("common:button.cancel")}
                      onCancel={hideTurnOffAutoProvisioning}
                    />
                  </>
                ) : null}
              </Autofocus>
              {bottomBar}
            </Page>
          );
        }
      }
    )
  )
);
