import * as React from "react";
import { Link, RouteComponentProps } from "react-router";
import { observer } from "mobx-react";
import { Panelify, Page, Stretch, Toggle, Card, PageHeader, MessageBar } from "@root/shared";
import { Grid, RowCol, GridSpacing } from "@root/shared/grid";
import { Title, Paragraph, Size, TextColor } from "@root/shared/typography";
import { NotificationsUIStore } from "./notifications-ui-store";
import { withTranslation, WithTranslation, Trans } from "react-i18next";
import { NotificationSettingsSections } from "../../shared/notification-settings-sections/notification-settings-sections";
import { NotificationType } from "@lib/common-interfaces";

export const Notifications = Panelify(
  withTranslation(["common", "management"])(
    observer(
      class Notifications extends React.Component<
        { notificationsFor: "app" | "user" } & WithTranslation & RouteComponentProps<any, any>,
        {}
      > {
        private notificationsUIStore = new NotificationsUIStore();
        public UNSAFE_componentWillReceiveProps(nextProps) {
          if (this.props.params.app_name !== nextProps.params.app_name) {
            this.notificationsUIStore = new NotificationsUIStore();
          }
        }

        public componentWillUnmount() {
          this.notificationsUIStore.dispose();
        }

        public render() {
          const { data, isPending, isLoaded } = this.notificationsUIStore;
          const { t } = this.props;
          return (
            <Page
              constrainedWidth
              data-test-id="notifications-page"
              supportsMobile
              header={<PageHeader title={t("management:notifications.title")} loading={isPending} />}
            >
              {isLoaded ? (
                <Card>
                  <Grid rowSpacing={GridSpacing.Large}>
                    <RowCol>
                      <Grid rowSpacing={GridSpacing.XSmall}>
                        <RowCol>
                          <Stretch centered>
                            <Title id="notifications" size={Size.Small}>
                              {t("management:notifications.settingTitle")}
                            </Title>
                            <Toggle
                              aria-labelledby="notifications"
                              checked={data.enabled}
                              disabled={!data.interactive}
                              onChange={(e) => this.notificationsUIStore.toggle(e.target.checked)}
                              data-test-id="notifications-send-me-emails"
                            >
                              {data.enabled ? t("state.on") : t("state.off")}
                            </Toggle>
                          </Stretch>
                        </RowCol>
                        <RowCol visible={data.interactive}>
                          <Paragraph size={Size.Medium} color={TextColor.Secondary}>
                            <Trans i18nKey={`management:notifications.user${data.interactive ? "Enabled" : "Disabled"}`}>
                              <Link to="/settings/notifications">a</Link>
                            </Trans>
                          </Paragraph>
                        </RowCol>
                      </Grid>
                    </RowCol>
                    <MessageBar type={NotificationType.Warning} visible={!data.interactive}>
                      <Trans i18nKey={`management:notifications.user${data.interactive ? "Enabled" : "Disabled"}`}>
                        <Link to="/settings/notifications">a</Link>
                      </Trans>
                    </MessageBar>
                    <NotificationSettingsSections
                      sections={data.sections}
                      disabled={!data.enabled}
                      onCheckChange={(event, setting) => this.notificationsUIStore.handleChange(setting.id, event.target.checked)}
                      onSelectChange={(value, setting) => this.notificationsUIStore.handleChange(setting.id, value)}
                    />
                  </Grid>
                </Card>
              ) : (
                <div />
              )}
            </Page>
          );
        }
      }
    )
  )
);
