import * as React from "react";
import { withTranslation, WithTranslation } from "react-i18next";
import { observer } from "mobx-react";
import {
  Card,
  Grid,
  GridProps,
  GridSpacing,
  createListSplitter,
  HeaderArea,
  getStorageManager,
  EmptyState,
  GridRow,
  GridCol,
  Text,
  Size,
  TextColor,
  Paragraph,
  Icon,
  Color,
  IconName,
  IconSize,
  DesktopOnly,
} from "@root/shared";
import { AppListTopBarControls, RoleItem } from "../../shared/app-list-top-bar-controls/app-list-top-bar-controls";
import { IApp } from "@lib/common-interfaces";
import { AppCard } from "./app-card/app-card";
import { AppFilterQueryParams, AppListType, releaseTypeColumnWidth, roleColumnWidth } from "../../constants/constants";
import { QRCodeDialog } from "@root/shared/qr-code/qr-code-dialog";
import { qrCodeDialogUIStore } from "@root/shared/qr-code/qr-code-dialog-ui-store";
import { appStore, layoutStore } from "@root/stores";
import { SearchController } from "@root/shared/search-controller/search-controller";
import { VisibilityToggler, VisibilityTogglerInjectedProps } from "@root/shared/visibility-toggler/visibility-toggler";
import { t } from "@root/lib/i18n";
import { SearchModal } from "@root/shared/modals/variants";
import { sortBy } from "lodash";

const styles = require("./app-list.scss");
const noAppsImg = require("../images/no-filtered-apps.svg");
const ListSplitter = createListSplitter<IApp, GridProps>();
const gridProps: GridProps = { rowSpacing: GridSpacing.Medium, bordered: true, padded: true };
const PAGE_SIZE = 100;

interface AppListState {
  listType: AppListType;
}

export interface AppListProps {
  apps: IApp[];
  release_types?: string[];
  query?: any;
  hideOwner?: boolean;
  newAppUrl?: string;
}

class AppSearchModal extends React.PureComponent<
  Pick<VisibilityTogglerInjectedProps, "visible" | "hide"> & Pick<AppListProps, "apps" | "query" | "release_types">
> {
  render() {
    const { apps, hide, visible, release_types } = this.props;
    const { showQRCodeDialog } = qrCodeDialogUIStore;
    const showReleaseType = release_types && release_types.length > 0;
    return (
      <SearchController items={apps} searchKeys={["display_name"]}>
        {({ inputProps, searching, results }) => (
          <SearchModal
            {...inputProps}
            onRequestClose={hide}
            visible={visible}
            resultsCount={results.length}
            searching={searching}
            title="Search apps"
          >
            {results.map((app) => (
              <AppCard
                showReleaseType={showReleaseType}
                className={styles.row}
                key={app.id}
                app={app}
                hideOwner
                type={AppListType.List}
                showDialog={showQRCodeDialog}
              />
            ))}
          </SearchModal>
        )}
      </SearchController>
    );
  }
}

