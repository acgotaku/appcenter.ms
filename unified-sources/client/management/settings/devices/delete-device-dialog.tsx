import * as React from "react";
import { Button, Color, ConfirmationDialog } from "@root/shared";
import { observer } from "mobx-react";
import { devicesUIStore } from "./devices-ui-store";
import { withTranslation, WithTranslation } from "react-i18next";

export interface DeleteDeviceDialogProps {
  visible: boolean;
  onConfirm?(): void;
}

export const DeleteDeviceDialog = withTranslation(["devices"])(
  observer(
    class DeleteDeviceDialog extends React.Component<DeleteDeviceDialogProps & WithTranslation, {}> {
      public render() {
        const { t } = this.props;
        const { isDeleteInProgress } = devicesUIStore;
        return (
          <ConfirmationDialog
            danger
            visible={this.props.visible}
            title={`${t("management:devices.removeDeviceDialog.title")}`}
            description={`${t("management:devices.removeDeviceDialog.message")}`}
            confirmButton={
              <Button key="remove-button" progress={isDeleteInProgress} disabled={isDeleteInProgress} color={Color.Red}>{`${t(
                "common:button.delete"
              )}`}</Button>
            }
            onConfirm={this.deleteConfirm}
            cancelButton={<Button key="cancel-remove">{`${t("common:button.cancel")}`}</Button>}
            onCancel={this.closeDialog}
          />
        );
      }

      private deleteConfirm = (): void => {
        devicesUIStore.deleteDevice((success) => {
          if (success) {
            this.closeDialog();
            if (this.props.onConfirm) {
              this.props.onConfirm();
            }
          }
        });
      };

      private closeDialog = (): void => {
        devicesUIStore.setDialogVisible(false);
      };
    }
  )
);
