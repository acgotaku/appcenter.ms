import * as React from "react";
import { expr } from "mobx-utils";
import { observer } from "mobx-react";
import { RouteComponentProps } from "react-router";
import {
  Page,
  Panelify,
  PanelInjectedProps,
  PanelOutlet,
  PanelPosition,
  Title,
  Paragraph,
  Size,
  TextColor,
  MediaObject,
  ConfirmationDialog,
  Space,
  Text,
  autofetch,
  RowCol,
  Card,
  HeaderArea,
  PrimaryButton,
  ButtonSize,
  Menu,
  Action,
  Trigger,
  ClickableIcon,
  IconName,
  PageHeader,
} from "@root/shared";
import { SubscriptionList } from "./subscription-list/subscription-list";
import { SubscriptionType } from "@root/data/management/models/azure-subscription";
import { azureSubscriptionStore } from "@root/data/management/stores/azure-subscription-store";
import { AzureUIStore } from "./azure-ui-store";
import { withTranslation, WithTranslation, Trans } from "react-i18next";
import { Grid, GridSpacing, Row, Col } from "@root/shared/grid";
import { organizationStore } from "@root/stores";

const classNames = require("classnames");
const styles = require("./azure.scss");
const azureHappyCloudImg = require("./images/azure-subscription.svg");

type AzureSubscriptionsProps = PanelInjectedProps & RouteComponentProps<any, any> & WithTranslation;

export const Azure = Panelify(
  withTranslation(["management", "common"])(
    autofetch(azureSubscriptionStore, { methodName: "initUIStore" })(
      observer(
        class Azure extends React.Component<AzureSubscriptionsProps, {}> {
          private azureUiStore!: AzureUIStore;

          public initUIStore() {
            const orgName = expr(() => this.props.params.org_name);
            this.azureUiStore = new AzureUIStore(orgName ? SubscriptionType.Organization : SubscriptionType.User, orgName);
          }

          public render() {
            const { panelPosition, params, t } = this.props;
            const { subscriptionId, org_name } = params;
            const {
              isFetchingSubscriptions,
              subscriptions,
              owner,
              isFetchingSubscriptionFailed,
              isFetchingTenants,
              tenant,
              startTennatRemoval,
              isTenantRemovalDialogVisible,
              cancelTenantRemoval,
              disconnectTenant,
            } = this.azureUiStore;
            const condensed = panelPosition === PanelPosition.Secondary;
            const org = org_name ? organizationStore.find(org_name) : null;
            const linkTenantUrl = org_name
              ? `/auth/aad/tenant?original_url=/orgs/${org_name}/manage/azure/connect-tenant&org_id=${org!.id}`
              : null;
            const personalAccountErrorCheck = !!(window as any).initProps.aadTenantPersonalAccountErrorCheck;
            const isLinkTenantFailed = !!(window as any).initProps.aadTenantLinkingError;
            const linkingTenantDisplayError =
              isLinkTenantFailed && personalAccountErrorCheck
                ? t("management:aadTenantCard.personalAccountError")
                : t("management:aadTenantCard.connectionError");
            const isFetching = isFetchingSubscriptions || isFetchingTenants;

            return (
              <Page
                data-test-id={`manage-${org_name ? "org" : "app"}-azure-page`}
                supportsMobile
                header={
                  <PageHeader
                    title={condensed ? t("management:subscriptionList.title") : "Azure"}
                    loading={isFetching}
                    closeButton={!org_name}
                  />
                }
              >
                {!isFetching ? (
                  <>
                    <MediaObject
                      hSpace={Space.Large}
                      vSpace={Space.Small}
                      className={classNames(styles.banner, { [styles.hidden]: condensed })}
                      allowWrapping
                    >
                      <img alt="Azure" src={azureHappyCloudImg} />
                      <Title size={Size.Medium}>{t("management:subscriptionList.headerTitle")}</Title>
                      <Paragraph className={styles.subtitle} size={Size.Medium} color={TextColor.Secondary} ellipsize={false}>
                        {t("management:subscriptionList.headerDescription")} <br />
                        <a href="https://azure.microsoft.com/en-us/" target="_blank">
                          {t("management:subscriptionList.azureLearnMore")}
                        </a>
                      </Paragraph>
                    </MediaObject>
                    {isFetchingSubscriptionFailed ? (
                      <MediaObject textOnly>
                        <Text size={Size.Medium} color={TextColor.Secondary} bold>
                          {t("management:subscriptionList.error.subscriptionFetchError")}
                        </Text>
                        <Text size={Size.Medium} color={TextColor.Secondary} className={styles.refresh}>
                          <Trans i18nKey="management:subscriptionList.error.subscriptionFetchErrorAction">
                            <a href={window.location.href}></a>
                          </Trans>
                        </Text>
                      </MediaObject>
                    ) : null}
                    <Grid rowSpacing={GridSpacing.Page}>
                      <RowCol>
                        <SubscriptionList
                          subscriptions={subscriptions}
                          condensed={condensed}
                          selectedSubscriptionId={subscriptionId}
                          eventualSubscriptionCount={4}
                          owner={owner}
                          type={org_name ? SubscriptionType.Organization : SubscriptionType.User}
                        />
                      </RowCol>
                      {org_name ? (
                        <RowCol visible={PanelPosition.Primary}>
                          <Card
                            header={
                              <HeaderArea title={t("management:aadTenantCard.headerTitle")} className={condensed ? styles.hide : null}>
                                {!tenant ? (
                                  <PrimaryButton size={ButtonSize.Small} href={linkTenantUrl!}>
                                    {t("common:button:connect")}
                                  </PrimaryButton>
                                ) : null}
                              </HeaderArea>
                            }
                            withoutPadding={!!tenant}
                            dividedHeader
                          >
                            {isLinkTenantFailed ? (
                              <Paragraph size={Size.Medium} color={TextColor.Danger}>
                                {linkingTenantDisplayError}
                              </Paragraph>
                            ) : !tenant ? (
                              <Paragraph size={Size.Medium} color={TextColor.Secondary}>
                                {t("management:aadTenantCard.empty")}{" "}
                              </Paragraph>
                            ) : (
                              <Grid rowSpacing={GridSpacing.Medium} bordered padded>
                                <Row between>
                                  <Col>
                                    <Paragraph size={Size.Medium} bold>
                                      {tenant.displayName}
                                    </Paragraph>
                                  </Col>
                                  <Col shrink>
                                    <Menu>
                                      <Trigger>
                                        <ClickableIcon icon={IconName.More} />
                                      </Trigger>
                                      <Action text={t("common:button:disconnect")} onClick={startTennatRemoval} danger />
                                    </Menu>
                                  </Col>
                                </Row>
                              </Grid>
                            )}
                          </Card>
                        </RowCol>
                      ) : null}
                    </Grid>
                    <ConfirmationDialog
                      visible={isTenantRemovalDialogVisible}
                      title={t("management:azureActiveDirectory.disconnectTenantDialog.title")}
                      description={t("management:azureActiveDirectory.disconnectTenantDialog.message")}
                      confirmButton={t("common:button.disconnect")}
                      onConfirm={disconnectTenant(tenant)}
                      cancelButton={t("common:button.cancel")}
                      onCancel={cancelTenantRemoval}
                      danger
                    />
                  </>
                ) : null}
                <PanelOutlet>{this.props.children}</PanelOutlet>
              </Page>
            );
          }
        }
      )
    )
  )
);
