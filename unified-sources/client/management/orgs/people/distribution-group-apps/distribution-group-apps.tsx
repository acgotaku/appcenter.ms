import * as React from "react";
import {
  Table,
  IconName,
  Color,
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
  TextCell,
  createAutocomplete,
  ConfirmationDialog,
  SecondaryButton,
  Action,
  IconItem,
  Size,
  Text,
  Input,
  InputVariant,
  MessageBar,
  NotificationType,
  ProgressBarStatus,
  TextColor,
  LiveRegion,
  Stretch,
} from "@root/shared";
import { IApp } from "@lib/common-interfaces";
import { DistributionGroupsUIStore } from "@root/management/orgs/people/distribution-groups/distribution-groups-ui-store";
import { isEmpty } from "lodash";
import { action, observable } from "mobx";
import { withTranslation, WithTranslation } from "react-i18next";
import { observer } from "mobx-react";
import * as classNames from "classnames";
import { ProgressBar } from "@root/shared/drag-drop-upload/progress-bar";
import { AutocompleteComboboxWrapper } from "@root/shared/autocomplete/autocomplete";
const Autocomplete = createAutocomplete<IApp>();

const styles = require("./distribution-group-apps.scss");

export interface DistributionGroupAppsProps {
  orgName: string;
  groupName: string;
}

interface DistributionGroupAppsState {
  selectedApps: Set<IApp>;
  selectedSingleApp: IApp;
  inputValue: string;
  isAddingApps: boolean;
  isDeletingApps: boolean;
  isShowingDeleteConfirmationDialog: boolean;
  addAppErrorMessage: string;
}

const DUMMY_APP_ID = "92E073A1-AD8B-48D0-8C26-F205E4133D8E";

class DistributionGroupAppsInner extends React.Component<DistributionGroupAppsProps & WithTranslation, DistributionGroupAppsState> {
  private distributionGroupsUiStore = new DistributionGroupsUIStore(this.props.orgName);
  private didRefreshAllApps = false;

  constructor(props) {
    super(props);
    this.state = {
      selectedApps: new Set([]),
      selectedSingleApp: null as any,
      inputValue: "",
      isAddingApps: false,
      isDeletingApps: false,
      isShowingDeleteConfirmationDialog: false,
      addAppErrorMessage: null as any,
    };
  }

  public UNSAFE_componentWillReceiveProps(nextProps) {
    if (!this.didRefreshAllApps || this.props.groupName !== nextProps.groupName) {
      // when switching between groups in the groups-list page - we need to reset the state (specifically - the selected apps)
      this.distributionGroupsUiStore.refreshAllApps(nextProps.groupName);
      this.didRefreshAllApps = true;

      this.setState({
        selectedApps: new Set([]),
        selectedSingleApp: null as any,
        inputValue: "",
        isAddingApps: false,
        isDeletingApps: false,
        isShowingDeleteConfirmationDialog: false,
        addAppErrorMessage: null as any,
      });
    }
  }

  private columns: Column[] = [
    {
      title: "Name",
      width: 0.5,
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
      title: "",
      width: 0.1,
    },
  ];

