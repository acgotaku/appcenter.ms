import * as React from "react";
import * as pluralize from "pluralize";
import {
  Checkbox,
  Color,
  Paragraph,
  Text,
  TextColor,
  Size,
  Modalify,
  OrganizationIcon,
  Wizard,
  Gravatar,
  Space,
  ConfirmationDialog,
  MessageBar,
  NotificationType,
  TabProps,
  UserInitialsAvatar,
} from "@root/shared";
import { CloseAccountStore } from "@root/management/stores/user/close-account-store";
import { IUser, IOrganization } from "@lib/common-interfaces";
import { CloseAccountActionList } from "@root/management/settings/profile/close-account/close-account-action-list";
import { Link } from "react-router";
import { logger } from "@root/lib/telemetry";
import { withTranslation, WithTranslation } from "react-i18next";
import * as i18next from "i18next";
import { noop } from "lodash";

const styles = require("./close-account-orgs.scss");

const OrganizationLink: React.SFC<{ orgName: string; t: i18next.TFunction }> = ({ orgName, t }) => {
  const appCenterLink = `/orgs/${orgName}/people`;
  const text = t("management:closeAccount:orgActionAssignAdmin");
  return (
    <Link to={appCenterLink}>
      <Text color={TextColor.Link} size={Size.Medium}>
        {text}
      </Text>
    </Link>
  );
};
OrganizationLink.displayName = "OrganizationLink";

export class CloseAccountWizardState {
  step!: number;
  tabs!: TabProps[];
  allowFinalStep!: boolean;
  confirmationDialogVisible!: boolean;
  isDeleting!: boolean;
  showCallToAction!: boolean;
  isError!: boolean;
  errorMessage!: string;
}

const defaultTabs: TabProps[] = [
  {
    id: "review-organizations-tab",
    "aria-controls": "review-organizations",
    title: "Organizations",
  },
  {
    id: "confirm-close-account-tab",
    "aria-controls": "confirm-close-account",
    title: "Confirm",
  },
];

