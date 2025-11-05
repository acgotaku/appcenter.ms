import * as React from "react";
import { observer } from "mobx-react";
import { times, sum } from "lodash";
import {
  Modalify,
  Page,
  PageHeader,
  PanelInjectedProps,
  SingleSelectActionList,
  Text,
  BorderlessSearchBar,
  ButtonContainer,
  BackButton,
  NextButton,
  Color,
  PrimaryButton,
  InputSize,
  ActionList,
  MediaObject,
  PageNotification,
  TextColor,
  FooterArea,
  Paragraph,
} from "@root/shared";
import { Grid, RowCol, GridSpacing, Row } from "@root/shared/grid";
import { Size } from "@root/shared/typography";
import { ServiceActionItem } from "../service-action-item";
import { ServiceConnectionDialogForm } from "../service-connection-dialog-form";
import { ServiceConnectionDialogFormUIStore } from "../service-connection-dialog-form-ui-store";
import { RouteComponentProps } from "react-router";
import { bugTrackerWizardUIStore, BugTrackerWizardUIStore, Step } from "./bugtracker-wizard-ui-store";
import { BugTrackerSettings } from "./bugtracker-settings";
import { ServicesStore } from "../services-store";
import { withTranslation, WithTranslation } from "react-i18next";
import { t } from "@root/lib/i18n";