  public render() {
    const { t, groupName } = this.props;
    const distributionGroup = this.distributionGroupsUiStore.getDistributionGroup(groupName);
    if (distributionGroup && distributionGroup.hasMoreApps) {
      // HACK:
      // We use the same store for both the master page (groups list) and the details page (group page) which shows a list of apps.
      // The groups list calls an API which returns the list of ALL groups each with AT MOST 10 apps (to reduce latency),
      //  however, the details page needs to show ALL apps for the selected group.
      // As we share a single store for both views and as the apps list is a property under a group and as we make two different API calls
      //  which eventually set the value of that `.app` property, one with at most 10 and one with all -
      //  it is possible that one response will overwrite the other's value.
      //  when this happens - distributionGroup.hasMoreApps is true and we must refresh the entire list of apps for this group.
      //
      // NOTE:
      // This can ONLY happen when a user navigates directly into the details page.
      // For any other navigation story the order is guaranteed to be correct.
      this.distributionGroupsUiStore.refreshAllApps(groupName);
      this.didRefreshAllApps = true;
    }
    const apps = observable.array(distributionGroup ? distributionGroup.apps : []);
    const noAppsToDisplay = isEmpty(apps);
    const isFetching = this.distributionGroupsUiStore.isFetching;
    const confirmationDialogAppText = this.buildConfirmationMessage();
    const confirmationDialogAppTitle = this.buildConfirmationTitle();
    const availableApps = this.distributionGroupsUiStore.appsThatCanBeManaged(apps);
    const noAppsAvailable = isEmpty(availableApps);
    const availableAppsCount = availableApps.length;
    if (!noAppsAvailable) {
      /** adding a dummy item to render the add all apps button.  */
      availableApps.unshift({ id: DUMMY_APP_ID } as IApp);
    }

    return (
      <>
        <MessageBar container="Well" type={NotificationType.Info} visible={noAppsAvailable} className={styles["no-apps-to-add"]}>
          {this.messageBarText(noAppsAvailable && noAppsToDisplay)}
        </MessageBar>
        {noAppsAvailable ? null : (
          <Autocomplete
            value={this.state.inputValue}
            items={availableApps}
            onSelectItem={(app) => {
              this.onAppSelect(app, availableApps);
            }}
            searchOptions={{
              keys: ["display_name", "name"],
              findAllMatches: true,
              threshold: 0.4,
              distance: 100,
              maxPatternLength: 32,
              minMatchCharLength: 1,
            }}
            renderItem={(app: IApp, index: number) => {
              if (app.id === DUMMY_APP_ID) {
                return (
                  <Action text="" className={styles.addAllApps} key={index}>
                    <Text size={Size.Medium}>{t("management:orgDistributionGroup.apps.addAllItemsText")}</Text>
                    <Text size={Size.Medium} color={TextColor.Secondary}>
                      {t("management:orgDistributionGroup.apps.addAllItemsTextSeconary", { count: availableAppsCount })}
                    </Text>
                  </Action>
                );
              }

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
                variant={InputVariant.Card}
                icon={IconName.Add}
                placeholder={t("management:orgDistributionGroup.apps.addApps")}
                onChange={this.handleInputChange}
                value={this.state.inputValue}
                showClearButton={this.state.inputValue.length > 0}
                onClear={this.resetSearchText}
                onClick={this.clearErrorMessage}
              />
            </AutocompleteComboboxWrapper>
          </Autocomplete>
        )}
        <LiveRegion role="alert" active={Boolean(this.state.addAppErrorMessage)}>
          <div data-test-id="add-app-to-distribution-group-error-message" className={styles.errorMessage}>
            {this.state.addAppErrorMessage}
          </div>
        </LiveRegion>
        <ProgressBar
          progress={100}
          className={classNames(styles["progress-bar"], { [styles.hidden]: !this.state.isAddingApps })}
          status={ProgressBarStatus.Indeterminate}
        />
        <Table.Observer
          data-test-id="apps-table"
          title={t("management:orgDistributionGroup.apps.tableTitle")}
          className={classNames(styles["appsTable"], { [styles.hidden]: noAppsToDisplay && !isFetching })}
          columns={this.columns}
          eventualRowCount={apps.length || 4}
          data={apps}
          rowHeight={RowHeight.MultiLine}
          headerCheckboxAriaLabel={"Apps"}
          selectable={true}
          selectedRows={this.state.selectedApps}
          onSelectAll={() => this.selectAllApps(apps)}
          onDeselectAll={() => this.deselectAllApps()}
          selectedItemsString={(count: number) => t("management:orgDistributionGroup.apps.selectedItemsString", { count: count })}
          renderSelectionToolbar={() => {
            return (
              <ButtonContainer>
                <PrimaryButton size={ButtonSize.Small} color={Color.Red} onClick={() => this.launchDeleteAppDialog(null as any)}>
                  Remove
                </PrimaryButton>
              </ButtonContainer>
            );
          }}
          renderRow={(app: IApp, props) => {
            return (
              <Row
                {...props}
                className={styles["app-row"]}
                label={app.display_name}
                onDeselect={() => this.deselectApp(app)}
                onSelect={() => this.selectApp(app)}
              >
                <SummaryCell
                  title={
                    <Stretch>
                      <Text size={Size.Medium}>{app.display_name}</Text>
                    </Stretch>
                  }
                  icon={<AppIcon app={app} size={30} />}
                />
                <TextCell data-test-class="os-cell">{app.os}</TextCell>
                <TextCell data-test-class="platform-cell">{app.humanReadablePlatform || app.platform}</TextCell>
                <Cell hideUntilRowHover>
                  <ClickableIcon
                    data-test-class="distribution-group-delete-app"
                    key={app.id}
                    icon={IconName.Delete}
                    onClick={() => this.launchDeleteAppDialog(app)}
                  />
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
              </Row>
            );
          }}
        />

        <ConfirmationDialog
          data-test-id="delete-app-confirmation-dialog"
          className={styles["app-delete-dialog"]}
          visible={this.state.isShowingDeleteConfirmationDialog}
          onRequestClose={this.cancelDeletingApp}
          title={confirmationDialogAppTitle}
          description={t("management:orgDistributionGroup.apps.deleteDialog.message", {
            group: groupName,
            appText: confirmationDialogAppText,
          })}
          confirmButton={
            <PrimaryButton color={Color.Red} progress={this.state.isDeletingApps} data-test-id="confirm-button">
              {t("button.remove")}
            </PrimaryButton>
          }
          onConfirm={this.deleteSelectedApps}
          cancelButton={
            <SecondaryButton disabled={this.state.isDeletingApps} data-test-id="cancel-button">
              {t("button.cancel")}
            </SecondaryButton>
          }
          onCancel={this.cancelDeletingApp}
        />
      </>
    );
  }

  /**
   * Message to show in the Message Bar
   * @param noAppsInOrg Org has no apps or current user has NO permissions on all the apps in the org.
   */
  private messageBarText = (noAppsInOrg: boolean): string => {
    const { t } = this.props;
    if (noAppsInOrg) {
      return t("management:orgDistributionGroup.apps.noAppsInOrgMessage");
    } else {
      return t("management:orgDistributionGroup.apps.noAppsToAddMessage");
    }
  };

  private buildConfirmationMessage = (): string => {
    const { t } = this.props;
    if (this.state.selectedSingleApp) {
      return t("management:orgDistributionGroup.apps.deleteDialog.appTextSingular", {
        appName: this.state.selectedSingleApp.display_name,
      });
    }
    if (this.state.selectedApps.size === 0) {
      return "";
    }

    const appsNames = this.selectedAppNames;
    if (appsNames.length === 1) {
      return t("management:orgDistributionGroup.apps.deleteDialog.appTextSingular", { appName: appsNames[0] });
    }

    return t("management:orgDistributionGroup.apps.deleteDialog.appTextPlural", { number: appsNames.length });
  };

  private buildConfirmationTitle = (): string => {
    const { t } = this.props;
    if (this.state.selectedSingleApp) {
      return t("management:orgDistributionGroup.apps.deleteDialog.titleSingular");
    }
    if (this.state.selectedApps.size === 0) {
      return "";
    }

    if (this.state.selectedApps.size === 1) {
      return t("management:orgDistributionGroup.apps.deleteDialog.titleSingular");
    }

    return t("management:orgDistributionGroup.apps.deleteDialog.titlePlural");
  };

  private get selectedAppNames(): string[] {
    const appNames: any[] = [];
    this.state.selectedApps.forEach((app) => {
      appNames.push(app.name);
    });
    return appNames;
  }

  private deleteSelectedApps = () => {
    const selectedApps = Array.from(this.state.selectedSingleApp ? [this.state.selectedSingleApp] : this.state.selectedApps);
    return this.deleteApps(selectedApps);
  };

  private deleteApps = async (apps: IApp[]) => {
    this.setState({ isDeletingApps: true });

    const { groupName } = this.props;
    await this.distributionGroupsUiStore.deleteApps(groupName, apps);

    this.deselectAllApps();

    return this.setState({
      isDeletingApps: false,
      isShowingDeleteConfirmationDialog: false,
    });
  };

  private selectAllApps = (apps: IApp[]): void => {
    this.setState({ selectedApps: new Set(apps) });
  };

  private deselectAllApps = (): void => {
    this.setState({
      selectedSingleApp: null as any,
      selectedApps: new Set([]),
    });
  };

  private selectApp = (app: IApp) => {
    const { selectedApps } = this.state;
    selectedApps.add(app);
    this.setState({ selectedApps: selectedApps });
  };

  private deselectApp = (app: IApp): void => {
    const { selectedApps } = this.state;
    selectedApps.delete(app);
    this.setState({ selectedApps: selectedApps });
  };

  @action
  private onAppSelect = async (app: IApp, availableApps: IApp[]) => {
    this.setState({ isAddingApps: true });

    this.setState({ inputValue: "" });
    const { groupName } = this.props;
    if (app.id === DUMMY_APP_ID) {
      await this.distributionGroupsUiStore.addApps(groupName, availableApps.slice(1)).catch(this.handleError);
    } else {
      await this.distributionGroupsUiStore.addApps(groupName, [app as IApp]).catch(this.handleError);
    }
    return this.setState({ isAddingApps: false });
  };

  private handleError = (error): void => {
    if (error.code === "Conflict") {
      this.setState({ addAppErrorMessage: this.props.t("management:orgDistributionGroup.apps.conflictError") });
      return;
    }
    if (error.code === "BadRequest") {
      this.setState({ addAppErrorMessage: error.message ?? "Unhandled error" });
      return;
    }
    throw error;
  };

  private handleInputChange = (event): void => {
    this.setState({
      inputValue: event.target.value,
      addAppErrorMessage: null as any,
    });
  };

  private clearErrorMessage = (): void => {
    this.setState({
      addAppErrorMessage: null as any,
    });
  };

  private resetSearchText = (): void => {
    this.setState({
      inputValue: "",
      addAppErrorMessage: null as any,
    });
  };

  @action
  /** pass an app to show dialog for one app, or null, to dialog for multiple apps (shows count) */
  private launchDeleteAppDialog = (app: IApp) => {
    this.setState({
      selectedSingleApp: app,
      isShowingDeleteConfirmationDialog: true,
    });
  };

  @action
  public cancelDeletingApp = (): void => {
    this.setState({
      selectedSingleApp: null as any,
      isShowingDeleteConfirmationDialog: false,
    });
  };
}

export const DistributionGroupApps = withTranslation(["common", "management"])(observer(DistributionGroupAppsInner));
