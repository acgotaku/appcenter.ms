import * as React from "react";
import { observer, inject } from "mobx-react";
import {
  Table,
  Input,
  IconName,
  InputVariant,
  ConnectToPageScroller,
  Text,
  Size,
  Color,
  TextColor,
  Column,
  RowHeight,
  SummaryCell,
  Row,
  Gravatar,
  Cell,
  ClickableIcon,
  ButtonSize,
  PrimaryButton,
  createAutocomplete,
  AvatarItem,
  Button,
  Action,
  Grid,
  GridSpacing,
  RowCol,
  UserInitialsAvatar,
} from "@root/shared";
import { IUser } from "@lib/common-interfaces";
import * as pluralize from "pluralize";
import { TeamMember, teamStore, Team } from "@root/data/management";
import { userStore } from "@root/stores/user-store";
import { organizationStore } from "@root/stores/organization-store";
import { TeamMembersUIStore } from "./team-members-ui-store";
import { LeaveTeamDialog } from "../../components/teams/dialogs/leave-team-dialog/leave-team-dialog";
import { TeamType } from "@root/data/management/stores/team-store";
import { AutocompleteComboboxWrapper } from "@root/shared/autocomplete/autocomplete";

const styles = require("./team-members.scss");
const errorImg = require("../../../../../shared/assets/images/astronomer.svg");
const Autocomplete = createAutocomplete<IUser>();

export interface TeamMembersProps {
  organizationName: string;
  teamName: string;
  allowedToManageTeam: boolean;
  isCurrentUserAnOrgAdmin: boolean;
  teamMembersUiStore?: TeamMembersUIStore;
}

interface TeamMembersState {
  inputValue: string;
}

@inject("teamMembersUiStore")
@observer
export class TeamMembers extends React.Component<TeamMembersProps, TeamMembersState> {
  private columns: Column[] = [
    {
      title: "Name",
      width: 0.75,
    },
    {
      title: "",
      width: 0.25,
    },
  ];

  public UNSAFE_componentWillMount() {
    this.handlePropsChange(this.props);
  }

  public UNSAFE_componentWillReceiveProps(nextProps: TeamMembersProps) {
    const { teamName } = nextProps;
    if (this.props.teamName !== teamName) {
      this.handlePropsChange(nextProps);
    }
  }

  public handlePropsChange = (props: TeamMembersProps): void => {
    const { teamMembersUiStore, organizationName, teamName } = props;
    teamMembersUiStore!.fetch(organizationName, teamName);
    this.resetSearchText();
  };

  constructor(props) {
    super(props);
    this.state = {
      inputValue: "",
    };
  }

