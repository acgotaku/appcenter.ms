import { Grid, RowCol, Size, TextColor, Text } from "@root/shared";
import { observer } from "mobx-react";
import React = require("react");
import { WithTranslation, withTranslation } from "react-i18next";
import { SubscriptionCard } from "../subscription-card/subscription-card";
import { AzureSubscription } from "@root/data/management";

const styles = require("./preview-billing-card.scss");

export interface IPreviewBillingCardProps {
  subscription?: AzureSubscription;
  serviceTreeID: string;
}

export const PreviewBillingCard = withTranslation(["management"])(
  observer(
    class PreviewBillingCard extends React.Component<IPreviewBillingCardProps & WithTranslation, {}> {
      public render() {
        const { subscription, serviceTreeID } = this.props;
        return (
          <Grid>
            <RowCol>
              <SubscriptionCard editPath={""} subscription={subscription} editable={false} />
            </RowCol>
            <RowCol>
              <header className={styles.stretch}>
                <Text size={Size.Large}>{"Service Tree ID"}</Text>
              </header>
              <Text size={Size.Medium} color={TextColor.Secondary}>
                {serviceTreeID}
              </Text>
            </RowCol>
          </Grid>
        );
      }
    }
  )
);
