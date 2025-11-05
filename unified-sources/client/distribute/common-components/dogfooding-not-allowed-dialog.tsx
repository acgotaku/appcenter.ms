import * as React from "react";
import { withTranslation, WithTranslation } from "react-i18next";
import { appStore } from "@root/stores";
import { ConfirmationDialog } from "@root/shared";

export interface DogfoodingNotAllowedDialogProps {
  visible: boolean;
  onDismiss(): void;
}

export const DogfoodingNotAllowedDialog = withTranslation(["distribute"])(
  class DogfoodingNotAllowedDialog extends React.Component<DogfoodingNotAllowedDialogProps & WithTranslation> {
    public render() {
      const { t } = this.props;
      const dogfoodEnabled = appStore.app.isMicrosoftInternal;
      return (
        <ConfirmationDialog
          visible={this.props.visible}
          title={
            dogfoodEnabled ? t("distribute:dogfood.disableNotAllowedDialogTitle") : t("distribute:dogfood.enableNotAllowedDialogTitle")
          }
          description={
            dogfoodEnabled
              ? t("distribute:dogfood.disableNotAllowedDialogContent")
              : t("distribute:dogfood.enableNotAllowedDialogContent")
          }
          confirmButton={t("common:button.ok")}
          onCancel={this.props.onDismiss}
          onConfirm={this.props.onDismiss}
        />
      );
    }
  }
);
