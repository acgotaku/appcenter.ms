import * as React from "react";
import { Page, Panelify, PanelInjectedProps, Stretch, Toggle, Card, PageHeader } from "@root/shared";
import { RowCol, GridSpacing, Grid } from "@root/shared/grid";
import { Paragraph, Title, Size, TextColor } from "@root/shared/typography";
import { observer } from "mobx-react";
import { withTranslation, WithTranslation } from "react-i18next";
import { UserNotificationSettingsUIStore } from "@root/management/settings/notification-settings/user-notification-settings-ui-store";
import { RouteComponentProps } from "react-router";

export const UserNotificationSettings = Panelify(
  withTranslation(["common", "management"])(
    observer(
      class UserNotificationSettings extends React.Component<
        PanelInjectedProps & WithTranslation & RouteComponentProps<any, any>,
        {}
      > {
        private userNotificationSettingsUIStore = new UserNotificationSettingsUIStore();
        public UNSAFE_componentWillReceiveProps(nextProps) {
          if (this.props.params.app_name !== nextProps.params.app_name) {
            this.userNotificationSettingsUIStore = new UserNotificationSettingsUIStore();
          }
        }

        public componentWillUnmount() {
          this.userNotificationSettingsUIStore.dispose();
        }

        public render() {
          const { data, isPending, isLoaded, optIn } = this.userNotificationSettingsUIStore;
          const { t } = this.props;
          return (
            <Page
              constrainedWidth
              supportsMobile
              data-test-id="user-email-notifications-page"
              header={<PageHeader title={t("management:notifications.userSettingsTitle")} loading={isPending} />}
            >
              {isLoaded ? (
                <Grid rowSpacing={GridSpacing.Medium}>
                  <RowCol>
                    <Card bordered>
                      <RowCol>
                        <Stretch centered>
                          <Title id="your-notifications" size={Size.Small}>
                            {t("management:notifications.settings.yourApp.title")}
                          </Title>
                          <Toggle
                            aria-labelledby="your-notifications"
                            checked={data.enabled}
                            onChange={(e) => this.userNotificationSettingsUIStore.toggleYourApps(e.target.checked)}
                            data-test-id="user-email-notifications-toggle"
                          >
                            {data.enabled ? t("state.on") : t("state.off")}
                          </Toggle>
                        </Stretch>
                      </RowCol>
                      <RowCol>
                        <Paragraph size={Size.Small} color={TextColor.Secondary}>
                          {t("management:notifications.settings.yourApp.subtitle")}
                        </Paragraph>
                      </RowCol>
                    </Card>
                  </RowCol>
                  <RowCol>
                    <Card bordered>
                      <RowCol>
                        <Stretch centered>
                          <Title id="app-center-notifications" size={Size.Small}>
                            {t("management:notifications.settings.appCenter.title")}
                          </Title>
                          <Toggle
                            aria-labelledby="app-center-notifications"
                            checked={optIn}
                            onChange={(e) => this.userNotificationSettingsUIStore.toggleAppCenter(e.target.checked)}
                            data-test-id="user-email-notifications-toggle-app-center"
                          >
                            {optIn ? t("state.on") : t("state.off")}
                          </Toggle>
                        </Stretch>
                      </RowCol>
                      <RowCol>
                        <Paragraph size={Size.Small} color={TextColor.Secondary}>
                          {t("management:notifications.settings.appCenter.subtitle")}
                        </Paragraph>
                      </RowCol>
                    </Card>
                  </RowCol>
                </Grid>
              ) : null}
            </Page>
          );
        }
      }
    )
  )
);
