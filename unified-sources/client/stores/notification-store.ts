import { uniqueId } from "lodash";
import { observable, action, IObservableArray } from "mobx";
import { MouseEventHandler } from "react";
import { Toasty, ScreenReaderToasty } from "@lib/common-interfaces/toaster";

// Similar to Toasty, but without `id` (because we want to set that ourselves), and with `persistent`
export type Notification = {
  /**
   * Controls whether the notification should remain onscreen until dismissed
   * or automatically close after several seconds of non-interaction.
   */
  persistent: boolean;
  /**
   * The text of the notification
   */
  message: string;
  /**
   * The text to display on the button, if there should be a button.
   */
  buttonText?: string;
  /**
   * The callback for clicking the button, if there should be a button.
   * Alternatively, passing a string will turn the button into an anchor
   * with its `href` set to this string.
   */
  action?: string | MouseEventHandler<HTMLButtonElement>;
  /**
   * A callback to be run when a persistent notification is manually
   * dismissed by clicking the close button.
   */
  onDismiss?(): void;
};

// Same as `Notification` but for screen readers
export type ScreenReaderNotification = {
  /**
   * The text of the notification
   */
  message: string;
  /**
   * Delay of the notification,
   * helpful where concurrent announcements exists
   */
  delay?: number;
};

const DURATION_WITH_ACTION = 8000;
const DURATION_WITHOUT_ACTION = 6000;

export class NotificationStore {
  private timer?: number;
  private timerScreenReader?: number;

  public readonly persistentNotifications: IObservableArray<Toasty> = observable.array([], { deep: false });
  @observable public transientNotification?: Toasty;
  @observable public screenReaderNotification?: ScreenReaderToasty;

  /**
   * Renders a toast notification to the lower left corner of the screen.
   * A notification with `{ persistent: true }` will remain onscreen until
   * dismissed; otherwise it will automatically expire and be removed.
   *
   * @returns The ID of the toast that was created
   */
  @action
  public notify = (notification: Notification) => {
    const { persistent, buttonText, ...toast } = notification;
    const id = uniqueId();
    if (persistent) {
      this.persistentNotifications.unshift({ ...toast, id: id, buttonText });
    } else {
      this.transientNotification = { ...toast, id: id, buttonText };
      this.scheduleRemoval();
    }

    return id;
  };

  @action
  public dismissNotification = (toast: Toasty) => {
    const wasPersistent = this.removeNotification(toast);
    if (wasPersistent && toast.onDismiss) {
      toast.onDismiss();
    }
  };

  @action
  public removeNotification = (toast: Toasty) => {
    const wasPersistent = this.persistentNotifications.remove(toast);
    if (!wasPersistent && toast === this.transientNotification) {
      this.transientNotification = undefined;
    }

    return wasPersistent;
  };

  public unscheduleRemoval = () => {
    if (this.timer) {
      clearTimeout(this.timer);
    }
  };

  // Remove after expiration
  public scheduleRemoval = () => {
    if (this.timer) {
      clearTimeout(this.timer);
    }

    if (this.transientNotification) {
      const duration = this.transientNotification.buttonText ? DURATION_WITH_ACTION : DURATION_WITHOUT_ACTION;
      this.timer = window.setTimeout(
        action(() => {
          this.transientNotification = undefined;
        }),
        duration
      );
    }
  };

  /**
   * Accessibile notifications
   */
  @action
  public notifyScreenReader = (notification: ScreenReaderNotification) => {
    const notify = action(() => {
      this.screenReaderNotification = { id: uniqueId(), ...notification };
      this.scheduleRemovalScreenReader();
    });

    if (notification.delay) {
      setTimeout(notify, notification.delay);
    } else {
      notify();
    }
  };

  public scheduleRemovalScreenReader = () => {
    if (this.timerScreenReader) {
      clearTimeout(this.timerScreenReader);
    }
    if (this.screenReaderNotification) {
      this.timerScreenReader = window.setTimeout(
        action(() => {
          this.screenReaderNotification = undefined;
        }),
        DURATION_WITHOUT_ACTION
      );
    }
  };
}

export const notificationStore = new NotificationStore();
export const notify = notificationStore.notify;
export const notifyScreenReader = notificationStore.notifyScreenReader;
