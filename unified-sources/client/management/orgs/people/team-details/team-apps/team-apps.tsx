import * as React from "react";
import {
  Table,
  Input,
  IconName,
  InputVariant,
  Text,
  Size,
  Color,
  TextColor,
  Column,
  RowHeight,
  SummaryCell,
  Row,
  AppIcon,
  Cell,
  ClickableIcon,
  ButtonSize,
  PrimaryButton,
  ButtonContainer,
  createAutocomplete,
  IconItem,
  TextCell,
  Action,
} from "@root/shared";
import { IApp, CollaboratorRole } from "@lib/common-interfaces";
import { inject, observer } from "mobx-react";
import { MemberRoleSelect } from "../../../../shared/member-role-select/member-role-select";
import { teamStore } from "@root/data/management";
import { TeamAppsUIStore } from "./team-apps-ui-store";
import { TeamType } from "@root/data/management/stores/team-store";
import { organizationStore } from "@root/stores/organization-store";
import { withTranslation, WithTranslation } from "react-i18next";
import * as pluralize from "pluralize";
import { App } from "@root/data/shell/models/app";
import { AutocompleteComboboxWrapper } from "@root/shared/autocomplete/autocomplete";

const styles = require("./team-apps.scss");
const classNames = require("classnames");
const errorImg = require("../../../../../shared/assets/images/astronomer.svg");
const Autocomplete = createAutocomplete<IApp>();

export interface AppsProps {
  organizationName: string;
  teamName: string;
  teamAppsUiStore?: TeamAppsUIStore;
  allowedToManageTeam: boolean;
  teamType: TeamType;
}

interface AppsState {
  inputValue: string;
  selectedApps: Set<App>;
}

