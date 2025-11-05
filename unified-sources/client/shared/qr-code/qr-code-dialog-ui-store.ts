import { observable, action } from "mobx";
import { IApp } from "@lib/common-interfaces";
import { logger } from "@root/lib/telemetry";

export class QRCodeDialogUIStore {
  @observable
  public app?: IApp;

  @observable
  public qrCodeDialogVisible: boolean = false;

  @action
  public showQRCodeDialog = (app: IApp): void => {
    logger.info(`management-apps-qr-code-dialog-shown`, { appId: app.id });
    this.app = app;
    this.qrCodeDialogVisible = true;
  };

  @action
  public closeQRDialog = () => {
    this.app = undefined;
    this.qrCodeDialogVisible = false;
  };
}

export const qrCodeDialogUIStore = new QRCodeDialogUIStore();
