import * as React from "react";
import { observer } from "mobx-react";
import { omit } from "lodash";
import {
  Option,
  IconName,
  ButtonSize,
  IconToggleButtons,
  Trigger,
  DropdownButton,
  Select,
  ButtonContainer,
  DesktopOnly,
  PrimaryButton,
  getStorageManager,
  BorderlessSearchBar,
  MobileOnly,
  ClickableIcon,
} from "@root/shared";
import { locationStore } from "@root/stores/location-store";
import { AppFilterQueryParams, AppListType } from "../../constants/constants";
import { withTranslation, WithTranslation } from "react-i18next";
import { layoutStore } from "@root/stores/layout-store";

const styles = require("./app-list-top-bar-controls.scss");

export interface RoleItem {
  value: string;
  label: string;
}

export interface AppListTopBarControlsProps {
  allOs: string[];
  selectedOS: string;
  allRoles: RoleItem[];
  allReleaseTypes: string[];
  selectedRole: string;
  selectedReleaseType: string;
  onOSFilterChange?: (value: string) => void;
  listType?: AppListType;
  onListTypeChange?: (type: AppListType) => void;
  newAppUrl?: string;
  resultsCount: number;
  searchValue: string;
  onSearch: React.ChangeEventHandler<HTMLInputElement>;
  onClickMobileSearch: React.MouseEventHandler<HTMLElement>;
}

const AddAppButton = withTranslation("management")(({ t, to }: WithTranslation & { to?: string }) => {
  return !layoutStore.isMobile ? (
    <PrimaryButton size={ButtonSize.Small} data-test-id="org-apps-add-new-button" to={to}>
      {t("management:app.addNew")}
    </PrimaryButton>
  ) : (
    <PrimaryButton aria-label={t("management:common.addNew")} size={ButtonSize.Small} icon={IconName.Add} to={to} />
  );
});

