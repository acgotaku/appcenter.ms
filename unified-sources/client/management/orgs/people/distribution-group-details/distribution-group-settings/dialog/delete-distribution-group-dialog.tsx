import * as React from "react";
import { observer } from "mobx-react";
import { withTranslation, WithTranslation } from "react-i18next";
import { ConfirmationDialog, PrimaryButton } from "@root/shared";
import { DistributionGroup } from "@root/data/distribute/models/distribution-group-model";
import { DeleteDistributionGroupDialogUIStore } from "./delete-distribution-group-dialog-ui-store";

export const deleteDistributionGroupDialogStore = new DeleteDistributionGroupDialogUIStore();

export interface DeleteDistributionGroupDialogProps {
  group: DistributionGroup;
  organizationName: string;
  closeOnConfirm?: boolean;
  onConfirmDeleteGroup: () => void;
  progress?: boolean;
}

export const DeleteDistributionGroupDialog = withTranslation(["common", "distribute"])(
  observer(
    class DeleteDistributionGroupDialog extends React.Component<DeleteDistributionGroupDialogProps & WithTranslation, {}> {
      public render() {
        const { group, progress, t } = this.props;
        const { isVisible } = deleteDistributionGroupDialogStore;

        if (!group) {
          return null;
        }

        let description: string;
        if (group.apps && group.apps.length > 0) {
          description = `This group is being used by ${group.apps.length} apps. All statistics and data for this group will be lost. This cannot be undone.`;
        } else {
          description = `This group is not being used by any apps. This cannot be undone.`;
        }

        return (
          <ConfirmationDialog
            data-test-id="delete-shared-group-dialog"
            visible={isVisible}
            title={`Delete '${group.name}' distribution group from organization?`}
            description={description}
            cancelButton={t("common:button.cancel")}
            confirmButton={
              <PrimaryButton progress={progress} data-test-id="delete-button">
                {progress ? t("common:button.deleting") : t("common:button.delete")}
              </PrimaryButton>
            }
            danger
            onConfirm={this.onConfirm}
            onCancel={this.closeDialog}
          />
        );
      }

      private onConfirm = () => {
        const { onConfirmDeleteGroup } = this.props;
        onConfirmDeleteGroup();
        deleteDistributionGroupDialogStore.setVisible(false);
      };

      private closeDialog(): void {
        deleteDistributionGroupDialogStore.setVisible(false);
      }
    }
  )
);
