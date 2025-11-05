import { logger } from "@root/lib/telemetry";
import { UpdateCategoryStore } from "@root/management/stores/billing/update-category-store";
import { VALIDATION_ERRORS, VALIDATIONS } from "@root/management/utils/formsy/validations";
import { Grid, RowCol, Card, Formsy, Col, PrimaryButton, PageNotification } from "@root/shared";
import { organizationStore } from "@root/stores";
import { Observer, observer } from "mobx-react";
import React = require("react");
import { WithTranslation, withTranslation } from "react-i18next";

const styles = require("@root/management/billing/billing.scss");

export interface IServiceTreeIDCard {
  serviceTreeID: string;
  org_name?: string;
  user_id?: string;
  visibleCategoryName?: boolean;
  smallVersion?: boolean;
}

export const ServiceTreeIDCard = withTranslation(["management"])(
  observer(
    class ServiceTreeIDCard extends React.Component<IServiceTreeIDCard & WithTranslation, {}> {
      private updateCategoryStore: UpdateCategoryStore = new UpdateCategoryStore();

      public componentDidMount() {
        const { org_name, user_id } = this.props;
        if (org_name) {
          const organization = organizationStore.find(org_name);
          if (organization) {
            if (organization.id) {
              this.updateCategoryStore.changeAccountType("organization");
              this.updateCategoryStore.changeServiceTreeID(this.props.serviceTreeID);
              this.updateCategoryStore.setAccountID(organization.id);
            } else {
              throw new Error("Organization ID not found");
            }
          }
        } else if (user_id) {
          this.updateCategoryStore.changeAccountType("user");
          this.updateCategoryStore.changeServiceTreeID(this.props.serviceTreeID);
          this.updateCategoryStore.setAccountID(user_id);
        }
      }

      public componentDidUpdate(
        prevProps: Readonly<IServiceTreeIDCard & WithTranslation<undefined, undefined>>,
        prevState: Readonly<{}>,
        snapshot?: any
      ): void {
        if (prevProps.serviceTreeID !== this.props.serviceTreeID) {
          const { org_name, user_id } = this.props;
          this.updateCategoryStore.resetState();
          if (org_name) {
            const organization = organizationStore.find(org_name);
            if (organization) {
              if (organization.id) {
                this.updateCategoryStore.changeAccountType("organization");
                this.updateCategoryStore.changeServiceTreeID(this.props.serviceTreeID);
                this.updateCategoryStore.setAccountID(organization.id);
              } else {
                throw new Error("Organization ID not found");
              }
            }
          } else if (user_id) {
            this.updateCategoryStore.changeAccountType("user");
            this.updateCategoryStore.changeServiceTreeID(this.props.serviceTreeID);
            this.updateCategoryStore.setAccountID(user_id);
          }
        }
      }

      private _handleSubmit(newOrganizationData: any): void {
        const { serviceTreeID } = newOrganizationData;

        logger.info("Updating category", serviceTreeID);
        this.updateCategoryStore!.update(serviceTreeID);
      }

      public render() {
        const { t, smallVersion } = this.props;
        const { notification, isPending, isServiceTreeIDUpdated } = this.updateCategoryStore!;
        if (!this.updateCategoryStore) {
          return <>Something went wrong</>;
        }

        return (
          <>
            <Card className={styles.card} withoutPadding>
              <Formsy.Form onValidSubmit={(data) => this._handleSubmit(data)} validationErrors={{}}>
                <RowCol>
                  {notification && notification.message ? (
                    <PageNotification type={notification.type}>{notification.message}</PageNotification>
                  ) : null}
                </RowCol>
                <Col>
                  <Grid>
                    <RowCol>
                      <Observer>
                        {() => (
                          <Formsy.Input
                            label={t("management:serviceTreeID.serviceTreeID")}
                            name="serviceTreeID"
                            value={this.updateCategoryStore!.serviceTreeID}
                            onChange={(event) => {
                              logger.info("Input changed", event);
                              this.updateCategoryStore!.changeInputData(event);
                            }}
                            disabled={smallVersion}
                            type="text"
                            autoCorrect="none"
                            autoCapitalize="none"
                            autoComplete="off"
                            spellCheck="false"
                            validations={VALIDATIONS.SERVICE_TREE_ID}
                            validationErrors={VALIDATION_ERRORS.SERVICE_TREE_ID}
                            data-test-id="service-tree-id-input"
                          />
                        )}
                      </Observer>
                    </RowCol>
                    {smallVersion ? null : (
                      <RowCol>
                        <Observer>
                          {() => (
                            <PrimaryButton
                              data-test-id="update-service-tree-id-button"
                              type="submit"
                              progress={isPending}
                              disabled={!isServiceTreeIDUpdated}
                            >
                              {isPending
                                ? t("management:serviceTreeID.submitButton.pending")
                                : t("management:serviceTreeID.submitButton.action")}
                            </PrimaryButton>
                          )}
                        </Observer>
                      </RowCol>
                    )}
                  </Grid>
                </Col>
              </Formsy.Form>
            </Card>
          </>
        );
      }
    }
  )
);
