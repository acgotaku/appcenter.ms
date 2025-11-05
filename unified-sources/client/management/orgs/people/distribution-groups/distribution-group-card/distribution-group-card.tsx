import * as React from "react";
import { observer } from "mobx-react";
import { MediaObject, Text, Size, TextColor, Skeletal, AppIcon, Pill, Space } from "@root/shared";
import { DetailsCard } from "@root/management/orgs/people/components/details-card/details-card";
import { DistributionGroup } from "@root/data/distribute";
import { DistributionGroupsListStrings } from "@root/distribute/utils/strings";
import { IdenticonList } from "@root/shared/identicon-list/identicon-list";

const styles = require("@root/distribute/distribution-groups/distribution-groups-table-row.scss");

export interface DistributionGroupCardProps extends Skeletal {
  group: DistributionGroup;
  selected?: boolean;
  condensed?: boolean;
}

@observer
export class DistributionGroupCard extends React.Component<DistributionGroupCardProps, {}> {
  public static defaultProps: DistributionGroupCardProps = {
    group: new DistributionGroup(),
    selected: false,
    condensed: false,
  };

  public render() {
    const { selected, condensed, skeleton, group } = this.props;
    const displayNameSize = condensed ? Size.Medium : Size.Large;
    const showIdenticonList = !condensed;
    const publicLabelPrimary =
      group.isPublic && !condensed ? (
        <Pill className={styles["public-label"]} subtle data-test-class="public-label">
          {DistributionGroupsListStrings.PublicGroupLabelText}
        </Pill>
      ) : null;
    const publicLabelSecondary = group.isPublic && condensed ? DistributionGroupsListStrings.PublicGroupLabelWithApps : null;
    return (
      // @ts-ignore. [Should fix it in the future] Strict error.
      <DetailsCard
        data-test-class="distribution-group-card"
        condensed={condensed}
        selected={selected}
        primaryTitleArea={
          <MediaObject skeleton={skeleton} textOnly>
            <Text data-test-id="display-group-name" ellipsize size={displayNameSize} bold={!condensed}>
              {group.displayName}
              {publicLabelPrimary}
            </Text>
            <MediaObject hSpace={Space.XXSmall}>
              <Text size={Size.Small} color={TextColor.Secondary}>
                {publicLabelSecondary}
                {group.prettyPrintAppCount}
              </Text>
            </MediaObject>
          </MediaObject>
        }
        secondaryTitleArea={
          <MediaObject skeleton={skeleton} textOnly>
            <Text size={Size.Small} color={TextColor.Secondary}>
              TESTERS
            </Text>
            <Text size={Size.Medium} ellipsize>
              {group.prettyPrintTesterCount}
            </Text>
          </MediaObject>
        }
        iconListArea={
          showIdenticonList ? (
            <IdenticonList
              data={group.apps ? group.apps.slice(0, 10) : []}
              skeleton={skeleton}
              renderItem={({ item: app, size }) => <AppIcon key={app.id} size={size} app={app} />}
            />
          ) : null
        }
      />
    );
  }
}
