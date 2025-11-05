import * as React from "react";
import {
  Row,
  Table,
  SummaryCell,
  Gravatar,
  RowHeight,
  IconName,
  Cell,
  PrimaryButton,
  ButtonSize,
  Color,
  Menu,
  Trigger,
  ClickableIcon,
  Action,
  LiveRegion,
  Grid,
  RowCol,
  GridSpacing,
  IconSize,
  Icon,
  UserInitialsAvatar,
} from "@root/shared";
import { observer } from "mobx-react";
import { withTranslation, WithTranslation } from "react-i18next";
import { DistributionGroupDetailsStrings, AddTesterInputStrings } from "@root/distribute/utils/strings";
import { t } from "@root/lib/i18n";

import { AddTesterInputStore } from "@root/distribute/stores/add-tester-input-store";
import { AddTesterPillsInput } from "@root/distribute/distribution-groups/tester-pills/add-tester-pills-input";
import { DistributionGroupTestersUiStore } from "./distribution-group-testers-ui-store";
import { aadGroupsListStore } from "@root/data/distribute/stores/aad-groups-list-store";
import { DistributionGroupDetailsStore } from "@root/distribute/stores/distribution-group-details-store";

const styles = require("./distribution-group-testers.scss");

export interface DistributionGroupTestersProps {
  groupDetailsStore: DistributionGroupDetailsStore;
  organizationName: string;
  groupName: string;
  totalAppsCount: number;
}