export const CloseAccountWizard = Modalify(
  withTranslation(["management"])(
    class CloseAccountWizard extends React.Component<WithTranslation, CloseAccountWizardState> {
      private store: CloseAccountStore = new CloseAccountStore();

      constructor(props) {
        super(props);
        this.state = {
          step: 0,
          tabs: defaultTabs,
          allowFinalStep: false,
          confirmationDialogVisible: false,
          isDeleting: false,
          showCallToAction: true,
          isError: false,
          errorMessage: "",
        };
      }

      async UNSAFE_componentWillMount() {
        await this.store.fetch().catch(noop);
        const showCallToAction = this.store.organizations.length > 0;
        const [, summary] = defaultTabs;
        this.setState({
          showCallToAction: showCallToAction,
          tabs: showCallToAction ? defaultTabs : [summary],
        });
      }

      private goToPreviousStep = () => {
        if (this.state.step > 0) {
          this.setState(({ step, allowFinalStep }) => ({ step: step - 1, allowFinalStep: false }));
        }
      };

      private renderAction = (item) => {
        const { t } = this.props;
        return <OrganizationLink orgName={item.organization.name} t={t} />;
      };

      private showConfirmation = () => {
        this.setState({ confirmationDialogVisible: true });
      };

      private hideConfirmation = () => {
        this.setState({ confirmationDialogVisible: false });
      };

      private triggerAccountDeletion = async () => {
        logger.info("settings/profile/close-account-wizard/confirmation/clicked");
        this.setState({
          isDeleting: true,
        });
        this.hideConfirmation();
        return this.store.closeAccount().catch((error) => {
          this.setState({
            isDeleting: false,
            isError: true,
            errorMessage: error.message,
          });
        });
      };

      private getItemName(item: IUser | IOrganization): string {
        return item.display_name || item.name!;
      }

      render() {
        const { step, tabs, allowFinalStep, isDeleting, showCallToAction, isError, errorMessage } = this.state;
        const { t } = this.props;
        const { isLoading, user } = this.store;
        const organizations = this.store.organizations;
        const iconSize = 30;
        const showLoading = isLoading || isDeleting;

        const confirmationPage = () => {
          return (
            <>
              <Paragraph size={Size.Medium} spaceBelow={Space.Medium}>
                {t("management:closeAccount:confirmationStep:warning")}
              </Paragraph>
              <Paragraph bold size={Size.Medium} spaceBelow={Space.Medium}>
                {t("management:closeAccount:confirmationStep:explanation")}
              </Paragraph>
              <CloseAccountActionList
                skeleton={showLoading}
                first
                items={[user]}
                renderIcon={(item) => (
                  <Gravatar
                    size={iconSize}
                    email={item.email}
                    fallback={<UserInitialsAvatar initialsName={item.name} size={iconSize} />}
                  />
                )}
                renderTitle={(item) => this.getItemName(item)}
                renderAction={(item) => `${item.appsCount}  ${pluralize("app", item.appsCount)}`}
                getKey={(item) => item.id}
              />
              <CloseAccountActionList
                skeleton={showLoading}
                items={organizations}
                renderIcon={(item) => <OrganizationIcon size={iconSize} organization={item.organization} />}
                renderTitle={(item) => this.getItemName(item.organization)}
                renderAction={(item) => `${item.appsCount}  ${pluralize("app", item.appsCount)}`}
                getKey={(item) => item.organization.id}
              />
              <Paragraph bold size={Size.Medium} spaceAbove={Space.Medium} spaceBelow={Space.Medium}>
                {t("management:closeAccount:confirmationStep:confirmAction")}
              </Paragraph>
              <Checkbox
                onChange={(event: React.SyntheticEvent<HTMLInputElement>) =>
                  this.setState({ allowFinalStep: event.currentTarget.checked })
                }
              >
                {t("management:closeAccount:confirmationStep:explanation2")}
              </Checkbox>
              {isError ? <MessageBar type={NotificationType.Error}>Something went wrong. ({errorMessage})</MessageBar> : null}
            </>
          );
        };

        return (
          <>
            <ConfirmationDialog
              danger
              visible={this.state.confirmationDialogVisible}
              onCancel={this.hideConfirmation}
              onConfirm={this.triggerAccountDeletion}
              title={t("management:closeAccount:confirmationDialog:title")}
              description={t("management:closeAccount:confirmationDialog:description")}
              cancelButton={t("management:closeAccount:confirmationDialog:cancel")}
              confirmButton={t("management:closeAccount:confirmationDialog:confirm")}
            />
            <Wizard
              supportsMobile
              step={step}
              loading={showLoading}
              renderHeader={({ PageHeader }) => (
                <PageHeader
                  title={t("management:closeAccount:topBar:title")}
                  renderTitle={(TitleText, title) => <TitleText spaceBelow={Space.Small}>{title}</TitleText>}
                />
              )}
              renderFooter={({ ButtonContainer, BackButton, NextButton, DoneButton }) => (
                <ButtonContainer>
                  {step > 0 ? (
                    <BackButton disabled={isDeleting} onClick={this.goToPreviousStep}>
                      {t("management:closeAccount:previousStep")}
                    </BackButton>
                  ) : null}
                  {step === tabs.length - 1 ? (
                    <DoneButton color={Color.Red} disabled={!allowFinalStep} onClick={this.showConfirmation}>
                      {t("management:closeAccount:confirmation")}
                    </DoneButton>
                  ) : null}
                </ButtonContainer>
              )}
              childrenPassthrough={this.props.children}
            >
              {(TabSections, TabSection) => (
                <TabSections selectedIndex={step}>
                  {showCallToAction ? (
                    <TabSection id="close-account-step-1-panel" aria-labelledby={undefined as any}>
                      {!isLoading ? (
                        <Paragraph className={styles.paragraph} size={Size.Medium}>
                          {t("management:closeAccount:callToActionStep:explanation", { count: organizations.length })}&nbsp;
                          <Link
                            target="_blank"
                            to={
                              "https://docs.microsoft.com/en-us/appcenter/dashboard/creating-and-managing-organizations#changing-users-organization-roles"
                            }
                          >
                            {t("management:closeAccount:callToActionStep:learnAssignNewAdmin")}
                          </Link>
                        </Paragraph>
                      ) : null}
                      <CloseAccountActionList
                        skeleton={showLoading}
                        items={organizations}
                        renderIcon={(item) => <OrganizationIcon size={iconSize} organization={item.organization} />}
                        renderTitle={(item) => this.getItemName(item.organization)}
                        renderSubTitle={(item) => `${item.appsCount}  ${pluralize("app", item.appsCount)}`}
                        renderAction={this.renderAction}
                        getKey={(item) => item.organization.id}
                      />
                    </TabSection>
                  ) : null}
                  <TabSection id="close-account-step-2-panel" aria-labelledby={undefined as any}>
                    {isDeleting ? (
                      <CloseAccountActionList
                        skeleton
                        items={organizations}
                        renderIcon={() => null as any}
                        renderTitle={() => null as any}
                        renderSubTitle={() => null as any}
                        renderAction={() => null as any}
                        getKey={(item) => item.organization.id}
                      />
                    ) : (
                      confirmationPage
                    )}
                  </TabSection>
                </TabSections>
              )}
            </Wizard>
          </>
        );
      }
    }
  )
);
