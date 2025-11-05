import { t } from "@root/lib/i18n";
import { FileUploadStore } from "../../lib/file-upload-service/file-upload-store";
import { IApp, OS } from "@lib/common-interfaces";

import { ciStore } from "./ci-store";

export class ProvisionSecureFileUploadStore extends FileUploadStore {
  private app?: IApp;

  constructor() {
    super();
    this.app = ciStore.currentRepoStore && ciStore.currentRepoStore.app;
  }

  public validate(file: File): boolean {
    const mobileProvisionExtension = ".mobileprovision";
    const macosProvisionExtension = ".provisionprofile";

    if (!this.app) {
      return false;
    }

    if (
      (this.app.os === OS.IOS && !file.name.toLocaleLowerCase().endsWith(mobileProvisionExtension)) ||
      (this.app.os === OS.MACOS && !file.name.toLocaleLowerCase().endsWith(macosProvisionExtension))
    ) {
      this.errorMessage = t("build:file-upload-store.ProvisioningProfileNotValid", {
        extension: this.app.os === OS.IOS ? mobileProvisionExtension : macosProvisionExtension,
      });
      return false;
    }
    return true;
  }

  get createAssetPath(): string {
    return this.app && this.app.owner ? `/v0.1/apps/${this.app.owner.name}/${this.app.name}/file_asset` : "";
  }

  public onUploadSuccess() {
    /* not needed here */
  }
}
