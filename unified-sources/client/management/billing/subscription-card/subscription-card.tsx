import * as React from "react";
import { observer } from "mobx-react";
import {
  Card,
  Text,
  TextColor,
  Size,
  Icon,
  ClickableIcon,
  IconName,
  IconSize,
  ButtonSize,
  Color,
  Space,
  PrimaryButton,
  SecondaryButton,
  ButtonContainer,
} from "@root/shared";
import { AzureSubscription } from "@root/data/management/models/azure-subscription";
import { withTranslation, WithTranslation } from "react-i18next";

const styles = require("./subscription-card.scss");

export interface ISubscriptionCardProps extends React.HTMLAttributes<HTMLElement> {
  subscription?: AzureSubscription;
  editPath: string;
  editable?: boolean;
}

export const SubscriptionCard = withTranslation(["management"])(
  observer(
    class SubscriptionCard extends React.Component<ISubscriptionCardProps & WithTranslation, {}> {
      public render() {
        const { subscription, editPath, editable, t } = this.props;

        if (!subscription) {
          return (
            <Card withoutPadding className={this.props.className}>
              <header className={styles.stretch}>
                <Text size={Size.Large}>{t("management:billingSubscription.subscriptionCard.payment")}</Text>
                {editable ? (
                  <ClickableIcon data-test-id="subscription-edit-icon" to={editPath} icon={IconName.Edit} size={ButtonSize.Small} />
                ) : null}
              </header>
              <Text size={Size.Medium} color={TextColor.Secondary}>
                {t("management:billingSubscription.subscriptionCard.noSubscription")}
              </Text>
            </Card>
          );
        }

        const { isBillable, id, name } = subscription;

        return (
          <Card withoutPadding className={this.props.className}>
            {isBillable ? (
              <span>
                <header className={styles.stretch}>
                  <Text size={Size.Large}>{t("management:billingSubscription.subscriptionCard.payment")}</Text>
                  {editable ? (
                    <ClickableIcon data-test-id="subscription-edit-icon" to={editPath} icon={IconName.Edit} size={ButtonSize.Small} />
                  ) : null}
                </header>
                <div className={styles["subscription-info"]}>
                  <div className={styles.flex}>
                    <Icon icon={IconName.AzureSubscription} size={IconSize.Medium} className={styles.icon} />
                    <div className={styles["subscription-name"]}>
                      <Text size={Size.Medium} color={TextColor.Secondary}>
                        {t("management:billingSubscription.subscriptionCard.azure")}
                      </Text>
                      <Text size={Size.Medium} color={TextColor.Primary} bold data-test-id="subscription-name">
                        {name}
                      </Text>
                    </div>
                  </div>
                  <Text size={Size.Medium} color={TextColor.Secondary}>
                    {id}
                  </Text>
                </div>
              </span>
            ) : (
              <span>
                <header className={styles["error-header"]}>
                  <Icon icon={IconName.AppCrashes} size={IconSize.Small} color={Color.Red} className={styles.icon} />
                  <Text size={Size.Large}>{t("management:billingSubscription.subscriptionCard.payment")}</Text>
                </header>
                <Text tagName="div" size={Size.Medium} spaceAbove={Space.Small} spaceBelow={Space.Small}>
                  {t("management:billingSubscription.subscriptionCard.azureError")}
                </Text>
                <div className={styles.stretch}>
                  <div className={styles.flex}>
                    <Icon icon={IconName.AzureSubscriptionDisabled} size={IconSize.Medium} className={styles.icon} />
                    <div className={styles["subscription-name"]}>
                      <Text size={Size.Medium} color={TextColor.Secondary}>
                        {t("management:billingSubscription.subscriptionCard.azure")}
                      </Text>
                      <Text size={Size.Medium} color={TextColor.Primary} bold>
                        {name}
                      </Text>
                    </div>
                  </div>
                  {editable ? (
                    <ButtonContainer>
                      <SecondaryButton href="https://go.microsoft.com/fwlink/?linkid=862017" target="_blank">
                        {t("management:billingSubscription.subscriptionCard.learnMore")}
                      </SecondaryButton>
                      <PrimaryButton to={editPath} color={Color.Red}>
                        {t("management:billingSubscription.subscriptionCard.selectSubscription")}
                      </PrimaryButton>
                    </ButtonContainer>
                  ) : null}
                </div>
              </span>
            )}
          </Card>
        );
      }
    }
  )
);
