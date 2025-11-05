import * as React from "react";
import { observer } from "mobx-react";
import { MediaObject, Text, Size, TextColor, Skeletal } from "@root/shared";
import { Team } from "@root/data/management/models";
import { TeamCardMenu } from "./team-card-menu";
import { TeamType } from "@root/data/management/stores/team-store";
import { DetailsCard } from "@root/management/orgs/people/components/details-card/details-card";

const classNames = require("classnames");
const styles = require("./team-card.scss");

export interface TeamCardProps extends Skeletal {
  organizationName: string;
  team: Team;
  teamType: TeamType;
  selected?: boolean;
  condensed?: boolean;
  onDelete?: (organizationName: string, team: Team) => void;
  onLeave?: (organizationName: string, team: Team) => void;
}

@observer
export class TeamCard extends React.Component<TeamCardProps, {}> {
  public static defaultProps: TeamCardProps = {
    organizationName: undefined as any,
    team: {} as any,
    teamType: undefined as any,
    selected: false,
    condensed: false,
    onDelete: null as any,
    onLeave: null as any,
  };

  public render() {
    const { team, teamType, selected, condensed, organizationName, onDelete, onLeave, skeleton } = this.props;
    const appsHeaderClassName = classNames({ [styles.hidden]: condensed });
    const displayNameSize = condensed ? Size.Medium : Size.Large;

    return (
      // @ts-ignore. [Should fix it in the future] Strict error.
      <DetailsCard
        data-test-class="team-card"
        condensed={condensed}
        selected={selected}
        primaryTitleArea={
          <MediaObject skeleton={skeleton} textOnly>
            <Text data-test-class="display-team-name" className={styles.text} ellipsize size={displayNameSize} bold={!condensed}>
              {team.displayName}
            </Text>
            <Text className={styles.text} size={Size.Small} color={TextColor.Secondary}>
              {team.prettyMemberCount}
            </Text>
          </MediaObject>
        }
        secondaryTitleArea={
          <MediaObject skeleton={skeleton} textOnly className={appsHeaderClassName}>
            <Text className={styles.text} size={Size.Small} color={TextColor.Secondary}>
              APPS
            </Text>
            <Text className={styles.text} size={Size.Medium} ellipsize>
              {team.prettyAppCount}
            </Text>
          </MediaObject>
        }
        menu={
          <TeamCardMenu organizationName={organizationName} team={team} teamType={teamType} onDelete={onDelete} onLeave={onLeave} />
        }
      />
    );
  }
}
