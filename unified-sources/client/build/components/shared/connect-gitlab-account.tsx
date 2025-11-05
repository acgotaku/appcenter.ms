import * as React from "react";
import {
  Page,
  PageHeader,
  FooterArea,
  IconName,
  ButtonContainer,
  SecondaryButton,
  PrimaryButton,
  Grid,
  GridRowCol,
  Paragraph,
  Size,
  Space,
  TextColor,
  Input,
  MessageBar,
  NotificationType,
} from "@root/shared";
import { WithRouterProps } from "react-router";
import { WithTranslation } from "react-i18next";
import { ConnectGitLabAccountUIStore } from "@root/build/components/shared/connect-gitlab-account-ui-store";

export class ConnectGitLabAccount extends React.Component<WithRouterProps & WithTranslation> {
  private uiStore = new ConnectGitLabAccountUIStore();
  private onClose: () => void;

  public constructor(props: WithRouterProps & WithTranslation, onClose: () => void) {
    super(props);
    this.onClose = onClose;
    if (this.props.params.id) {
      this.uiStore.loadCredential(this.props.params.id);
    }
  }

  componentDidUpdate(prevProps: WithRouterProps & WithTranslation) {
    if (this.props.params.id && prevProps.params.id !== this.props.params.id) {
      this.uiStore.resetState();
      this.uiStore.loadCredential(this.props.params.id);
    }
  }

  render(): JSX.Element {
    const { t } = this.props;
    const { isValid, otherCredentialExists, baseUrl, accessToken, isLoading, isNewRecord, isDifferentOwner } = this.uiStore;

    const showAddModal = isNewRecord || (isDifferentOwner && !otherCredentialExists);
    return (
      <Page
        header={<PageHeader loading={isLoading} icon={IconName.GitLab} title="GitLab" />}
        footer={
          <FooterArea alignRight>
            <ButtonContainer>
              <SecondaryButton onClick={this.close}>{t("common:button.cancel")}</SecondaryButton>
              <PrimaryButton disabled={!isValid || isLoading} onClick={showAddModal ? this.connectAccount : this.updateAccount}>
                {t(`common:button.${showAddModal ? "connect" : "update"}`)}
              </PrimaryButton>
            </ButtonContainer>
          </FooterArea>
        }
      >
        <Grid>
          {this.renderGenericErrorMessage()}
          <GridRowCol>
            <Paragraph size={Size.Large} bold spaceAbove={Space.Small} spaceBelow={Space.XSmall}>
              {t(`build:connect.gitlab.${showAddModal ? "add" : "update"}Instance`)}
            </Paragraph>
            <Paragraph size={Size.Medium} color={TextColor.Secondary} spaceBelow={Space.XSmall}>
              {t(`build:connect.gitlab.${showAddModal ? "add" : "update"}InstanceDescription`)}
            </Paragraph>
            <Paragraph size={Size.Medium} spaceAbove={Space.Small} spaceBelow={Space.XSmall}>
              {t("build:connect.gitlab.instanceUrl")}
            </Paragraph>
            <Input
              disabled={isLoading || !isNewRecord || isDifferentOwner}
              invalid={!this.uiStore.instanceUrlValid}
              value={baseUrl}
              onChange={this.setBaseUrl}
              placeholder={t("build:connect.gitlab.instanceUrlPlaceholder")}
            />
            <Paragraph size={Size.Small} spaceAbove={Space.XXSmall} color={TextColor.Error} aria-live="polite">
              {this.uiStore.instanceUrlErrorMessage}
            </Paragraph>
          </GridRowCol>
          <GridRowCol>
            <Paragraph size={Size.Medium} spaceBelow={Space.XSmall}>
              {t("build:connect.gitlab.accessToken")}
            </Paragraph>
            <Input
              type="password"
              disabled={isLoading}
              invalid={!this.uiStore.accessTokenValid}
              value={accessToken}
              onChange={this.setAccessToken}
              placeholder={t("build:connect.gitlab.accessTokenPlaceholder")}
            />
            <Paragraph size={Size.Small} spaceAbove={Space.XXSmall} color={TextColor.Error} aria-live="polite">
              {this.uiStore.accessTokenErrorMessage}
            </Paragraph>
          </GridRowCol>
        </Grid>
      </Page>
    );
  }

  renderGenericErrorMessage(): JSX.Element | undefined {
    if (!!this.uiStore.genericErrorMessage) {
      return (
        <GridRowCol>
          <Paragraph size={Size.Medium} spaceAbove={Space.Medium}>
            <MessageBar type={NotificationType.Error} container="Well">
              {this.uiStore.genericErrorMessage}
            </MessageBar>
          </Paragraph>
        </GridRowCol>
      );
    }
    return undefined;
  }

  private setBaseUrl = (e: React.ChangeEvent<HTMLInputElement>) => this.uiStore.setBaseUrl(e.target.value);

  private setAccessToken = (e: React.ChangeEvent<HTMLInputElement>) => this.uiStore.setAccessToken(e.target.value);

  private close = () => {
    this.uiStore.resetState();
    this.onClose();
  };

  private connectAccount = () => {
    const result = this.uiStore.connectAccount();
    if (!!result) {
      result.onSuccess(this.close);
    }
  };

  private updateAccount = () => {
    const result = this.uiStore.updateAccount();
    if (!!result) {
      result.onSuccess(this.close);
    }
  };
}
