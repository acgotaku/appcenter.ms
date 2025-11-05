import * as React from "react";
import { MediaObject, GridRowCol, Space, Text, Size, TextColor, Skeletal, NavigationListItemProps } from "@root/shared";
import { AzureSubscription } from "@root/data/management/models/azure-subscription";

export interface SubscriptionCardProps extends Skeletal, NavigationListItemProps {
  subscription: AzureSubscription;
  to?: string;
}

export class SubscriptionCard extends React.Component<SubscriptionCardProps, {}> {
  static displayName = "SubscriptionCard";

  public render() {
    const { subscription, skeleton, to, ...props } = this.props;
    const needsSkeleton = skeleton && !subscription;

    return (
      <GridRowCol data-test-class="subscription-card" role="listitem" {...props} to={needsSkeleton ? undefined : to}>
        <MediaObject hSpace={Space.XSmall} textOnly skeleton={needsSkeleton}>
          <Text size={Size.Medium} bold ellipsize>
            {needsSkeleton ? "" : subscription.name}
          </Text>
          <Text size={Size.Medium} ellipsize color={TextColor.Secondary}>
            {needsSkeleton ? "" : subscription.id}
          </Text>
        </MediaObject>
      </GridRowCol>
    );
  }
}