export const AppList = withTranslation("management")(
  observer(
    class AppList extends React.Component<AppListProps & WithTranslation, Partial<AppListState>> {
      constructor(props: any) {
        super(props);
        const storageManager = getStorageManager();
        const listType = storageManager.getObject("appListType") || AppListType.List;
        this.state = {
          listType,
        };
      }

      public render() {
        const { listType } = this.state;
        const { apps, hideOwner, query, release_types } = this.props;
        const { showQRCodeDialog } = qrCodeDialogUIStore;
        const showReleaseType = release_types && release_types.length > 0;
        return (
          <>
            <VisibilityToggler>
              {({ visible, hide, show }) => (
                <>
                  <SearchController items={apps} searchKeys={["display_name"]}>
                    {({ inputProps, results }) => {
                      const sortedResults = sortBy(results, [(app) => app.display_name.toLowerCase(), (app) => app.os.toLowerCase()]);
                      const showListHeader = !layoutStore.isMobile && listType === AppListType.List && sortedResults.length > 0;
                      const showLegends = !layoutStore.isMobile && listType === AppListType.Grid && sortedResults.length > 0;
                      return (
                        <Card
                          dividedHeader={!showListHeader}
                          withoutPadding={!!sortedResults.length && listType === AppListType.List}
                          header={this.renderHeaderArea({
                            searchValue: inputProps.value,
                            onSearch: inputProps.onChange,
                            resultsCount: sortedResults.length,
                            onClickMobileSearch: show,
                          })}
                        >
                          {showLegends ? (
                            <DesktopOnly>
                              {() => (
                                <div className={styles["card-legends"]} aria-hidden="true">
                                  <Icon icon={IconName.TestTube} size={IconSize.XSmall} color={Color.LightGray} />
                                  <Paragraph size={Size.Medium} color={TextColor.Secondary}>
                                    {t("management:apps.testerApp")}
                                  </Paragraph>
                                </div>
                              )}
                            </DesktopOnly>
                          ) : null}
                          <div role={listType === AppListType.List ? "table" : ""}>
                            {listType === AppListType.List ? (
                              <>
                                {showListHeader && sortedResults.length > 0 ? this.renderListHeader() : null}
                                <ListSplitter
                                  list={sortedResults}
                                  groupSize={PAGE_SIZE}
                                  groupProps={gridProps}
                                  groupComponent={Grid}
                                  data-test-id="app-list"
                                >
                                  {(app) => (
                                    <AppCard
                                      showReleaseType={showReleaseType}
                                      className={styles.row}
                                      key={app.id}
                                      app={app}
                                      hideOwner={hideOwner}
                                      type={listType}
                                      showDialog={showQRCodeDialog}
                                    />
                                  )}
                                </ListSplitter>
                              </>
                            ) : (
                              <div className={styles["card-grid"]} data-test-id="app-grid">
                                {sortedResults.map((app) => (
                                  <AppCard
                                    showReleaseType={showReleaseType}
                                    className={styles.card}
                                    key={app.id}
                                    app={app}
                                    hideOwner={hideOwner}
                                    type={listType}
                                    showDialog={showQRCodeDialog}
                                  />
                                ))}
                              </div>
                            )}
                            {sortedResults.length === 0 ? (
                              <EmptyState
                                className={styles["empty-state"]}
                                hideButton
                                imgSrc={noAppsImg}
                                title={t("management:apps.noFilteredAppsMessage")}
                                subtitle=""
                              />
                            ) : null}
                          </div>
                        </Card>
                      );
                    }}
                  </SearchController>
                  <AppSearchModal apps={apps} hide={hide} visible={visible} query={query} />
                </>
              )}
            </VisibilityToggler>
            <QRCodeDialog
              app={qrCodeDialogUIStore.app}
              visible={qrCodeDialogUIStore.qrCodeDialogVisible}
              onClose={qrCodeDialogUIStore.closeQRDialog}
            />
          </>
        );
      }

      private renderListHeader() {
        const { hideOwner, release_types } = this.props;
        const showReleaseType = release_types && release_types.length > 0;
        const columnWidth = showReleaseType ? releaseTypeColumnWidth : roleColumnWidth;

        return (
          <Grid padded className={styles.listHeader} rowSpacing={GridSpacing.Large}>
            <GridRow role="row">
              <GridCol role="columnheader" width={hideOwner ? columnWidth.nameColumnHideOwner : columnWidth.nameColumn}>
                <Text bold color={TextColor.Secondary} size={Size.Small}>
                  {t("management:apps.headers.name")}
                </Text>
              </GridCol>
              <GridCol role="columnheader" width={columnWidth.platformColumn}>
                <Text bold color={TextColor.Secondary} size={Size.Small}>
                  {t("management:apps.headers.os")}
                </Text>
              </GridCol>
              {showReleaseType ? (
                <GridCol role="columnheader" width={2}>
                  <Text bold color={TextColor.Secondary} size={Size.Small}>
                    {t("management:apps.headers.release_type")}
                  </Text>
                </GridCol>
              ) : null}
              <GridCol role="columnheader" width={2}>
                <Text bold color={TextColor.Secondary} size={Size.Small}>
                  {t("management:apps.headers.role")}
                </Text>
              </GridCol>
              {!hideOwner ? (
                <GridCol role="columnheader" width={3}>
                  <Text bold color={TextColor.Secondary} size={Size.Small}>
                    {t("management:apps.headers.owner")}
                  </Text>
                </GridCol>
              ) : null}
            </GridRow>
          </Grid>
        );
      }

      private renderHeaderArea(props: {
        resultsCount: number;
        onSearch: React.ChangeEventHandler<HTMLInputElement>;
        searchValue: string;
        onClickMobileSearch: React.MouseEventHandler<HTMLElement>;
      }) {
        const { t, query, newAppUrl, hideOwner, release_types: environments } = this.props;
        const osFilter = query[AppFilterQueryParams.OS];
        const roleFilter = query[AppFilterQueryParams.Role];
        const releaseTypeFilter = query[AppFilterQueryParams.ReleaseType];
        const localizedAllRoles = appStore.uniqueFilterRoles.map((role) => {
          const roleLabel = role === "collaborator" ? t("common:access.collaborator") : t("common:access.tester");
          return {
            value: role,
            label: roleLabel,
          } as RoleItem;
        });
        return (
          <HeaderArea smallSubtitle multiline title={hideOwner ? t("management:apps.orgTitle") : t("management:apps.title")}>
            {appStore.hasApps ? (
              <AppListTopBarControls
                selectedOS={osFilter}
                allOs={appStore.uniqueOSs}
                allReleaseTypes={environments || []}
                selectedRole={roleFilter}
                selectedReleaseType={releaseTypeFilter}
                allRoles={localizedAllRoles}
                listType={this.state.listType}
                onListTypeChange={(listType) => this.setState({ listType })}
                newAppUrl={newAppUrl}
                {...props}
              />
            ) : null}
          </HeaderArea>
        );
      }
    }
  )
);
