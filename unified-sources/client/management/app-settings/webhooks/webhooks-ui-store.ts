import { observable, action, computed, IObservableArray } from "mobx";
import { notify, notifyScreenReader } from "@root/stores";
import { webhookStore, Webhook, WebhookPingResult } from "@root/data/management";
import { Permission } from "@root/shared/utils/permissions/settings";
import { NotificationType, getAcl } from "@root/shared";
import { INotificationMessage } from "../../constants/constants";
import { t } from "@root/lib/i18n";

/**
 * UI Store for webhooks page.
 */
export class WebhooksUIStore {
  private readonly deletingIds: IObservableArray<any> = observable.array([], { deep: false });
  @observable public removingWebhooks!: Webhook[];
  @observable public removeWebhooksWarningIsVisible = false;
  @observable public editingWebhook!: Webhook;
  private testingWebhook!: Webhook;

  @action
  public fetchWebhooks() {
    webhookStore.fetchCollection();
  }

  @computed
  public get webhooks() {
    return webhookStore.resources.sort((a, b) => a!.name!.localeCompare(b!.name!));
  }

  @computed
  public get isEmpty() {
    return webhookStore.isEmpty;
  }

  @computed
  public get placeholderRowCount() {
    return this.webhooks.length || (webhookStore.isFetchingCollection ? 5 : 0);
  }

  @computed
  public get isLoading() {
    return webhookStore.isFetchingCollection;
  }

  @computed
  public get isFetching() {
    return webhookStore.isFetchingCollection;
  }

  @computed
  public get notification(): INotificationMessage | undefined {
    if (webhookStore.collectionFetchFailed) {
      return {
        type: NotificationType.Error,
        message: t("management:appWebhooks.error.fetch"),
      };
    }

    const failedDeletionsCount = this.deletingIds.filter((id) => webhookStore.deletionFailed(id)).length;
    if (failedDeletionsCount) {
      const message = (() => {
        switch (true) {
          case failedDeletionsCount === 1:
            return t("management:appWebhooks.error.delete.one");
          case failedDeletionsCount === this.deletingIds.length:
            return t("management:appWebhooks.error.delete.all");
          default:
            return t("management:appWebhooks.error.delete.some");
        }
      })();

      return {
        type: NotificationType.Error,
        message,
      };
    }

    if (this.editingWebhook && webhookStore.updateError(this.editingWebhook)) {
      return {
        type: NotificationType.Error,
        message: t("management:appWebhooks.error.disable", { webhook: this.editingWebhook }),
      };
    }

    if (this.testingWebhook && webhookStore.pingError(this.testingWebhook.id!)) {
      return {
        type: NotificationType.Error,
        message: t("management:appWebhooks.error.test", { webhook: this.editingWebhook }),
      };
    }
  }

  @computed
  public get canRemoveWebhooks() {
    return getAcl().checkPermission(Permission.DeleteWebhook);
  }

  @computed
  public get canCreateWebhooks() {
    return getAcl().checkPermission(Permission.CreateWebhook);
  }

  @computed
  public get canEditWebhooks() {
    return getAcl().checkPermission(Permission.EditWebhook);
  }

  @computed
  public get canTestWebhooks() {
    return getAcl().checkPermission(Permission.TestWebhook);
  }

  @action
  public removeWebhooks = (webhooks: Set<Webhook>) => {
    this.removingWebhooks = observable.array(Array.from(webhooks));
    this.removeWebhooksWarningIsVisible = true;
  };

  @action
  public finishRemovingWebhooks = () => {
    this.deletingIds.clear();
    this.removingWebhooks.forEach((webhook) => {
      this.deletingIds.push(webhook.id);
      webhookStore.delete(webhook.id!);
    });

    notifyScreenReader({
      message: t("management:appWebhooks.wasDeletedSelected", { count: this.removingWebhooks.length }),
      delay: 500,
    });

    this.removeWebhooksWarningIsVisible = false;
    this.removingWebhooks = null as any;
  };

  @action
  public cancelRemovingWebhooks = () => {
    this.removeWebhooksWarningIsVisible = false;
    this.removingWebhooks = null as any;
  };

  @action
  public switchWebhookState = (webhook: Webhook) => {
    this.editingWebhook = webhook;
    webhookStore.update(webhook, { enabled: !webhook.enabled }).onSuccess(
      action(() => {
        notifyScreenReader({
          message: webhook.enabled
            ? t("management:appWebhooks.statusEnabled", { webhook })
            : t("management:appWebhooks.statusDisabled", { webhook }),
        });
      })
    );
  };

  @action
  public testWebhook = (webhook: Webhook) => {
    this.testingWebhook = webhook;
    webhookStore.ping(webhook).onSuccess(
      action((result: WebhookPingResult) => {
        notify({
          persistent: false,
          message:
            result.response_status_code === 200
              ? t("management:appWebhooks.testing.success")
              : t("management:appWebhooks.testing.failed"),
        });
      }) as any
    );
  };
}