export const TeamApps = inject("teamAppsUiStore")(
  withTranslation("management")(
    observer(
      class TeamApps extends React.Component<AppsProps & WithTranslation, Partial<AppsState>> {
        private columns: Column[] = [
          {
            title: "Name",
            width: 0.3,
          },
          {
            title: "OS",
            width: 0.1,
          },
          {
            title: "Platform",
            width: 0.3,
          },
          {
            title: "Role",
            width: 0.2,
          },
          {
            title: "",
            width: 0.1,
          },
        ];

        constructor(props) {
          super(props);
          this.state = {
            inputValue: "",
            selectedApps: new Set([]),
          };
        }

        public UNSAFE_componentWillMount() {
          this.handlePropsChange(this.props);
        }

        public UNSAFE_componentWillReceiveProps(nextProps: AppsProps) {
          const { teamName } = nextProps;
          if (this.props.teamName !== teamName) {
            this.handlePropsChange(nextProps);
          }
        }

        public handlePropsChange = (props: AppsProps): void => {
          const { teamAppsUiStore, organizationName, teamName } = props;
          teamAppsUiStore!.fetch(organizationName, teamName);
          this.resetSearchText();
        };

        public render() {
          const { organizationName, teamName, teamAppsUiStore, allowedToManageTeam, teamType, t } = this.props;
          const team = teamStore.get(organizationName, teamName);
          const organization = organizationStore.find(organizationName);
          const apps = (team && team.apps) || [];
          const availableApps = teamAppsUiStore!.getAvailableApps(apps, organizationName, teamName);

          const noAppsAddedToTeam = apps.length === 0 && !teamAppsUiStore!.isFetching;
          const hasNoAppsToAddToTeam = noAppsAddedToTeam && availableApps.length === 0;
          const showAllAppsAddedMessage = allowedToManageTeam && apps.length && !availableApps.length;
          const canAddApps = allowedToManageTeam && !hasNoAppsToAddToTeam && !showAllAppsAddedMessage;
          return (
            <div>
              <div className={classNames(styles["no-apps-to-add"], styles.hidden, { [styles.visible]: showAllAppsAddedMessage })}>
                <Text size={Size.Medium} color={TextColor.Secondary}>
                  {`All apps in this organization are in ${team ? team.displayName : ""}`}
                </Text>
              </div>
              <Autocomplete
                data-test-id="add-app-autocomplete"
                className={classNames(styles["add-apps"], styles.hidden, { [styles.visible]: canAddApps })}
                value={this.state.inputValue!}
                items={availableApps}
                onSelectItem={this.onAppSelect}
                searchOptions={{
                  keys: ["display_name", "name"],
                  findAllMatches: true,
                  threshold: 0.4,
                  distance: 100,
                  maxPatternLength: 32,
                  minMatchCharLength: 1,
                }}
                renderItem={(app: IApp, index: number) => {
                  return (
                    <Action text={app.name!} className={styles.item} key={index}>
                      <IconItem icon={<AppIcon app={app} size={30} />} title={app.display_name!} description={app.os} inline />
                      <Text size={Size.Medium}>{app.humanReadablePlatform}</Text>
                    </Action>
                  );
                }}
                openOnFocus
              >
                <AutocompleteComboboxWrapper>
                  <Input
                    aria-label="Add apps"
                    data-test-id="org-team-add-app-input"
                    variant={InputVariant.Card}
                    icon={IconName.Add}
                    placeholder="Add apps"
                    onChange={this.handleInputChange}
                    value={this.state.inputValue}
                    showClearButton={this.state.inputValue!.length > 0}
                    onClear={this.resetSearchText}
                  />
                </AutocompleteComboboxWrapper>
              </Autocomplete>
              <Table
                data-test-id="apps-table"
                title="Apps"
                className={classNames({ [styles.hidden]: noAppsAddedToTeam || hasNoAppsToAddToTeam })}
                columns={this.columns}
                eventualRowCount={apps.length || 4}
                data={apps}
                rowHeight={RowHeight.MultiLine}
                headerCheckboxAriaLabel={"Apps"}
                selectable={allowedToManageTeam}
                selectedRows={this.state.selectedApps}
                onSelectAll={this.selectAllApps(apps)}
                onDeselectAll={this.deselectAllApps}
                selectedItemsString={(count) => `${count} ${count > 1 ? pluralize("app") : "app"} selected`}
                renderSelectionToolbar={(selectedRows: Set<App>) => {
                  const selectedApps = Array.from(selectedRows);
                  return (
                    <ButtonContainer>
                      <MemberRoleSelect
                        role={undefined as any}
                        onChange={this.updateAppsRole(selectedApps)}
                        showDescriptions
                        size={ButtonSize.Small}
                        placeholder={t("management:common.roleSelectPlaceholder")}
                      />
                      <PrimaryButton size={ButtonSize.Small} color={Color.Red} onClick={this.deleteApps(selectedApps)}>
                        Remove
                      </PrimaryButton>
                    </ButtonContainer>
                  );
                }}
                renderRow={(app: App, props) => {
                  const { selectedApps } = this.state;
                  const isSelected = selectedApps!.has(app);
                  return (
                    <Row
                      {...props}
                      className={styles["app-row"]}
                      label={app.display_name}
                      onDeselect={this.deselectApp(app)}
                      onSelect={this.selectApp(app)}
                    >
                      <SummaryCell title={app.display_name} icon={<AppIcon app={app} size={30} />} />
                      <TextCell>{app.os}</TextCell>
                      <TextCell>{app.humanReadablePlatform}</TextCell>
                      {allowedToManageTeam ? (
                        <Cell.Observer>
                          {() => (
                            <MemberRoleSelect
                              role={app.getTeamRole(organizationName, teamName)!}
                              onChange={this.updateAppsRole([app])}
                              disabled={isSelected}
                              showDescriptions
                            />
                          )}
                        </Cell.Observer>
                      ) : (
                        <TextCell>{app.getHumanReadableTeamRole(organizationName, teamName)}</TextCell>
                      )}
                      <Cell hideUntilRowHover>
                        {allowedToManageTeam ? (
                          <ClickableIcon
                            data-test-class="org-team-delete-app"
                            key={app.id}
                            icon={IconName.Delete}
                            size={ButtonSize.XSmall}
                            onClick={this.deleteApps([app])}
                          />
                        ) : null}
                      </Cell>
                    </Row>
                  );
                }}
                renderPlaceholderRow={(props) => {
                  return (
                    <Row {...props}>
                      <SummaryCell skeleton title="title" subtitle="subtitle" icon={IconName.Default} />
                      <Cell skeleton />
                      <Cell skeleton />
                      <Cell skeleton />
                    </Row>
                  );
                }}
                error={
                  teamAppsUiStore?.fetchFailed ? (
                    <div className={styles["table-error"]}>
                      <img alt="" role="presentation" src={errorImg} />
                      <div>We’re having trouble finding your apps.</div>
                    </div>
                  ) : null
                }
              />
              <div
                className={classNames(styles["no-apps"], styles.hidden, {
                  [styles.visible]: noAppsAddedToTeam || hasNoAppsToAddToTeam,
                })}
              >
                <Text size={Size.Large} color={TextColor.Secondary}>
                  {hasNoAppsToAddToTeam && allowedToManageTeam
                    ? `You are not a manager of any apps in ${organization?.display_name}. Create one to add to this ${teamType}.`
                    : `This ${teamType} is not collaborating on any apps yet.`}
                </Text>
              </div>
            </div>
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

        private onAppSelect = (app: App) => {
          this.setState({ inputValue: "" });
          const { organizationName, teamName, teamAppsUiStore } = this.props;
          teamAppsUiStore!.addApp(app, organizationName, teamName);
        };

        private deleteApps = (apps: App[]) => (event: React.MouseEvent<HTMLButtonElement>): void => {
          const { teamAppsUiStore, organizationName, teamName } = this.props;
          teamAppsUiStore!.deleteApps(apps, organizationName, teamName);
          this.deselectAllApps();
        };

        private updateAppsRole = (apps: App[]) => (role: CollaboratorRole): void => {
          const { teamAppsUiStore, organizationName, teamName } = this.props;
          teamAppsUiStore!.updateAppsRole(apps, role, organizationName, teamName);
          this.deselectAllApps();
        };

        private selectAllApps = (apps: App[]) => (): void => {
          this.setState({ selectedApps: new Set(apps) });
        };

        private deselectAllApps = (): void => {
          this.setState({ selectedApps: new Set([]) });
        };

        private selectApp = (app: App) => (): void => {
          const { selectedApps } = this.state;
          selectedApps!.add(app);
          this.setState({ selectedApps: selectedApps });
        };

        private deselectApp = (app: App) => (): void => {
          const { selectedApps } = this.state;
          selectedApps!.delete(app);
          this.setState({ selectedApps: selectedApps });
        };
      }
    )
  )
);
