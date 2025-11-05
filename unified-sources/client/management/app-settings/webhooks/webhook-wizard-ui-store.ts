import { observable, action, computed } from "mobx";
import {
  webhookStore,
  Webhook,
  EventType,
  WebhookPingResult,
  BuildCompleteFailsSetting,
  BuildCompleteSucceedsSetting,
  BuildCompleteSetting,
} from "@root/data/management";
import { locationStore, notify, notifyScreenReader } from "@root/stores";
import { logger } from "@root/lib/telemetry";
import { NotificationType, getAcl } from "@root/shared";
import { INotificationMessage } from "../../constants/constants";
import { Permission } from "@root/shared/utils/permissions/settings";
import { clone, trim } from "lodash";
import { t } from "@root/lib/i18n";
import { emptyString } from "../../utils/formsy/validations";

/**
 * UI Store for the webhook form that is used to create or update the webhook.
 */
export class WebhookWizardUIStore {
  public static nameValidations = {
    emptyString: emptyString,
    minLength: 3,
    maxLength: 64,
  };

  public static BuildCompleteSucceedsOptions: BuildCompleteSucceedsSetting[] = [
    BuildCompleteSetting.Always,
    BuildCompleteSetting.OnlyFixed,
    BuildCompleteSetting.Never,
  ];

  public static BuildCompleteFailsOptions: BuildCompleteFailsSetting[] = [
    BuildCompleteSetting.Always,
    BuildCompleteSetting.OnlyBroken,
    BuildCompleteSetting.Never,
  ];

  public static BuildCompleteSucceedsValues = {
    [BuildCompleteSetting.Always]: [EventType.BuildCompleteFixed, EventType.BuildCompleteSucceeded],
    [BuildCompleteSetting.OnlyFixed]: [EventType.BuildCompleteFixed],
  };

  public static BuildCompleteFailsValues = {
    [BuildCompleteSetting.Always]: [EventType.BuildCompleteBroken, EventType.BuildCompleteFailed],
    [BuildCompleteSetting.OnlyBroken]: [EventType.BuildCompleteBroken],
  };

  public static nameValidationErrors = {
    emptyString: "Name cannot be empty.",
    minLength: `Please enter a name with more than ${WebhookWizardUIStore.nameValidations.minLength - 1} characters.`,
    maxLength: `Please enter a name with less than ${WebhookWizardUIStore.nameValidations.maxLength} characters.`,
  };

