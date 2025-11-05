import { observer } from "mobx-react";
import * as React from "react";
import { MessageBar, Icon, IconName, IconSize, Grid, RowCol, NotificationType } from "@root/shared";
import { optInSettingUIStore } from "./opt-in-setting-ui-store";
import { t } from "@root/lib/i18n";

@observer
export class OptInCard extends React.Component {
  public UNSAFE_componentWillMount() {
    optInSettingUIStore.loadOptInRequirementIfNecessary();
  }

  public render() {
    const shouldShowBanner = optInSettingUIStore.shouldShowNotification;
    const { optIn, optOut } = optInSettingUIStore;

    return shouldShowBanner ? (
      <Grid>
        <RowCol>
          <MessageBar
            type={NotificationType.Info}
            onAction={optIn}
            onDismiss={optOut}
            actionButtonText={t("management:optInDialog.actionButtonText")}
            dismissButtonText={t("management:optInDialog.dismissButtonText")}
            icon={<Icon icon={IconName.MobileCenter} size={IconSize.Medium} />}
          >
            {t("management:optInDialog.message")}
          </MessageBar>
        </RowCol>
        <RowCol></RowCol>
      </Grid>
    ) : null;
  }
}
