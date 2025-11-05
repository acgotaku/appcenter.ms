import * as React from "react";
import { observer } from "mobx-react";
import {
  Modalify,
  Page,
  PageHeader,
  PanelInjectedProps,
  BottomBar,
  ButtonContainer,
  Button,
  Color,
  PrimaryButton,
  PageNotification,
  ConfirmationDialog,
} from "@root/shared";
import { RouteComponentProps } from "react-router";
import { ConfigureBugTrackerUIStore } from "./configure-bugtracker-ui-store";
import { withTranslation, WithTranslation } from "react-i18next";
import { BugTrackerSettings } from "./bugtracker-settings";
import { ServicesUIStore } from "../services-ui-store";
import { t } from "@root/lib/i18n";

const styles = require("./configure-bugtracker.scss");

export const ConfigureBugTracker = Modalify(
  withTranslation(["common", "management"])(
    observer(
      class ConfigureBugTracker extends React.Component<PanelInjectedProps & RouteComponentProps<any, any> & WithTranslation, {}> {
        private configureBugtrackerUiStore = new ConfigureBugTrackerUIStore();
        private servicesUiStore = new ServicesUIStore();

        public render() {
          const store = this.configureBugtrackerUiStore;
          const { bugTracker } = store;

          return (
            <Page
              white
              data-test-id="configure-bugtracker-page"
              header={
                <PageHeader
                  title={
                    this.servicesUiStore.userCanEdit
                      ? t("management:appServices.bugTracker.editBugTracker")
                      : t("management:appServices.bugTracker.details")
                  }
                  loading={store.isFetching}
                />
              }
            >
              {store.notification ? <PageNotification type={store.notification.type} children={store.notification.message} /> : null}
              {store.isFetching ? (
                <div />
              ) : (
                <BugTrackerSettings store={store} disabled={store.isUpdating || !this.servicesUiStore.userCanEdit} />
              )}
              <BottomBar className={styles["bottom-bar"]}>
                <div>
                  {this.servicesUiStore.userCanEdit ? (
                    <Button
                      className={styles["disconnect-button"]}
                      onClick={() => store.disconnectBugTracker()}
                      data-test-id="bugtracker-disconnect-button"
                    >
                      {t("management:appServices.bugTracker.disconnectBugTracker")}
                    </Button>
                  ) : null}
                  <ConfirmationDialog
                    data-test-id="config-bugtracker-disconnect-dialog"
                    danger
                    visible={store.disconnectBugTrackerWarningIsVisible}
                    onCancel={() => store.cancelDisconnectBugTracker()}
                    onConfirm={() => store.finishDisconnectBugTracker()}
                    title={t("management:appServices.bugTracker.disconnectDialog.title")}
                    description={t("management:appServices.bugTracker.disconnectDialog.message")}
                    cancelButton={t("button.cancel")}
                    confirmButton={t("management:appServices.disconnect")}
                  />
                </div>
                <ButtonContainer>
                  {this.servicesUiStore.userCanEdit ? (
                    <PrimaryButton
                      progress={store.isUpdating}
                      color={Color.Blue}
                      disabled={!bugTracker.isValid || store.isUpdating}
                      onClick={() => store.update()}
                      key="save"
                    >
                      {t("common:button.done")}
                    </PrimaryButton>
                  ) : null}
                </ButtonContainer>
              </BottomBar>
            </Page>
          );
        }
      }
    )
  )
);
