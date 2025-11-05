import * as React from "react";
import { IconName, Icon, IconSize, IconArea } from "@root/shared";
import { Webhook } from "@root/data/management";
import { observer } from "mobx-react";
import { t } from "@root/lib/i18n";

const styles = require("./webhook-status.scss");

export interface WebhookStatusProps {
  webhook: Webhook;
}

/**
 * Small component to display the status of a webhook.
 */
@observer
export class WebhookStatus extends React.Component<WebhookStatusProps, {}> {
  public render() {
    const enabled = this.props.webhook.enabled;
    const icon = enabled ? IconName.StatusPassed : IconName.StatusFailed;
    const className = enabled ? styles.enabled : styles.disabled;
    const text = enabled ? t("state.enabled") : t("state.disabled");

    return (
      <div className={className}>
        <Icon icon={icon} size={IconSize.XSmall} area={IconArea.Normal} />
        <span>{text}</span>
      </div>
    );
  }
}