export const AppListTopBarControls = withTranslation("management")(
  observer(
    class AppListTopBarControls extends React.Component<AppListTopBarControlsProps & WithTranslation, {}> {
      public render() {
        const {
          selectedOS,
          allOs,
          allReleaseTypes,
          selectedRole,
          selectedReleaseType,
          allRoles,
          t,
          listType,
          newAppUrl,
          resultsCount,
          searchValue,
          onSearch,
          onClickMobileSearch,
        } = this.props;

        return (
          <ButtonContainer>
            <DesktopOnly>
              {() => <BorderlessSearchBar resultsCount={resultsCount} value={searchValue} onChange={onSearch} autoFocus />}
            </DesktopOnly>
            <MobileOnly>
              {() => <ClickableIcon size={ButtonSize.Small} icon={IconName.Search} onClick={onClickMobileSearch} />}
            </MobileOnly>
            <DesktopOnly>
              {() => (
                <IconToggleButtons
                  icons={[IconName.ViewList, IconName.ViewGrid]}
                  ariaLabels={[t("management:common.appListView.listButton"), t("management:common.appListView.gridButton")]}
                  tooltips
                  selectedIndex={Number(listType === AppListType.Grid)}
                  onPress={this.handleListTypeClick}
                  data-test-id="app-list-type-toggle-buttons"
                />
              )}
            </DesktopOnly>
            <Select
              placeholder={t("management:common.allOS")}
              onChange={this.handleOSChange}
              value={selectedOS}
              data-test-id="app-list-os-filter-select"
              aria-labelledby={`button-label-${t("management:common.os")}`}
            >
              <Trigger>
                <DropdownButton size={ButtonSize.Small} subtle label={t("management:common.os")} labelHidden={true}>
                  {selectedOS || t("management:common.allOS")}
                </DropdownButton>
              </Trigger>
              <Option
                key="all"
                value={t("management:common.allOS")}
                text={t("management:common.allOS")}
                data-test-id="select-os-menu-item-all"
              />
              {allOs.map((os) => (
                <Option key={os} value={os} text={os} data-test-id={"select-os-menu-item-" + os} />
              ))}
            </Select>
            {allReleaseTypes.length > 0 ? (
              <DesktopOnly>
                {() => (
                  <Select
                    placeholder={t("management:common.allReleaseTypes")}
                    onChange={this.handleReleaseTypeChange}
                    value={selectedReleaseType}
                    data-test-id="app-list-environment-filter-select"
                    minListWidth={170}
                    aria-labelledby={`button-label-${t("management:common.appReleaseType")}`}
                  >
                    <Trigger>
                      <DropdownButton
                        className={styles.releaseTypeDropdown}
                        size={ButtonSize.Small}
                        subtle
                        label={t("management:common.appReleaseType")}
                        labelHidden={true}
                      >
                        {allReleaseTypes.find((env) => env === selectedReleaseType) || "" || t("management:common.allReleaseTypes")}
                      </DropdownButton>
                    </Trigger>
                    <Option
                      key="all"
                      value={t("management:common.allReleaseTypes")}
                      text={t("management:common.allReleaseTypes")}
                      data-test-id="select-environment-menu-item-all"
                    />
                    {allReleaseTypes.map((environment) => (
                      <Option
                        key={environment}
                        value={environment}
                        text={environment}
                        data-test-id={"select-environment-menu-item-" + environment}
                      />
                    ))}
                  </Select>
                )}
              </DesktopOnly>
            ) : null}
            <DesktopOnly>
              {() => (
                <Select
                  placeholder={t("common:access.allRoles")}
                  onChange={this.handleRoleChange}
                  value={selectedRole}
                  data-test-id="app-list-role-filter-select"
                  minListWidth={170}
                  aria-labelledby={`button-label-${t("common:access.role")}`}
                >
                  <Trigger>
                    <DropdownButton size={ButtonSize.Small} subtle label={t("common:access.role")} labelHidden={true}>
                      {(allRoles.find((r) => r.value === selectedRole) || { label: "" }).label || t("common:access.allRoles")}
                    </DropdownButton>
                  </Trigger>
                  <Option
                    key="all"
                    value={t("common:access.allRoles")}
                    text={t("common:access.allRoles")}
                    data-test-id="select-role-menu-item-all"
                  />
                  {allRoles.map((role) => (
                    <Option
                      key={role.value}
                      value={role.value}
                      text={role.label}
                      data-test-id={"select-role-menu-item-" + role.value}
                    />
                  ))}
                </Select>
              )}
            </DesktopOnly>
            {newAppUrl && <AddAppButton to={newAppUrl} />}
          </ButtonContainer>
        );
      }

      private handleOSChange = (value: string) => {
        const basePath = locationStore.pathname;
        getStorageManager().saveObject("appListOS", value);
        const query = value
          ? Object.assign({}, locationStore.query, { [AppFilterQueryParams.OS]: value })
          : omit(locationStore.query, AppFilterQueryParams.OS);
        if (this.props.onOSFilterChange) {
          this.props.onOSFilterChange(value);
        }
        locationStore.router.push(locationStore.getResolvedUrl(basePath, query as any));
      };

      private handleRoleChange = (value: string) => {
        const basePath = locationStore.pathname;
        getStorageManager().saveObject("appListRole", value);
        const query = value
          ? Object.assign({}, locationStore.query, { [AppFilterQueryParams.Role]: value })
          : omit(locationStore.query, AppFilterQueryParams.Role);
        locationStore.router.push(locationStore.getResolvedUrl(basePath, query as any));
      };

      private handleReleaseTypeChange = (value: string) => {
        const basePath = locationStore.pathname;
        const query = value
          ? Object.assign({}, locationStore.query, { [AppFilterQueryParams.ReleaseType]: value })
          : omit(locationStore.query, AppFilterQueryParams.ReleaseType);
        getStorageManager().saveObject("appListReleaseType", value);
        locationStore.router.push(locationStore.getResolvedUrl(basePath, query as any));
      };

      private handleListTypeClick = (type: AppListType) => {
        getStorageManager().saveObject("appListType", type);
        if (this.props.onListTypeChange) {
          this.props.onListTypeChange(type);
        }
      };
    }
  )
);