export const DistributionGroupTesters = withTranslation(["management"])(
  observer(
    class DistributionGroupTesters extends React.Component<DistributionGroupTestersProps & WithTranslation, {}> {
      private distributionGroupTestersUiStore: DistributionGroupTestersUiStore = new DistributionGroupTestersUiStore(
        this.props.organizationName,
        this.props.groupName
      );
      private testerInputStore: AddTesterInputStore = new AddTesterInputStore(this.props.organizationName);

      public componentDidMount() {
        aadGroupsListStore.initTenantIdAndFetch(this.props.groupName, this.props.organizationName);
        this.distributionGroupTestersUiStore.fetchTesters();
      }

      public UNSAFE_componentWillReceiveProps(nextProps: DistributionGroupTestersProps) {
        const { organizationName, groupName } = this.props;
        const { groupName: nextGroupName, organizationName: nextOrgName } = nextProps;
        if (groupName !== nextGroupName || organizationName !== nextOrgName) {
          this.distributionGroupTestersUiStore.update(nextOrgName, nextGroupName);
          this.testerInputStore = new AddTesterInputStore(nextOrgName);
          aadGroupsListStore.fetchCollection({ distributionGroupName: nextGroupName, organizationName: nextOrgName });
          this.distributionGroupTestersUiStore.fetchTesters();
        }
      }

      public componentWillUnmount() {
        this.distributionGroupTestersUiStore.clearReaction();
      }
      public renderManagement = (testerOrGroup, props, info): JSX.Element => {
        const { organizationName, groupName, totalAppsCount } = this.props;
        const showResendInvitationAction = !testerOrGroup.aad_group_id && testerOrGroup.invitePending(groupName) && totalAppsCount > 0;
        const onresendInvitationClick = () =>
          this.distributionGroupTestersUiStore.resendInvitation(testerOrGroup.email, organizationName, groupName);
        return (
          <Cell hideUntilRowHover aria-describedby={undefined}>
            <Menu data-test-id={`menu-delete-tester-${info.index}`}>
              <Trigger>
                <ClickableIcon key={testerOrGroup.email} icon={IconName.More} />
              </Trigger>
              {showResendInvitationAction ? (
                <Action text={DistributionGroupDetailsStrings.ResendInviteText} onClick={onresendInvitationClick} />
              ) : null}
              <Action
                danger
                text={t("distribute:testers.delete")}
                onClick={() => this.distributionGroupTestersUiStore.removeTestersOrGroup([testerOrGroup])}
              />
            </Menu>
          </Cell>
        );
      };

      public renderRow = (testerOrGroup, props, info): JSX.Element => {
        if (testerOrGroup.aad_group_id) {
          // alternatively, we should try to sort out the typing and casing differences between distributionGroupUser & distributionGroupTester
          return (
            <Row {...props} label={testerOrGroup.display_name || testerOrGroup.email}>
              <SummaryCell
                title={testerOrGroup.display_name || testerOrGroup.email}
                subtitle={testerOrGroup.display_name ? testerOrGroup.email : null}
                icon={<Icon icon={IconName.AadGroup} size={IconSize.Medium} />}
              />
              {this.renderManagement(testerOrGroup, props, info)}
            </Row>
          );
        } else {
          return (
            <Row {...props} label={testerOrGroup.displayName || testerOrGroup.email}>
              <SummaryCell
                title={testerOrGroup.displayName || testerOrGroup.email}
                subtitle={testerOrGroup.displayName ? testerOrGroup.email : null}
                icon={
                  <Gravatar
                    email={testerOrGroup.email}
                    fallback={
                      testerOrGroup.display_name ? (
                        <UserInitialsAvatar initialsName={testerOrGroup.display_name} />
                      ) : testerOrGroup.name ? (
                        <UserInitialsAvatar initialsName={testerOrGroup.name} />
                      ) : undefined
                    }
                  />
                }
              />
              {this.renderManagement(testerOrGroup, props, info)}
            </Row>
          );
        }
      };

      public renderAddTesterInput = (): JSX.Element => {
        const errorMessage = this.distributionGroupTestersUiStore.testerInputErrorMessage;
        return (
          <div>
            <AddTesterPillsInput
              disabled={this.distributionGroupTestersUiStore.isFetchingTesters}
              addTesterStore={this.distributionGroupTestersUiStore as any}
              addTesterInputStore={this.testerInputStore}
              placeholderText={AddTesterInputStrings.SearchBarPlaceholderTextSimple}
              showAadGroups={true}
            />
            <LiveRegion role="alert" active={Boolean(errorMessage)}>
              <div className={styles.error}>{errorMessage}</div>
            </LiveRegion>
          </div>
        );
      };

      public render() {
        const { aadGroupsAndTestersList, isFetchingTesters } = this.distributionGroupTestersUiStore;
        const addTester = (() => {
          return this.renderAddTesterInput();
        })();

        const testerTable = (() => {
          if (isFetchingTesters || !aadGroupsAndTestersList.length) {
            return null;
          } else {
            return (
              <Table
                data-test-id="testers-table"
                title="Testers"
                headerCheckboxAriaLabel={"Testers"}
                data={aadGroupsAndTestersList}
                columns={[
                  {
                    title: "Name",
                    width: 1.0,
                    sortable: true,
                  },
                ]}
                selectable={true}
                selectedItemsString={(count) => t("management:testerTable.headerOnTestersSelection", { count })}
                renderSelectionToolbar={(selectedRows) => (
                  <PrimaryButton
                    size={ButtonSize.Small}
                    color={Color.Red}
                    onClick={() => this.distributionGroupTestersUiStore.removeTestersOrGroup(Array.from(selectedRows))}
                    data-test-id="delete-selected-testers"
                  >
                    Remove
                  </PrimaryButton>
                )}
                rowHeight={RowHeight.MultiLine}
                renderRow={(tester, props, info) => {
                  return this.renderRow(tester, props, info);
                }}
                eventualRowCount={aadGroupsAndTestersList.length || 4}
                renderPlaceholderRow={(props) => {
                  return (
                    <Row {...props}>
                      <SummaryCell skeleton title="title" subtitle="subtitle" icon={IconName.Default} />
                      <Cell skeleton />
                    </Row>
                  );
                }}
              />
            );
          }
        })();

        return (
          <Grid rowSpacing={GridSpacing.Page}>
            <RowCol>{addTester}</RowCol>
            <RowCol>{testerTable}</RowCol>
          </Grid>
        );
      }
    }
  )
);
