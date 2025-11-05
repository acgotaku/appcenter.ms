import * as React from "react";
import { Dialog } from "@root/shared";
import { IApp } from "@lib/common-interfaces/app";
import { QRCodeAppInfo } from "./qr-code-app-info";
import { withTranslation, WithTranslation } from "react-i18next";
import { DistributionGroup } from "@root/data/distribute/models/distribution-group";
import { Release } from "@root/distribute/models/release";

export interface QRCodeDialogProps {
  visible: boolean;
  app?: IApp;
  group?: DistributionGroup;
  release?: Release;
  onClose?: () => void;
}

export const QRCodeDialog = withTranslation(["common"])(
  class QRCodeDialog extends React.Component<QRCodeDialogProps & WithTranslation, {}> {
    public UNSAFE_componentWillReceiveProps(nextProps: QRCodeDialogProps) {
      //get the root element to change root horizontal scroll bar visibility
      const rootElement = document.getElementsByTagName("html");
      if (this.props.visible && !nextProps.visible) {
        rootElement[0].style.overflowX = "auto";
      } else if (!this.props.visible && nextProps.visible) {
        rootElement[0].style.overflowX = "hidden";
      }
    }

    public render() {
      const { app, group, release, visible, onClose, t } = this.props;
      const screenWidth = window.innerWidth;
      // For big enough resolutions, always use width 400px for dialog, in resolutions smaller than this (perhaps caused by zoom),
      // derive the width from screen width with 10px extra (don't question this magic number)
      const dialogWidth = screenWidth < 410 ? screenWidth - 10 : 400;
      return visible ? (
        <Dialog
          title={t!("app.qrCodeInfo.title", app)}
          visible={visible}
          width={dialogWidth}
          onRequestClose={() => onClose && onClose()}
        >
          <QRCodeAppInfo app={app} group={group} release={release} />
        </Dialog>
      ) : null;
    }
  }
);
