import * as React from "react";
import { observer } from "mobx-react";
import { NotificationType, MessageBar, Markdown, autofetch } from "@root/shared";
import { FirstPartyNotificationUIStore } from "@root/management/stores/user/first-party/firstparty-notification-ui-store";

const styles = require("./firstparty-user-notification.scss");

export interface FirstPartyUserNotificationProps extends React.HTMLAttributes<HTMLElement> {
  serviceType?: string;
}

export const FirstPartyUserNotification = autofetch(null as any)(
  observer(
    class FirstPartyUserNotification extends React.Component<FirstPartyUserNotificationProps, {}> {
      private firstPartyNotificationStore = new FirstPartyNotificationUIStore();

      public fetchData() {
        this.firstPartyNotificationStore.fetchData();
      }

      public render() {
        if (this.firstPartyNotificationStore.displayNotification()) {
          return (
            <MessageBar type={NotificationType.Warning} withoutBorderRadius>
              <Markdown className={styles["markdown"]}>{this.firstPartyNotificationStore.displayMessage}</Markdown>
            </MessageBar>
          );
        } else {
          return null;
        }
      }
    }
  )
);
