import { action, computed, observable } from "mobx";
import { BugTracker, bugtrackerStore } from "@root/data/management";
import { t } from "@root/lib/i18n";

/**
 * UI Store for BugTracker settings page.
 */
export class BugTrackerSettingsUIStore {
  // This model will be used as a plain object carrying changes; bugtracker-store creates the model that will actually be tracked in the store.
  @observable private bugTrackerChanges = new BugTracker();

  @computed public get bugTracker() {
    // This model will be used as a plain object carrying changes; bugtracker-store creates the model that will actually be tracked in the store.
    return bugtrackerStore.bugTracker ? new BugTracker(bugtrackerStore.bugTracker) : this.bugTrackerChanges;
  }

  @computed
  public get autoCreateTicket() {
    return this.bugTracker.eventTypes!.NewCrashGroupCreated;
  }

  @computed
  public get supportsVSTSParams() {
    return this.bugTracker.type === "vsts";
  }

  @action
  public setAutoCreateTicket(autoCreateTicket: boolean) {
    this.bugTracker.eventTypes!.NewCrashGroupCreated = autoCreateTicket;
  }

  @action
  public setArea(area: string) {
    this.bugTracker.settings!.vstsAreaPath = area;
  }

  @action
  public setDefaultPayload(defaultPayload: string) {
    this.bugTracker.settings!.vstsDefaultPayload = defaultPayload;
  }

  public get areaValidationErrors() {
    return {
      minLength: t("management:appServices.bugTracker.error.areaTooShort", { minLength: BugTracker.areaValidations.minLength }),
      maxLength: t("management:appServices.bugTracker.error.areaTooLong", { maxLength: BugTracker.areaValidations.maxLength }),
    };
  }

  public get payloadValidationErrors() {
    return {
      maxLength: t("management:appServices.bugTracker.error.payloadTooLong", { maxLength: BugTracker.payloadValidations.maxLength }),
      isValidPayload: t("management:appServices.bugTracker.error.invalidPayload"),
    };
  }
}