export const BugTrackerWizard = Modalify({
  onRequestClose() {
    BugTrackerWizardUIStore.close();
    bugTrackerWizardUIStore.setStep(Step.AccountsAndServices);
  },
})(
  withTranslation(["common", "management"])(
    observer(
      class BugTrackerWizard extends React.Component<PanelInjectedProps & RouteComponentProps<any, any> & WithTranslation, {}> {
        private serviceConnectionDialogFormUIStore = new ServiceConnectionDialogFormUIStore();

        private renderHeaderSubtitle = () => {
          const store = bugTrackerWizardUIStore;
          return (
            <Paragraph size={Size.Medium} color={TextColor.Secondary} ellipsize={true}>
              {store.selectedRepoName}
            </Paragraph>
          );
        };

        public componentDidMount() {
          bugTrackerWizardUIStore.fetchRepos();
        }
        public render() {
          const store = bugTrackerWizardUIStore;
          const { bugTracker } = store;
          const content = (() => {
            switch (store.step) {
              case Step.AccountsAndServices:
                return this.renderAccountAndServices();
              case Step.Repos:
                return this.renderRepos();
              case Step.Settings:
                return <BugTrackerSettings store={store} disabled={store.isAdding} />;
            }
          })();
          const results = sum(store.repos.map((repo) => repo.repos.length));

          return (
            <Page
              white
              data-test-id="bugtracker-wizard-page"
              header={
                store.step === Step.Repos ? (
                  <PageHeader
                    loading={store.isFetching}
                    icon={bugTracker.type && store.getIcon(bugTracker.type)}
                    title={store.getBugtrackerTitle(bugTracker.type)}
                  >
                    <BorderlessSearchBar
                      disabled={store.isFetchingRepos}
                      size={InputSize.Small}
                      placeholder={bugTrackerWizardUIStore.getSearchText(bugTracker.type)}
                      onChange={(event) => store.setRepoFilter(event.target.value)}
                      value={store.repoFilter}
                      resultsCount={results}
                    />
                  </PageHeader>
                ) : (
                  <PageHeader
                    title={t("management:appServices.bugTracker.addBugTracker")}
                    subtitle={store.step === Step.Settings ? this.renderHeaderSubtitle : undefined}
                    loading={store.isFetching}
                  />
                )
              }
              footer={
                <FooterArea alignRight>
                  <ButtonContainer>
                    {store.hasPrevious ? <BackButton onClick={() => store.previous()} /> : null}
                    {store.hasNext ? (
                      <NextButton
                        onClick={() => store.next()}
                        color={Color.Blue}
                        disabled={!bugTracker.type || !store.canGoNext}
                        data-test-id="bugtracker-wizard-next-button"
                      />
                    ) : null}
                    {store.canAdd ? (
                      <PrimaryButton
                        progress={store.isAdding}
                        color={Color.Blue}
                        disabled={!bugTracker.isValid || store.isAdding}
                        onClick={() => store.add()}
                        key="send"
                        data-test-id="bugtracker-wizard-add-button"
                      >
                        {t("common:button.add")}
                      </PrimaryButton>
                    ) : null}
                  </ButtonContainer>
                </FooterArea>
              }
            >
              {store.notification ? (
                <PageNotification
                  type={store.notification.type}
                  children={
                    store.notification.message ===
                    "You do not have permissions to add the Jira bug tracker. You need to have global admin permissions to do that." ? (
                      <div>
                        {store.notification.message}{" "}
                        <a
                          href="https://confluence.atlassian.com/adminjiraserver073/managing-global-permissions-861253290.html"
                          target="_blank"
                        >
                          Learn more
                        </a>{" "}
                      </div>
                    ) : (
                      store.notification.message
                    )
                  }
                />
              ) : null}
              {content}
            </Page>
          );
        }

        public renderAccountAndServices() {
          const accounts = bugTrackerWizardUIStore.accounts;
          const services = ServicesStore.bugTrackerServices;

          return (
            <Grid rowSpacing={GridSpacing.Medium}>
              <ServiceConnectionDialogForm store={this.serviceConnectionDialogFormUIStore} />
              {accounts && accounts.length > 0 ? (
                <RowCol data-test-id="connected-accounts">
                  <Grid rowSpacing={GridSpacing.Medium}>
                    <RowCol>
                      <Text size={Size.Large}>{t("management:appServices.bugTracker.connectedAccounts")}:</Text>
                    </RowCol>
                    <RowCol>
                      <ActionList>
                        {accounts.map((account) => (
                          <ServiceActionItem
                            key={account.accessTokenId}
                            onClick={() => bugTrackerWizardUIStore.filterAndSetAccount(account.accessTokenId)}
                            icon={bugTrackerWizardUIStore.getIcon(account.externalProviderName || "")}
                            title={bugTrackerWizardUIStore.getBugtrackerTitle(account.externalProviderName)}
                            subTitle={account.externalAccountName || account.externalUserEmail}
                          />
                        ))}
                      </ActionList>
                    </RowCol>
                  </Grid>
                </RowCol>
              ) : null}
              <RowCol data-test-id="select-service">
                <Grid rowSpacing={GridSpacing.Medium}>
                  <RowCol>
                    <Text size={Size.Large}>{t("management:appServices.bugTracker.selectService")}:</Text>
                  </RowCol>
                  <RowCol>
                    <ActionList>
                      {services.map((service) =>
                        service.isOAuth ? (
                          <ServiceActionItem key={service.type} icon={service.icon} title={service.name} href={service.url} />
                        ) : (
                          <ServiceActionItem
                            key={service.type}
                            icon={service.icon}
                            title={service.name}
                            onClick={() => this.serviceConnectionDialogFormUIStore.setServiceAndShowForm(service)}
                          />
                        )
                      )}
                    </ActionList>
                  </RowCol>
                </Grid>
              </RowCol>
            </Grid>
          );
        }

        public renderRepos() {
          const store = bugTrackerWizardUIStore;
          const repos = store.repos;

          const ownerRepos: (JSX.Element | JSX.Element[])[] = [];
          const selectedRepoId = !store.isFetchingRepos ? store.selectedRepoId : "";

          if (store.isFetchingRepos) {
            ownerRepos.push(
              <Row key="header">
                <MediaObject skeleton textOnly>
                  <label style={{ marginLeft: "10px" }}>@unknown</label>
                  <label style={{ marginLeft: "10px" }}>@unknown</label>
                </MediaObject>
              </Row>
            );

            ownerRepos.push(times(4, (i) => <ServiceActionItem skeleton key={i} value="" title="" subTitle="" />));
          } else if (store.repos) {
            repos.forEach((ownerRepo) => {
              ownerRepos.push(
                <Row key={ownerRepo.owner.id}>
                  <MediaObject textOnly>
                    <Text size={Size.Medium} color={TextColor.Primary}>
                      {ownerRepo.owner.name || ownerRepo.repos[0].displayLogin}
                    </Text>
                    {ownerRepo.owner.name ? (
                      <Text size={Size.Small} color={TextColor.Secondary}>
                        {ownerRepo.repos[0].displayLogin}
                      </Text>
                    ) : null}
                  </MediaObject>
                </Row>
              );

              ownerRepo.repos.forEach((repo) => {
                ownerRepos.push(
                  <ServiceActionItem key={repo.id} value={repo.id} title={repo.name || ""} subTitle={repo.description} />
                );
              });
            });
          }

          return (
            <div>
              <Grid bordered rowSpacing={GridSpacing.None}>
                <RowCol>
                  <SingleSelectActionList
                    name="connected-bug-tracker"
                    value={selectedRepoId}
                    onChange={(repo: string) => store.setSelectedRepoId(repo)}
                  >
                    {ownerRepos}
                  </SingleSelectActionList>
                </RowCol>
              </Grid>
            </div>
          );
        }
      }
    )
  )
);
