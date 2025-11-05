import * as React from "react";
import { observer } from "mobx-react";
import {
  ScrollableDialog,
  Button,
  Paragraph,
  BottomBar,
  ButtonContainer,
  Color,
  Size,
  Text,
  PrimaryButton,
  SingleSelectActionList,
  SingleSelectActionItem,
  MediaObject,
  OrganizationIcon,
  Space,
  MessageBar,
  NotificationType,
} from "@root/shared";
import { Col } from "@root/shared/grid";
import { organizationStore, appStore } from "@root/stores";
import { getTransferAppStore } from "../stores/apps/transfer-app-store";
import { noop } from "lodash";
import { withTranslation, WithTranslation } from "react-i18next";
import { IOrganization } from "@lib/common-interfaces";

export interface TransferAppDialogProps {
  // Nothing to add here yet.
}

export const TransferAppDialog = withTranslation(["common", "management"])(
  observer(
    class TransferAppDialog extends React.Component<TransferAppDialogProps & WithTranslation, {}> {
      private availableOrganizations: IOrganization[] = [];

      private get canTransferFromOrg() {
        const { app } = appStore;
        return (
          app.isOrgApp &&
          organizationStore.organizationsWithCurrentUserAsAdmin.filter((org) => org.name === app.owner.name).length === 1
        );
      }

      public UNSAFE_componentWillUpdate() {
        const { app } = appStore;
        const transferAppStore = getTransferAppStore(app);
        this.availableOrganizations = organizationStore.organizationsWithCurrentUserAsAdmin;

        if (app.isOrgApp) {
          this.availableOrganizations = this.canTransferFromOrg
            ? this.availableOrganizations.filter((org) => org.name !== app.owner.name)
            : [];
        }

        // Select the Organization in the list if it's the only one.
        if (!transferAppStore.newOwnerName && this.availableOrganizations.length === 1) {
          transferAppStore.setNewOwnerName(this.availableOrganizations[0].name);
        }
      }

      private renderNotifications() {
        const { app } = appStore;
        const { transferLimitNotification } = getTransferAppStore(app);

        if (transferLimitNotification) {
          return (
            <MessageBar type={NotificationType.Error} container="Well">
              {transferLimitNotification.message}
            </MessageBar>
          );
        } else {
          return null;
        }
      }

      public render() {
        const { t } = this.props;
        const { app } = appStore;
        const transferAppStore = getTransferAppStore(app);
        const { isConfirmationDialogVisible, newOwnerName, isPending } = transferAppStore;
        const titleText = t("management:appSettings.transferDialog.title");

        return (
          <ScrollableDialog
            data-test-id="transfer-app-dialog"
            title={titleText}
            header={titleText}
            visible={isConfirmationDialogVisible}
            onRequestClose={noop}
            bottomBar={
              <BottomBar alignRight>
                <ButtonContainer equalize>
                  <Button onClick={() => transferAppStore.hideTransferConfirmationDialog()} disabled={isPending}>
                    {t("button.cancel")}
                  </Button>
                  <PrimaryButton
                    data-test-id="confirm-transfer-button"
                    disabled={!newOwnerName}
                    progress={isPending}
                    onClick={() => transferAppStore.transferApp(newOwnerName)}
                    color={app.isOrgApp ? Color.Blue : Color.Red}
                  >
                    {t(`management:appSettings.transferDialog.confirmButton.${isPending ? "pending" : "action"}`)}
                  </PrimaryButton>
                </ButtonContainer>
              </BottomBar>
            }
          >
            <>
              <Paragraph size={Size.Medium} spaceBelow={Space.Small}>
                {t(`management:appSettings.transferDialog.description.${app.isOrgApp ? "orgToOrg" : "userToOrg"}`)}
              </Paragraph>
              {this.renderNotifications()}
              {!app.isOrgApp || this.canTransferFromOrg ? (
                this.availableOrganizations.length > 0 ? (
                  <SingleSelectActionList
                    data-test-id="transfer-app-organization-list"
                    name="transfer-dialog-list"
                    value={newOwnerName}
                    onChange={(value) => transferAppStore.setNewOwnerName(value as string)}
                  >
                    {this.availableOrganizations.map((o) => (
                      <SingleSelectActionItem value={o.name} key={o.name} disabled={isPending}>
                        <Col>
                          <MediaObject hSpace={Space.XSmall}>
                            <OrganizationIcon size={24} organization={o} />
                            <Text size={Size.Medium}>{o.display_name}</Text>
                          </MediaObject>
                        </Col>
                      </SingleSelectActionItem>
                    ))}
                  </SingleSelectActionList>
                ) : (
                  <MessageBar type={NotificationType.Info} container="Well">
                    {t("management:appSettings.transferDialog.noDestination")}
                  </MessageBar>
                )
              ) : (
                <MessageBar type={NotificationType.Info} container="Well">
                  {t("management:appSettings.transferDialog.noPermissionToTransferFromOrgToOrg")}
                </MessageBar>
              )}
            </>
          </ScrollableDialog>
        );
      }
    }
  )
);
