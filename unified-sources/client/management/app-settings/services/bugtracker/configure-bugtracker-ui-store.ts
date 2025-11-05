import { action, computed, observable } from "mobx";
import { t } from "@root/lib/i18n";
import { bugtrackerStore } from "@root/data/management";
import { locationStore, notifyScreenReader } from "@root/stores";
import { NotificationType } from "@root/shared";
import { INotificationMessage } from "../../../constants/constants";
import { BugTrackerSettingsUIStore } from "./bugtracker-settings-ui-store";
import { logger } from "@root/lib/telemetry";

/**
 * UI Store for BugTracker configuration page.
 */
export class ConfigureBugTrackerUIStore extends BugTrackerSettingsUIStore {
  @observable public disconnectBugTrackerWarningIsVisible = false;

  @computed
  public get isFetching() {
    return bugtrackerStore.isFetchingSettings;
  }

  @computed
  public get isUpdating() {
    return bugtrackerStore.isCreatingOrUpdating;
  }

  @action
  public disconnectBugTracker() {
    this.disconnectBugTrackerWarningIsVisible = true;
  }

  @action
  public cancelDisconnectBugTracker() {
    this.disconnectBugTrackerWarningIsVisible = false;
  }

  @action
  public finishDisconnectBugTracker() {
    logger.info("app-services-disconnected-bugtracker");
    bugtrackerStore.deleteBugTrackerSettings();
    this.disconnectBugTrackerWarningIsVisible = false;
    locationStore.goUp();
    notifyScreenReader({ message: t("management:appServices.bugTracker.wasDisconnected"), delay: 500 });
  }

  @action
  public update() {
    const isNew = bugtrackerStore.resources.length === 0;
    bugtrackerStore.createOrUpdate(this.bugTracker).onSuccess(
      action(() => {
        locationStore.goUp();
        notifyScreenReader({
          message: isNew ? t("management:appServices.bugTracker.wasCreated") : t("management:appServices.bugTracker.wasUpdated"),
          delay: 500,
        });
      })
    );
  }

  @computed
  public get notification(): INotificationMessage | undefined {
    // Check for errors while fetching bugtracker settings.
    if (!bugtrackerStore.bugTracker && bugtrackerStore.fetchBugTrackerSettingsError) {
      return {
        type: NotificationType.Error,
        message: bugtrackerStore.fetchBugTrackerSettingsError.message,
      };
    }

    // Check for errors during save.
    if (bugtrackerStore.updateBugTrackerSettingsError) {
      return {
        type: NotificationType.Error,
        message: bugtrackerStore.updateBugTrackerSettingsError.message,
      };
    }

    // Check for errors while deleting bugtracker settings.
    if (bugtrackerStore.deleteBugTrackerSettingsError) {
      return {
        type: NotificationType.Error,
        message: bugtrackerStore.deleteBugTrackerSettingsError.message,
      };
    }
  }
}