  public render() {
    const { organizationName, teamName, teamMembersUiStore, allowedToManageTeam, isCurrentUserAnOrgAdmin } = this.props;
    const {
      isDeleting,
      isFetching,
      confirmLeaveTeam,
      getIsFetchingCollaborators,
      showExternalMemberNotification,
    } = teamMembersUiStore!;
    const organization = organizationStore.find(organizationName);
    const team = teamStore.get(organizationName, teamName);
    const members = (team && team.members) || [];
    const expectedUserCount = team && team.expectedMemberCount;
    const currentUserMember = teamMembersUiStore!.getMember(userStore.currentUser.name);
    const availableCollaborators = teamMembersUiStore!.getAvailableCollaborators(members, organizationName, teamName);
    const paddedMembers = !isDeleting ? members.concat(this.tryAddPlaceholders(expectedUserCount, members.length)) : members;

    const showAllMembersAddedMessage = !getIsFetchingCollaborators(organizationName) && availableCollaborators.length === 0;
    const canAddMembers = allowedToManageTeam && !showAllMembersAddedMessage;

    return (
      <Grid rowSpacing={GridSpacing.Page}>
        <RowCol visible={showAllMembersAddedMessage}>
          <Text size={Size.Medium} color={TextColor.Secondary}>
            {`All members in this organization are in ${team ? team.displayName : ""}`}
          </Text>
        </RowCol>
        <RowCol
          visible={canAddMembers}
          role="search"
          onKeyDown={showExternalMemberNotification(this.state.inputValue, organizationName)}
        >
          <Autocomplete
            className={styles.addMembers}
            value={this.state.inputValue}
            items={availableCollaborators}
            onSelectItem={this.onMemberSelect}
            searchOptions={{
              keys: ["display_name", "name", "email"],
              findAllMatches: true,
              threshold: 0.4,
              distance: 100,
              maxPatternLength: 32,
              minMatchCharLength: 1,
            }}
            renderItem={(user: IUser, index: number) => (
              <Action text={user.email!} key={index}>
                <AvatarItem email={user.email!} name={user.display_name!} />
              </Action>
            )}
          >
            <AutocompleteComboboxWrapper>
              <Input
                aria-label="Add collaborators"
                icon={IconName.AddUser}
                variant={InputVariant.Card}
                placeholder={`Add collaborators from ${organization?.display_name}`}
                onChange={this.handleInputChange}
                value={this.state.inputValue}
                showClearButton
                onClear={this.resetSearchText}
              />
            </AutocompleteComboboxWrapper>
          </Autocomplete>
        </RowCol>
        <RowCol>
          <ConnectToPageScroller>
            {(scrollElement) => (
              <Table
                data-test-id="members-table"
                title="Members"
                columns={this.columns}
                eventualRowCount={paddedMembers.length || 4}
                scrollElement={scrollElement}
                data={paddedMembers}
                rowHeight={RowHeight.MultiLine}
                headerCheckboxAriaLabel={"Members"}
                selectable={allowedToManageTeam}
                isRowSelectionDisabled={(member: TeamMember) => member && member.isMaintainer(organizationName, teamName)}
                selectedItemsString={(count) => `${count} ${count > 1 ? pluralize("member") : "member"} selected`}
                renderSelectionToolbar={(selectedRows) => (
                  <PrimaryButton size={ButtonSize.Small} color={Color.Red} onClick={this.deleteMembers(Array.from(selectedRows))}>
                    Remove
                  </PrimaryButton>
                )}
                renderRow={(member: TeamMember, props) => {
                  const isMaintainer = member.isMaintainer(organizationName, teamName);
                  const role = isMaintainer ? member.humanReadableRole(organizationName, teamName) : null;
                  const shouldShowLeaveButton = member.isCurrentUser && (!allowedToManageTeam || isCurrentUserAnOrgAdmin);

                  return (
                    <Row {...props} className={styles["member-row"]} label={member.displayName}>
                      <SummaryCell
                        title={member.displayName}
                        subtitle={member.email}
                        icon={
                          <Gravatar
                            email={member.email}
                            size={30}
                            fallback={
                              member.displayName ? (
                                <UserInitialsAvatar initialsName={member.displayName} size={30} />
                              ) : member.name ? (
                                <UserInitialsAvatar initialsName={member.name} size={30} />
                              ) : undefined
                            }
                          />
                        }
                        badge={role!}
                      />
                      <Cell hideUntilRowHover className={styles["member-role"]}>
                        <div>
                          {(() => {
                            if (isMaintainer) {
                              return null;
                            } else if (shouldShowLeaveButton) {
                              return (
                                <Button size={ButtonSize.XSmall} onClick={confirmLeaveTeam(organizationName, team!.name!)}>
                                  Leave
                                </Button>
                              );
                            } else if (allowedToManageTeam) {
                              return (
                                <ClickableIcon
                                  data-test-class="org-team-delete-member"
                                  key={member.name}
                                  icon={IconName.Delete}
                                  size={ButtonSize.XSmall}
                                  onClick={this.deleteMembers([member])}
                                />
                              );
                            } else {
                              return null;
                            }
                          })()}
                        </div>
                      </Cell>
                    </Row>
                  );
                }}
                renderPlaceholderRow={(props) => {
                  return (
                    <Row {...props}>
                      <SummaryCell skeleton title="title" subtitle="subtitle" icon={IconName.Default} />
                      <Cell skeleton />
                    </Row>
                  );
                }}
                error={
                  teamMembersUiStore?.fetchFailed ? (
                    <div className={styles["error-wrapper"]}>
                      <img alt="" role="presentation" src={errorImg} />
                      <div>We’re having trouble finding your members.</div>
                    </div>
                  ) : null
                }
              />
            )}
          </ConnectToPageScroller>
          {!isFetching && currentUserMember ? (
            <LeaveTeamDialog
              team={team!}
              organizationName={organizationName}
              onConfirmLeaveTeam={this.leaveTeam}
              teamType={TeamType.Team}
              closeOnConfirm
            />
          ) : null}
        </RowCol>
      </Grid>
    );
  }

  private handleInputChange = (event): void => {
    this.setState({
      inputValue: event.target.value,
    });
  };

  private resetSearchText = (): void => {
    this.setState({ inputValue: "" });
  };

  private onMemberSelect = (user: IUser) => {
    this.resetSearchText();
    const { teamMembersUiStore, organizationName, teamName } = this.props;
    teamMembersUiStore!.inviteMember(user, organizationName, teamName);
  };

  private leaveTeam = (organizationName: string, team: Team): void => {
    const { teamMembersUiStore } = this.props;
    const currentUserMember = teamMembersUiStore!.getMember(userStore.currentUser.name);
    teamMembersUiStore!.deleteMembers([currentUserMember], organizationName, team.name!);
  };

  private deleteMembers = (members: TeamMember[]) => (event: React.MouseEvent<HTMLElement>): void => {
    const { teamMembersUiStore, organizationName, teamName } = this.props;
    teamMembersUiStore!.deleteMembers(members, organizationName, teamName);
  };

  private tryAddPlaceholders(expectedUserCount: number, userCount: number): any[] {
    if (expectedUserCount <= userCount) {
      return [];
    }
    const placeholders: any[] = [];
    while (expectedUserCount > userCount) {
      placeholders.push(undefined);
      userCount++;
    }
    return placeholders;
  }
}
