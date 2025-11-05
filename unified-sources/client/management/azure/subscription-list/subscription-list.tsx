import * as React from "react";
import { observer } from "mobx-react";
import {
  Card,
  Grid,
  GridSpacing,
  Skeletal,
  HeaderArea,
  Paragraph,
  Size,
  TextColor,
  NavigationList,
  ListVirtualization,
} from "@root/shared";
import { AzureSubscription, SubscriptionType } from "@root/data/management/models/azure-subscription";
import { User } from "@root/data/shell/models/user";
import { Organization } from "@root/data/shell/models/organization";
import { SubscriptionCard } from "./subscription-card/subscription-card";
import { withTranslation, WithTranslation, Trans } from "react-i18next";
import { Link } from "react-router";

const styles = require("../../../shared/styles/utils.scss");

export interface SubscriptionListProps extends Skeletal {
  subscriptions: AzureSubscription[];
  selectedSubscriptionId: string;
  condensed: boolean;
  eventualSubscriptionCount: number;
  type: SubscriptionType;
  owner: Partial<User | Organization>;
}

export const SubscriptionList = withTranslation("management")(
  observer(
    class SubscriptionList extends React.Component<SubscriptionListProps & WithTranslation, {}> {
      public static defaultProps: SubscriptionListProps = {
        subscriptions: [],
        selectedSubscriptionId: "",
        condensed: false,
        eventualSubscriptionCount: 4,
        type: undefined as any,
        owner: undefined as any,
      };

      public render() {
        const { subscriptions = [], condensed, selectedSubscriptionId, type, owner, t } = this.props;
        const isOrganizationType = type === SubscriptionType.Organization;
        const subcriptionsListUrl = isOrganizationType ? `/orgs/${owner.name}/manage/azure` : "/settings/azure";
        const {
          location: { origin },
        } = window;
        const parameters = `?original_url=${subcriptionsListUrl}&get_token=true&account_type=${
          isOrganizationType ? "organization" : "user"
        }&account_id=${owner.id}`;
        const linkSubscriptionUrl = `${origin}/auth/aad/subscriptions${parameters}`;
        const isEmpty = subscriptions.length === 0;

        return (
          <Card
            withoutPadding={!isEmpty}
            dividedHeader
            header={
              !condensed ? (
                <HeaderArea title="Subscriptions">
                  <a data-test-id="add-subscription-button" href={linkSubscriptionUrl} target="_blank" rel="noopener">
                    {t("management:subscriptionList.addSubscription")}
                    <span className={styles["screen-reader-only"]}>(opens in a new tab)</span>
                  </a>
                </HeaderArea>
              ) : null
            }
          >
            {isEmpty ? (
              <Paragraph size={Size.Medium} color={TextColor.Secondary}>
                <Trans i18nKey="management:subscriptionList.empty">
                  <a href="https://docs.microsoft.com/en-us/appcenter/general/azure-subscriptions/">link</a>
                </Trans>
              </Paragraph>
            ) : (
              <NavigationList
                items={subscriptions}
                virtualize={ListVirtualization.Never}
                activeItem={(subscription) => subscription.id === selectedSubscriptionId}
                renderContainer={(props) => <Grid rowSpacing={GridSpacing.XSmall} bordered padded {...props} />}
                renderItem={(subscription, props) => (
                  <React.Fragment key={subscription.id}>
                    <Link
                      to={`${subcriptionsListUrl}/${subscription.id}`}
                      className={styles["full-link"]}
                      aria-label={subscription.name}
                    />
                    <SubscriptionCard {...props} subscription={subscription} />
                  </React.Fragment>
                )}
              />
            )}
          </Card>
        );
      }
    }
  )
);
