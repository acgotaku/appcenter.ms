import * as React from "react";
import { observer } from "mobx-react";
import { RouteComponentProps } from "react-router";
import {
  Page,
  Modalify,
  PanelInjectedProps,
  IconName,
  ClickableIcon,
  PrimaryButton,
  ButtonContainer,
  Title,
  Size,
  Space,
  Text,
  TextColor,
  MessageBar,
  NotificationType,
  SingleSelectActionList,
  SingleSelectActionItem,
  ActionListAdd,
  Col,
  FooterArea,
} from "@root/shared";
import { Grid, RowCol } from "@root/shared/grid";
import { SubscriptionSelectionModalUIStore } from "@root/management/stores/billing/subscription-selection-modal-ui-store";
import { userStore } from "@root/stores/user-store";
import { AzureSubscription } from "@root/data/management/models/azure-subscription";

const styles = require("./subscription-selection-modal.scss");

export interface ISubscriptionSelectionModalProps {
  org_name?: string;
}

type SubscriptionSelectionModalProps = PanelInjectedProps & RouteComponentProps<ISubscriptionSelectionModalProps, {}>;

@Modalify
@observer
export class SubscriptionSelectionModal extends React.Component<SubscriptionSelectionModalProps, {}> {
  private subscriptionSelectionModalUIStore: SubscriptionSelectionModalUIStore;

  constructor(props: SubscriptionSelectionModalProps) {
    super(props);

    const { params } = this.props;
    const isOrg = params["org_name"] != null;
    const name = isOrg ? params["org_name"] : userStore.currentUser.name;

    this.subscriptionSelectionModalUIStore = new SubscriptionSelectionModalUIStore(name!, isOrg);
  }

  public render() {
    const {
      continueToReview,
      subscriptions,
      selectedSubscriptionId,
      setSubscriptionIsPending,
      closeModal,
      selectSubscription,
      needToSelectSubscription,
      subscriptionLinkingUrl,
      modalText,
      errorMessage,
    } = this.subscriptionSelectionModalUIStore;

    return (
      <Page
        data-test-id="subscription-selection-page"
        supportsMobile
        withoutPadding
        footer={
          <FooterArea alignRight>
            <ButtonContainer equalize>
              <PrimaryButton
                data-test-id="continue-button"
                disabled={needToSelectSubscription}
                onClick={continueToReview}
                progress={setSubscriptionIsPending}
              >
                {modalText.continue}
              </PrimaryButton>
            </ButtonContainer>
          </FooterArea>
        }
      >
        <div>
          <div className={styles["header-image"]}>
            <img alt="Select Azure Subscription" src={require("../images/review-subscription-plan.svg")} />
            <ClickableIcon onClick={closeModal} className={styles["close-button"]} icon={IconName.Close} data-autofocus={false} />
          </div>
          <Grid padded>
            <RowCol>
              <div>
                <Title size={Size.Small} spaceBelow={Space.Small}>
                  {modalText.title}
                </Title>
                <Text size={Size.Medium} color={TextColor.Secondary} spaceAbove={Space.XSmall}>
                  {modalText.description}
                </Text>
              </div>
              <div className={styles["select-wrapper"]}>
                {errorMessage ? (
                  <MessageBar container="Well" image={null} type={NotificationType.Error}>
                    {errorMessage}
                  </MessageBar>
                ) : null}
                <SingleSelectActionList
                  data-test-id="subscriptions-list"
                  name="subscription"
                  value={selectedSubscriptionId}
                  onChange={selectSubscription}
                >
                  {subscriptions.map((subscription: AzureSubscription) => {
                    return (
                      <SingleSelectActionItem key={subscription.id} value={subscription.id}>
                        <Col width={4}>
                          <Text size={Size.Medium}>{subscription.name}</Text>
                        </Col>
                        <Col width={8}>
                          <Text size={Size.Medium} color={TextColor.Secondary}>
                            {subscription.id}
                          </Text>
                        </Col>
                      </SingleSelectActionItem>
                    );
                  })}
                </SingleSelectActionList>
                <ActionListAdd className={styles.add} href={subscriptionLinkingUrl} text={modalText.newSubscription} />
              </div>
            </RowCol>
          </Grid>
        </div>
      </Page>
    );
  }
}
