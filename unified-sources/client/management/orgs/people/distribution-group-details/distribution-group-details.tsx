import * as React from "react";
import { RouteComponentProps } from "react-router";
import { observer } from "mobx-react";
import {
  ClickableIcon,
  IconName,
  MediaObject,
  Page,
  Panelify,
  PanelInjectedProps,
  PanelOutlet,
  Size,
  Tab,
  Tabs,
  TabSection,
  TabSections,
  Text,
  TextColor,
  TopBar,
} from "@root/shared";
import { noop } from "lodash";
import { DistributionGroupDetailsUIStore } from "@root/management/orgs/people/distribution-group-details/distribution-group-details-ui-store";
import { DistributionGroup } from "@root/data/distribute/models/distribution-group-model";
import { notFoundStore } from "@root/stores/not-found-store";
import { DistributionGroupApps } from "../distribution-group-apps/distribution-group-apps";
import { DistributionGroupTesters } from "@root/management/orgs/people/distribution-group-details/distribution-group-testers/distribution-group-testers";
import { distributionStores } from "@root/distribute/stores/distribution-stores";
const styles = require("./distribution-group-details.scss");

type DistributionGroupDetailsProps = PanelInjectedProps & RouteComponentProps<any, any>;
export enum DistributionGroupDetailsTab {
  Testers = "testers",
  Apps = "apps",
}

@Panelify
@observer
export class DistributionGroupDetails extends React.Component<DistributionGroupDetailsProps, {}> {
  private distributionGroupDetailsUiStore = new DistributionGroupDetailsUIStore(this.props.params["org_name"]);
  private mockDistributionGroup = new DistributionGroup();

  public UNSAFE_componentWillUpdate(nextProps: DistributionGroupDetailsProps) {
    const { group_name: groupName } = nextProps.params;
    const { findGroup, isFetching, resources } = this.distributionGroupDetailsUiStore;

    if (!isFetching && !findGroup(groupName) && resources.length > 0) {
      notFoundStore.notify404();
      return;
    }
  }
  get distributionGroupDetailsStore() {
    return distributionStores.getDistributionGroupDetailsStore(this.props.params.groupName);
  }

  public render() {
    const { org_name: orgName, group_name: groupName, tab } = this.props.params;
    const { findGroup, isFetching } = this.distributionGroupDetailsUiStore;
    const testerSectionId = `${DistributionGroupDetailsTab.Testers}-panel`;
    const appsSectionId = `${DistributionGroupDetailsTab.Apps}-panel`;
    const group = findGroup(groupName) || this.mockDistributionGroup;
    const totalAppsCount = group ? group.totalAppsCount : 0;
    const title = group.displayName;

    return (
      <Page data-test-id="distribution-group-details">
        <TopBar
          data-test-id="shared-group-details-topbar"
          title={title}
          subtitle={null}
          controlsArea={
            <div className={styles.controls}>
              <MediaObject textOnly skeleton={isFetching}>
                <Text uppercase size={Size.Small} color={TextColor.Secondary}>
                  Testers
                </Text>
                <Text data-test-id="shared-group-details-testerCount" size={Size.Medium} ellipsize>
                  {group.prettyPrintTesterCount}
                </Text>
              </MediaObject>
              <MediaObject textOnly skeleton={isFetching}>
                <Text uppercase size={Size.Small} color={TextColor.Secondary}>
                  Apps
                </Text>
                <Text data-test-id="shared-group-details-appsCount" size={Size.Medium} ellipsize>
                  {group.prettyPrintAppCount}
                </Text>
              </MediaObject>
              <ClickableIcon
                data-test-id="shared-group-details-edit-group-button"
                disabled={isFetching}
                icon={IconName.Settings}
                to={`/orgs/${orgName}/people/distribution-groups/${encodeURIComponent(groupName)}/${tab}/manage`}
              />
            </div>
          }
        />
        <Tabs selectedIndex={this.activeTabIndex} onSelect={noop}>
          {Object.keys(DistributionGroupDetailsTab).map((tab) => (
            <Tab
              key={DistributionGroupDetailsTab[tab]}
              to={`/orgs/${orgName}/people/distribution-groups/${encodeURIComponent(groupName)}/${DistributionGroupDetailsTab[tab]}`}
              id={DistributionGroupDetailsTab[tab]}
              aria-controls={`${DistributionGroupDetailsTab[tab]}-panel`}
            >
              {DistributionGroupDetailsTab[tab]}
            </Tab>
          ))}
        </Tabs>

        <TabSections selectedIndex={this.activeTabIndex}>
          <TabSection id={testerSectionId} aria-labelledby={DistributionGroupDetailsTab.Testers}>
            <DistributionGroupTesters
              organizationName={orgName}
              groupName={groupName}
              totalAppsCount={totalAppsCount!}
              groupDetailsStore={this.distributionGroupDetailsStore}
            />
          </TabSection>
          <TabSection id={appsSectionId} aria-labelledby={DistributionGroupDetailsTab.Apps}>
            <DistributionGroupApps orgName={orgName} groupName={groupName} />
          </TabSection>
        </TabSections>
        <PanelOutlet>{this.props.children}</PanelOutlet>
      </Page>
    );
  }

  get activeTabIndex(): number {
    const { tab } = this.props.params;
    return Object.values(DistributionGroupDetailsTab).indexOf(tab);
  }
}
