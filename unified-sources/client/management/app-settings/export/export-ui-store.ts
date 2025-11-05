import { action, computed, observable } from "mobx";
import { t } from "@root/lib/i18n";
import { exportConfigurationStore, ExportState, ExportType } from "@root/data/management";
import { appStore } from "@root/stores";
import { getAcl } from "@root/shared";
import { Permission } from "@root/shared/utils/permissions/settings";

export class ExportUIStore {
  @observable public deletingId = null;
  private autoUpdateInterval;

  @action
  public keepFetchingExportConfigurations() {
    this.clear();
    this.autoUpdateInterval = setInterval(() => {
      if (new Date().getSeconds() % 5 === 0) {
        exportConfigurationStore.fetchCollection({
          ownerName: appStore.app.owner.name,
          appName: appStore.app.name,
        });
      }
    }, 1000);
  }

  @computed
  public get deleteExportConfigurationWargningVisible() {
    return this.deletingId !== null;
  }

  @computed
  public get deletingConfiguration() {
    if (this.deletingId !== null) {
      return exportConfigurationStore.get(this.deletingId!);
    }
    return null;
  }

  public clear() {
    if (this.autoUpdateInterval) {
      clearInterval(this.autoUpdateInterval);
      this.autoUpdateInterval = 0;
    }
  }

  @computed
  public get isFailed() {
    return !!exportConfigurationStore.collectionFetchError;
  }

  @computed
  public get stopFetching() {
    return (
      exportConfigurationStore.resources.every((e) => e.state !== ExportState.Pending) &&
      !exportConfigurationStore.isFetchingCollection
    );
  }

  @computed
  public get exportConfigurations() {
    return exportConfigurationStore.resources.sort((a, b) => a.creationTime! - b.creationTime!);
  }

  @computed
  public get isEmpty() {
    return exportConfigurationStore.isEmpty;
  }

  @computed
  public get isLoading() {
    return exportConfigurationStore.isFetchingCollection && this.autoUpdateInterval === 0;
  }

  @computed
  public get canCreateExportConfiguration() {
    return (
      getAcl().checkPermission(Permission.CreateExportConfiguration) &&
      !this.isFailed &&
      !this.isLoading &&
      this.exportConfigurations.length < Object.keys(ExportType).length
    );
  }

  @computed
  public get canEditExportConfiguration() {
    return getAcl().checkPermission(Permission.EditExportConfiguration);
  }

  @computed
  public get canDeleteExportConfiguration() {
    return getAcl().checkPermission(Permission.DeleteExportConfiguration);
  }

  @computed
  public get deleteTitle() {
    if (this.deletingConfiguration) {
      return t("management:exportDetails.deleteDialog.title", {
        exportType: t(`management:exportDetails.exportType.${this.deletingConfiguration.exportType}.name`),
      });
    }
    return "";
  }

  @computed
  public get deleteMessage() {
    if (this.deletingConfiguration) {
      return t("management:exportDetails.deleteDialog.message", {
        exportType: t(`management:exportDetails.exportType.${this.deletingConfiguration.exportType}.name`),
      });
    }
    return "";
  }

  @action
  public deleteExportConfiguration(id: string) {
    this.deletingId = id as any;
  }

  @action
  public confirmDeletingExportConfiguration() {
    exportConfigurationStore.delete(this.deletingId!, true, {
      ownerName: appStore.app.owner.name,
      appName: appStore.app.name,
    });
    this.deletingId = null;
  }

  @action
  public cancelDeletingExportConfiguration() {
    this.deletingId = null;
  }

  @action
  public setExportConfigurationState(id: string, enabled: boolean) {
    const configuration = exportConfigurationStore.get(id);
    exportConfigurationStore.setState(configuration!, enabled ? ExportState.Enabled : ExportState.Disabled, true, {
      ownerName: appStore.app.owner.name,
      appName: appStore.app.name,
    });
  }
}
