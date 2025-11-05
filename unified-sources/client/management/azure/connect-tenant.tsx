import * as React from "react";
import {
  Modalify,
  Page,
  TopBar,
  Title,
  Size,
  SingleSelectActionList,
  SingleSelectActionItem,
  BottomBar,
  PrimaryButton,
  Text,
  TextColor,
  PageNotification,
} from "@root/shared";
import { Grid, RowCol, GridSpacing, Col } from "@root/shared/grid";
import { AADTenant } from "@lib/common-interfaces";
import { ConnectTenantUIStore } from "./connect-tenant-ui-store";
import { observer } from "mobx-react";
import { RouteComponentProps } from "react-router/lib/Router";
import { withTranslation, WithTranslation } from "react-i18next";

const tenants: AADTenant[] = (window as any).initProps.aadTenantsData;

export const ConnectTenant = Modalify(
  withTranslation(["management", "common"])(
    observer(
      class ConnectTenant extends React.Component<RouteComponentProps<{ org_name: string }, {}> & WithTranslation> {
        private connectTenantUIStore = new ConnectTenantUIStore(this.props.params.org_name);

        public render() {
          this.connectTenantUIStore.initializeSelectedItem(tenants);
          const { t } = this.props;
          return (
            <Page>
              <TopBar title={t("management:aadTenantSelectionList:title")} loading={this.connectTenantUIStore.isLoading} />
              {this.connectTenantUIStore.addTenantNotification ? (
                <PageNotification type={this.connectTenantUIStore.addTenantNotification.type}>
                  {this.connectTenantUIStore.addTenantNotification.message}
                </PageNotification>
              ) : null}
              <Grid rowSpacing={GridSpacing.Page}>
                <RowCol>
                  <Title size={Size.Small}>{t("management:aadTenantSelectionList:topBar:title")}</Title>
                </RowCol>
                <RowCol>
                  <SingleSelectActionList
                    name="tenants"
                    value={this.connectTenantUIStore.selectedTenantId}
                    onChange={(tenantId: string) => this.connectTenantUIStore.setSelectedTenantId(tenantId)}
                  >
                    {tenants.map((tenant) => (
                      <SingleSelectActionItem key={tenant.tenantId} value={tenant.tenantId} between>
                        <Col>
                          <Text size={Size.Medium} color={TextColor.Primary}>
                            {tenant.displayName}
                          </Text>
                        </Col>
                        <Col shrink>
                          <Text size={Size.Medium} color={TextColor.Secondary}>
                            {tenant.tenantId}
                          </Text>
                        </Col>
                      </SingleSelectActionItem>
                    ))}
                  </SingleSelectActionList>
                </RowCol>
              </Grid>
              <BottomBar alignRight>
                <PrimaryButton
                  disabled={this.connectTenantUIStore.buttonIsDisabled}
                  onClick={() => this.connectTenantUIStore.connectTenant()}
                >
                  {t("common:button:connect")}
                </PrimaryButton>
              </BottomBar>
            </Page>
          );
        }
      }
    )
  )
);
