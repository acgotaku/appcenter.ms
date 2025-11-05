import * as React from "react";
import { ConfirmationDialog } from "@root/shared";
import { WithTranslation, withTranslation } from "react-i18next";

export interface DisableDogfoodingDialogProps {
  visible: boolean;
  onDisableButtonClicked: () => void;
  onCancelButtonClicked: () => void;
}

export const DisableDogfoodingDialog = withTranslation(["distribute"])(
  class DisableDogfoodingDialog extends React.Component<DisableDogfoodingDialogProps & WithTranslation, {}> {
    public render() {
      const { visible, onDisableButtonClicked, onCancelButtonClicked, t } = this.props;
      return (
        <ConfirmationDialog
          data-test-id="distribution-group-disable-dogfooding-dialog"
          danger
          visible={visible}
          onCancel={onCancelButtonClicked}
          onConfirm={onDisableButtonClicked}
          title={t("distribute:groupSettings.dogfooding.disableDialog.title")}
          description={t("distribute:groupSettings.dogfooding.disableDialog.description")}
          cancelButton={t("common:button.cancel")}
          confirmButton={t("distribute:groupSettings.dogfooding.disableDialog.confirmButton")}
        />
      );
    }
  }
);
