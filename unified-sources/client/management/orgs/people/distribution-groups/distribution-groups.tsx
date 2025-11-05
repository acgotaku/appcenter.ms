import * as React from "react";
import { withTranslation, WithTranslation } from "react-i18next";
import { RouteComponentProps } from "react-router";
import { observer } from "mobx-react";
import {
  Page,
  TopBar,
  Panelify,
  PanelInjectedProps,
  PanelOutlet,
  PrimaryButton,
  EmptyState,
  PanelPosition,
  NavigationList,
  Grid,
  GridSpacing,
  RowCol,
  ListVirtualization,
} from "@root/shared";
import { DistributionGroup } from "@root/data/distribute";
import { DistributionGroupsUIStore } from "@root/management/orgs/people/distribution-groups/distribution-groups-ui-store";
import { DistributionGroupCard } from "@root/management/orgs/people/distribution-groups/distribution-group-card/distribution-group-card";
import { range } from "lodash";

const noGroupsImg = require("./images/no-groups.svg");
const styles = require("./distribution-groups.scss");

export interface DistributionGroupsProps extends PanelInjectedProps {
  // Nothing to add here yet.
}

export const DistributionGroups = Panelify(
  withTranslation(["common", "distribute"])(
    observer(
      class DistributionGroups extends React.Component<DistributionGroupsProps & RouteComponentProps<any, any> & WithTranslation, {}> {
        private distributionGroupsUiStore = new DistributionGroupsUIStore(this.props.params["org_name"]);

        public componentDidMount() {
          const { fetch, fetchAllMembers } = this.distributionGroupsUiStore;
          fetch();
          fetchAllMembers();
        }

        public render() {
          const { params, t, panelPosition } = this.props;
          const { org_name: organizationName, group_name: groupName } = params;
          const { distributionGroups, isFetching } = this.distributionGroupsUiStore;
          const newDistributionTeamPath = `/orgs/${organizationName}/people/distribution-groups/create`;
          const noSharedGroups = distributionGroups.length === 0;
          const condensed = panelPosition === PanelPosition.Secondary;

          const showEmptyState = !isFetching && noSharedGroups;
          const showSkeleton = isFetching && noSharedGroups;
          const listItems = showSkeleton ? range(0, 4).map(() => new DistributionGroup()) : distributionGroups;

          return (
            <Page data-test-id="org-distribution-groups">
              <TopBar
                title={t("access.distributionGroup", { count: 0 })}
                closeButton={false}
                controlsArea={
                  noSharedGroups ? null : (
                    <PrimaryButton data-test-id="groups-list-new-group-button" to={newDistributionTeamPath}>
                      {t("distribute:groups.newGroup.create")}
                    </PrimaryButton>
                  )
                }
              />
              {showEmptyState ? (
                <EmptyState
                  data-test-id="groups-list-empty-state"
                  imgSrc={noGroupsImg}
                  title={t("access.distributionGroup", { count: 0 })}
                  subtitle={t("distribute:groups.newGroup.subtitle")}
                  buttonText={t("distribute:groups.newGroup.create")}
                  to={newDistributionTeamPath}
                  className={styles["empty-groups"]}
                />
              ) : (
                <div>
                  <NavigationList
                    enableArrowKeyFocus={PanelPosition.Secondary}
                    items={listItems}
                    virtualize={ListVirtualization.Never}
                    activeItem={(group) => group.name === groupName}
                    renderContainer={(props) => <Grid rowSpacing={GridSpacing.None} bordered padded {...props} />}
                    renderItem={(group: DistributionGroup, props, { index }) => (
                      <div role="listitem">
                        <RowCol
                          className={styles.row}
                          {...props}
                          columnSpacing={GridSpacing.None}
                          key={group.name || index}
                          to={
                            showSkeleton
                              ? (null as any)
                              : `/orgs/${organizationName}/people/distribution-groups/${encodeURIComponent(group.name)}/testers`
                          }
                        >
                          <DistributionGroupCard
                            condensed={condensed}
                            skeleton={showSkeleton}
                            group={group}
                            key={group.id || index}
                            selected={group.name === groupName}
                          />
                        </RowCol>
                      </div>
                    )}
                  />
                </div>
              )}
              <PanelOutlet>{this.props.children}</PanelOutlet>
            </Page>
          );
        }
      }
    )
  )
);
