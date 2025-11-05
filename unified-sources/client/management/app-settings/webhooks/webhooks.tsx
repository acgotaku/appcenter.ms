import * as React from "react";
import {
  EmptyState,
  Panelify,
  Page,
  PanelOutlet,
  PrimaryButton,
  PanelInjectedProps,
  Table,
  Row,
  PageNotification,
  TextCell,
  Cell,
  IconName,
  Tooltip,
  IconTooltip,
  IconSize,
  ButtonSize,
  ConfirmationDialog,
  Menu,
  Trigger,
  Action,
  ParagraphProps,
  Paragraph,
  PageHeader,
} from "@root/shared";
import { RouteComponentProps } from "react-router";
import { observer } from "mobx-react";
import { locationStore } from "@root/stores";
import { WebhooksUIStore } from "./webhooks-ui-store";
import { WebhookStatus } from "./webhook-status";
import { Webhook } from "@root/data/management";
import { MsTeamsWebhookDocURL, SlackWebhookDocURL } from "@root/data/management/constants";
import { Observer } from "mobx-react";
import { withTranslation, WithTranslation, Trans } from "react-i18next";
import { t } from "@root/lib/i18n";

const styles = require("./webhooks.scss");

/**
 * The main Webhook page.
 */
export const Webhooks = Panelify(
  withTranslation(["common", "management"])(
    observer(
      class Webhooks extends React.Component<PanelInjectedProps & RouteComponentProps<any, any> & WithTranslation, {}> {
        private webhooksUiStore = new WebhooksUIStore();

        /** Table columns definition */
        private columns = [
          {
            title: this.props.t("management:appWebhooks.name"),
            width: 0.3,
            sortable: false,
          },
          {
            title: this.props.t("management:webhookDetails.url.label"),
            width: 0.4,
            sortable: false,
          },
          {
            title: this.props.t("management:appWebhooks.status"),
            width: 0.2,
            sortable: false,
          },
          {
            title: "",
            width: 0.1,
            sortable: false,
          },
        ];

        private renderSubtitle = (subtitleProps: ParagraphProps) => {
          const { canCreateWebhooks } = this.webhooksUiStore;
          return (
            <Paragraph {...subtitleProps}>
              {!canCreateWebhooks ? t("management:appWebhooks.emptyUnauthorizedSubtitle") : null}
              <>
                {t("management:appWebhooks.emptyDescriptionSubtitle")}
                <br />
                <Trans i18nKey="management:appWebhooks.emptyDescriptionLinksText">
                  test
                  <a href={MsTeamsWebhookDocURL} target="_blank">
                    Microsoft Teams
                  </a>
                  test
                  <a href={SlackWebhookDocURL} target="_blank">
                    Slack
                  </a>
                </Trans>
              </>
            </Paragraph>
          );
        };

        public UNSAFE_componentWillMount() {
          this.webhooksUiStore.fetchWebhooks();
        }

        public render() {
          const { params, t } = this.props;
          const store = this.webhooksUiStore;

          let content: JSX.Element | null = null;
          if (store.isFetching) {
            content = <div />;
          } else if (store.isEmpty) {
            content = (
              <EmptyState
                hideImage
                className={styles["empty-state"]}
                title={t("management:appWebhooks.emptyTitle")}
                subtitle={this.renderSubtitle}
                buttonText={t("management:appWebhooks.newWebhook")}
                to={locationStore.getUrlWithCurrentApp("settings/webhooks/create")}
                hideButton={!store.canCreateWebhooks}
                data-test-id="webhooks-empty-state"
              />
            );
          } else {
            content = (
              <div>
                <Table
                  data-test-id="webhook-table"
                  title={t("management:appWebhooks.title")}
                  headerCheckboxAriaLabel={t("management:appWebhooks.title")}
                  columns={this.columns}
                  activeRow={(webhook) => webhook.id === params.actualRow}
                  data={store.webhooks}
                  toolbar={
                    store.canCreateWebhooks ? (
                      <Tooltip>
                        <Trigger>
                          <PrimaryButton
                            role="button"
                            icon={IconName.Add}
                            size={ButtonSize.Small}
                            to={locationStore.getUrlWithCurrentApp("settings/webhooks/create")}
                            aria-label={t("management:appWebhooks.newWebhook")}
                          />
                        </Trigger>
                        {t("management:appWebhooks.newWebhook")}
                      </Tooltip>
                    ) : (
                      (null as any)
                    )
                  }
                  selectable={store.canRemoveWebhooks}
                  selectedItemsString={(count) => t("management:appWebhooks.selectedHeader", { count })}
                  renderSelectionToolbar={(selectedRows) => (
                    <PrimaryButton
                      data-test-id="delete-button"
                      size={ButtonSize.Small}
                      onClick={() => store.removeWebhooks(selectedRows)}
                    >
                      {t("button.delete")}
                    </PrimaryButton>
                  )}
                  renderRow={(webhook, props) => (
                    <Row
                      {...props}
                      label={webhook.name}
                      to={locationStore.getUrlWithCurrentApp("/settings/webhooks/:webhook_id", { webhook_id: webhook.id } as any)}
                    >
                      <TextCell className={styles["name"]} link>
                        <Observer>{() => <div className={styles["cell-content"]}>{webhook.name}</div>}</Observer>
                      </TextCell>
                      <TextCell>
                        <Observer>{() => <div className={styles["cell-content"]}>{webhook.url}</div>}</Observer>
                      </TextCell>
                      <TextCell data-test-class="webhook-status">
                        <Observer>{() => <WebhookStatus webhook={webhook} />}</Observer>
                      </TextCell>
                      {store.canTestWebhooks || store.canEditWebhooks || store.canTestWebhooks ? (
                        <Cell hideUntilRowHover className={styles["menu-button-container"]}>
                          <Observer>
                            {() => (
                              <Menu data-test-class="three-dots">
                                <Trigger>
                                  <IconTooltip clickable icon={IconName.More} size={IconSize.XSmall}>
                                    {t("management:moreButtonText")}
                                  </IconTooltip>
                                </Trigger>
                                {store.canTestWebhooks ? (
                                  <Action
                                    data-test-class="test-button"
                                    onClick={(event) => {
                                      event.preventDefault();
                                      store.testWebhook(webhook);
                                    }}
                                    text={t("management:appWebhooks.testWebhook")}
                                  />
                                ) : null}
                                {store.canEditWebhooks ? (
                                  <Action
                                    data-test-class="status-button"
                                    onClick={(event) => {
                                      event.preventDefault();
                                      store.switchWebhookState(webhook);
                                    }}
                                    text={webhook.enabled ? t("button.disable") : t("button.enable")}
                                  />
                                ) : null}
                                {store.canRemoveWebhooks ? (
                                  <Action
                                    data-test-class="remove-button"
                                    onClick={(event) => {
                                      event.preventDefault();
                                      store.removeWebhooks(
                                        new Set<Webhook>([webhook])
                                      );
                                    }}
                                    text={t("button.delete")}
                                  >
                                    <span className={styles["remove-item-text"]}>{t("button.delete")}</span>
                                  </Action>
                                ) : null}
                              </Menu>
                            )}
                          </Observer>
                        </Cell>
                      ) : null}
                    </Row>
                  )}
                  renderPlaceholderRow={(props) => (
                    <Row {...props}>
                      <TextCell skeleton />
                      <TextCell skeleton />
                      <TextCell skeleton />
                    </Row>
                  )}
                  eventualRowCount={store.placeholderRowCount}
                />
                <ConfirmationDialog
                  danger
                  data-test-id="delete-webhook-dialog"
                  visible={store.removeWebhooksWarningIsVisible}
                  onCancel={() => store.cancelRemovingWebhooks()}
                  onConfirm={() => store.finishRemovingWebhooks()}
                  title={
                    store.removingWebhooks
                      ? store.removingWebhooks.length === 1
                        ? t("management:webhookDetails.deleteDialog.title", { webhook: store.removingWebhooks[0] })
                        : t("management:appWebhooks.deleteSelected", { webhooks: store.removingWebhooks.length })
                      : ""
                  }
                  description={t("management:webhookDetails.deleteDialog.message")}
                  cancelButton={t("button.cancel")}
                  confirmButton={t("button.delete")}
                />
              </div>
            );
          }

          return (
            <Page
              data-test-id="webhooks-page"
              header={<PageHeader title={t("management:appWebhooks.title")} loading={store.isLoading} />}
            >
              {store.notification ? <PageNotification type={store.notification.type} children={store.notification.message} /> : null}
              {content}
              <PanelOutlet>{this.props.children}</PanelOutlet>
            </Page>
          );
        }
      }
    )
  )
);
