import * as React from "react";
import { ConfirmationDialog } from "@root/shared";
import { StringHelper } from "../utils/string-helper";
import { DistributionGroupsListStrings } from "../utils/strings";
import { WithTranslation, withTranslation } from "react-i18next";

export interface DistributionGroupRemoveDialogProps {
  visible: boolean;
  groupName: string;
  onRemoveButtonClicked: () => void;
  onCancelButtonClicked: () => void;
  sharedGroup?: boolean;
}

export const DistributionGroupRemoveDialog = withTranslation(["distribute"])(
  class DistributionGroupRemoveDialog extends React.Component<DistributionGroupRemoveDialogProps & WithTranslation, {}> {
    public render() {
      const { visible, groupName, onRemoveButtonClicked, onCancelButtonClicked, sharedGroup, t } = this.props;
      return (
        <ConfirmationDialog
          data-test-id="distribution-group-delete-dialog"
          danger
          visible={visible}
          onCancel={onCancelButtonClicked}
          onConfirm={onRemoveButtonClicked}
          title={
            sharedGroup
              ? t("distribute:groupSettings.removeSharedGroup.dialogTitle", { groupName })
              : StringHelper.format(DistributionGroupsListStrings.RemoveDialogTitle, groupName)
          }
          description={DistributionGroupsListStrings.RemoveDialogText}
          cancelButton={DistributionGroupsListStrings.RemoveDialogButtonTitleCancel}
          confirmButton={DistributionGroupsListStrings.RemoveDialogButtonTitleDelete}
          confirmButtonAriaLabel={
            groupName
              ? `${DistributionGroupsListStrings.RemoveDialogButtonTitleDelete} ${groupName} group?`
              : DistributionGroupsListStrings.RemoveDialogButtonTitleDelete
          }
        />
      );
    }
  }
);