  public static urlValidations = {
    isHttpUrl: (_, value: string) =>
      value &&
      value.match(
        /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&\/=](?!(localhost|(?:[0-9]{1,3}\.){3}[0-9]{1,3})))*$/
      ),
  };

  public static urlValidationErrors = {
    isHttpUrl: "Please enter a valid url.",
  };

  private originalWebhook!: Webhook;
  @observable public webhook!: Webhook;
  @observable private fetchingId!: string;
  @observable public isErrorCheckEnabled: boolean = false;
  @observable public removeWebhookWarningIsVisible = false;

  @action
  public reset() {
    this.fetchingId = null as any;
    this.isErrorCheckEnabled = false;
    this.webhook = new Webhook();
    this.webhook.eventTypes = observable.array<EventType>();
    this.webhook.enabled = true;
  }

  @action
  public setEnabled(enabled: boolean) {
    this.webhook.enabled = enabled;
  }

  @action
  public setName(name: string) {
    this.webhook.name = name;
  }

  @action
  public setUrl(url: string) {
    this.webhook.url = url;
  }

  @action
  public fetch(id: string) {
    this.fetchingId = id;
    webhookStore.fetchOne(id).onSuccess(
      action((whook: Webhook) => {
        this.originalWebhook = whook;
        this.webhook = clone(whook);
      }) as any
    );
  }

  private trackWebhookSave() {
    logger.info("webhook-saved", {
      enabled: this.webhook.enabled,
      ...this.webhook.eventTypes!.reduce((properties, event) => {
        properties[event] = true;
        return properties;
      }, {}),
    });
  }

  @action
  public createOrUpdateWebhook(isTest: boolean = false) {
    if (this.isEdit) {
      webhookStore.update(this.originalWebhook, this.webhook, false).onSuccess(
        action(() => {
          this.trackWebhookSave();
          notifyScreenReader({ message: t("management:appWebhooks.wasUpdated", { webhook: this.webhook }), delay: 500 });
          if (isTest) {
            this.testWebhook();
          }
          locationStore.goUp();
        })
      );
      this.isErrorCheckEnabled = true;
    } else {
      // Make sure that the webhook is enabled when we create it.
      webhookStore.create(this.webhook, false).onSuccess(
        action(() => {
          this.trackWebhookSave();
          notifyScreenReader({ message: t("management:appWebhooks.wasCreated", { webhook: this.webhook }), delay: 500 });
          locationStore.goUp();
        })
      );
      this.isErrorCheckEnabled = true;
    }
  }

  @action
  public setCallOnNewCrashGroup(callOnNewCrashGroup: boolean) {
    this.addOrRemove(this.webhook.eventTypes!, EventType.NewCrashGroupCreated, callOnNewCrashGroup);
  }

  @action
  public setCallOnNewAppRelease(callOnNewAppRelease: boolean) {
    this.addOrRemove(this.webhook.eventTypes!, EventType.NewAppRelease, callOnNewAppRelease);
  }

  @action
  public setCallOnBuildCompleteSucceeds(value: BuildCompleteSucceedsSetting) {
    this.addOrRemove(this.webhook.eventTypes!, EventType.BuildCompleteSucceeded, false);
    this.addOrRemove(this.webhook.eventTypes!, EventType.BuildCompleteFixed, false);
    if (value !== BuildCompleteSetting.Never) {
      WebhookWizardUIStore.BuildCompleteSucceedsValues[value].forEach((val) => this.addOrRemove(this.webhook.eventTypes!, val, true));
    }
  }

  @action
  public setCallOnBuildCompleteFails(value: BuildCompleteFailsSetting) {
    this.addOrRemove(this.webhook.eventTypes!, EventType.BuildCompleteFailed, false);
    this.addOrRemove(this.webhook.eventTypes!, EventType.BuildCompleteBroken, false);
    if (value !== BuildCompleteSetting.Never) {
      WebhookWizardUIStore.BuildCompleteFailsValues[value].forEach((val) => this.addOrRemove(this.webhook.eventTypes!, val, true));
    }
  }

  @computed
  public get callOnNewCrashGroup() {
    return this.webhook.eventTypes!.includes(EventType.NewCrashGroupCreated as EventType);
  }

  @computed
  public get callOnNewAppRelease() {
    return this.webhook.eventTypes!.includes(EventType.NewAppRelease as EventType);
  }

  @computed
  public get callOnBuildCompleteSucceeds(): BuildCompleteSucceedsSetting {
    if (this.webhook.eventTypes!.includes(EventType.BuildCompleteFixed)) {
      if (this.webhook.eventTypes!.includes(EventType.BuildCompleteSucceeded)) {
        return BuildCompleteSetting.Always;
      }
      return BuildCompleteSetting.OnlyFixed;
    }
    return BuildCompleteSetting.Never;
  }

  @computed
  public get callOnBuildCompleteFails(): BuildCompleteFailsSetting {
    if (this.webhook.eventTypes!.includes(EventType.BuildCompleteBroken)) {
      if (this.webhook.eventTypes!.includes(EventType.BuildCompleteFailed)) {
        return BuildCompleteSetting.Always;
      }
      return BuildCompleteSetting.OnlyBroken;
    }
    return BuildCompleteSetting.Never;
  }

  @computed
  public get notification(): INotificationMessage | undefined {
    // Check for errors during fetch.
    if (this.fetchingId && webhookStore.fetchError(this.fetchingId)) {
      const errorMessage = webhookStore.fetchError(this.fetchingId).message;
      this.isErrorCheckEnabled = true;
      return {
        type: NotificationType.Error,
        message: errorMessage ? errorMessage : "Unknown error",
      };
    }

    // Check for errors during create.
    if (webhookStore.creationError(this.webhook)) {
      const errorMessage = webhookStore.creationError(this.webhook).message;
      return {
        type: NotificationType.Error,
        message: errorMessage ? errorMessage : "Unknown error",
      };
    }

    // Check for errors during update.
    if (webhookStore.updateError(this.webhook.id!)) {
      const errorMessage = webhookStore.updateError(this.webhook.id!).message;
      return {
        type: NotificationType.Error,
        message: errorMessage ? errorMessage : "Unknown error",
      };
    }

    // Check for errors during ping.
    if (webhookStore.pingError(this.webhook.id!)) {
      return {
        type: NotificationType.Error,
        message: `Could not test webhook. Please try again later.`,
      };
    }
  }

  @computed
  public get isFetching() {
    return this.fetchingId ? webhookStore.isFetching(this.fetchingId) : false;
  }

  @computed
  public get isFetched() {
    return this.fetchingId ? webhookStore.fetchSucceeded(this.fetchingId) : false;
  }

  @computed
  public get isSaving() {
    return webhookStore.isCreating(this.webhook) || webhookStore.isUpdating(this.webhook);
  }

  @computed
  public get isEdit() {
    return this.fetchingId;
  }

  @computed
  public get isValidWebhook() {
    const name = trim(this.webhook.name);
    const { url, eventTypes } = this.webhook;
    return (
      name &&
      name.length >= WebhookWizardUIStore.nameValidations.minLength &&
      name.length <= WebhookWizardUIStore.nameValidations.maxLength &&
      WebhookWizardUIStore.urlValidations.isHttpUrl(null, url!) &&
      eventTypes!.length > 0
    );
  }

  @action
  public removeWebhook() {
    this.removeWebhookWarningIsVisible = true;
  }

  @action
  public finishRemovingWebhook() {
    webhookStore.delete(this.webhook.id!);
    this.removeWebhookWarningIsVisible = false;
    locationStore.goUp();
    notifyScreenReader({ message: t("management:appWebhooks.wasDeleted", { webhook: this.webhook }), delay: 500 });
  }

  @action
  public cancelRemovingWebhook() {
    this.removeWebhookWarningIsVisible = false;
  }

  @computed
  public get isRemoving() {
    return this.isRemoving(this.webhook.id);
  }

  @action
  public testWebhook() {
    webhookStore.ping(this.webhook).onSuccess(
      action((result: WebhookPingResult) => {
        notify({
          persistent: false,
          message:
            result.response_status_code === 200
              ? "Test successful. The webook URL is valid!"
              : "Test failed. Verify that the URL is a valid webhook.",
        });
      }) as any
    );
  }

  @computed
  public get isTesting() {
    return webhookStore.isPinging(this.webhook.id!);
  }

  @computed
  public get canRemoveWebhook() {
    return getAcl().checkPermission(Permission.DeleteWebhook);
  }

  @computed
  public get canTestWebhook() {
    return getAcl().checkPermission(Permission.TestWebhook);
  }

  @computed
  public get canEditWebhook() {
    return getAcl().checkPermission(Permission.EditWebhook);
  }

  private addOrRemove(set: EventType[], element: EventType | string, add: boolean) {
    const elt = element as EventType;
    if (add) {
      if (!set.includes(elt)) {
        set.push(elt);
      }
    } else {
      const idx = set.indexOf(elt);
      if (idx > -1) {
        set.splice(idx, 1);
      }
    }
  }
}
