import * as React from "react";
import { observer } from "mobx-react";
import { RouteComponentProps } from "react-router";
import {
  Panelify,
  PanelInjectedProps,
  PanelOutlet,
  Page,
  PrimaryButton,
  Button,
  Title,
  Space,
  PageHeader,
  getStorageManager,
  Menu,
  Trigger,
  DropdownButton,
  ButtonSize,
  Color,
  Action,
  IconName,
  EmptyState,
  EmptyStateImageSize,
  isMobileBrowser,
} from "@root/shared";
import * as PageTimer from "@root/shared/page-timer";
import { AppList } from "./app-list/app-list";
import {
  AppFilterQueryParams,
  isValidAppOSFilter,
  isValidAppRoleFilter,
  DATE_FOR_USERS_CREATED_AFTER_GA,
  isValidReleaseType,
} from "../constants/constants";
import { withTranslation, WithTranslation } from "react-i18next";
import { Invites } from "./invites/invites";
import { OptInCard } from "./marketing-opt-in/opt-in-card";
import { isAppFilterRole } from "@root/stores/utils/app-utils";
import { locationStore, layoutStore, appStore, userStore, organizationStore } from "@root/stores";
import { safeLocalStorage } from "@root/lib/utils/safe-local-storage";
import { isEqual } from "lodash";
import { CategoryName } from "@lib/common-interfaces";
import { FirstPartyUserNotification } from "../shared/notification-users/firstparty-user-notification";

const noAppsImage = require("./images/no-apps.svg");

interface AppsComponentState {
  showOptIn: boolean;
}

function updateQueryFromLocalStorage(query: { [key: string]: any }) {
  // Retrieve “role” from local storage, if it is stored there
  const selectedRole = getStorageManager().getObject("appListRole");
  const selectedOS = getStorageManager().getObject("appListOS");
  const selectedReleaseType = getStorageManager().getObject("appListReleaseType");

  // Remove the “role” URL param from our object
  delete query[AppFilterQueryParams.OS];
  delete query[AppFilterQueryParams.Role];
  delete query[AppFilterQueryParams.ReleaseType];

  // If we retrieved “role” from local storage, add it to our object
  query = {
    ...query,
    ...(selectedRole ? { [AppFilterQueryParams.Role]: selectedRole } : {}),
    ...(selectedOS ? { [AppFilterQueryParams.OS]: selectedOS } : {}),
    ...(selectedReleaseType ? { [AppFilterQueryParams.ReleaseType]: selectedReleaseType } : {}),
  };

  // Update the current URL’s params using values from our object
  return query;
}

function removeUTMParamsFromQuery(query: { [key: string]: any }) {
  return Object.entries(query)
    .filter(([key, _]) => !/^utm_/i.test(key))
    .reduce((query, [key, value]) => ({ ...query, [key]: value }), {});
}

export const AppsComponent = Panelify(
  withTranslation(["management"])(
    observer(
      class AppsComponent extends React.Component<
        RouteComponentProps<any, any> & PanelInjectedProps & WithTranslation,
        Partial<AppsComponentState>
      > {
        private _userStore = userStore;
        private _hideBannerStorageKey: string = "hideHaOnboardBanner";

        constructor(props: any) {
          super(props);

          // Need to ONLY show to "new" users who sign up after GA
          const showOptIn =
            new Date(this._userStore.currentUser.created_at || "").getTime() > new Date(DATE_FOR_USERS_CREATED_AFTER_GA).getTime();

          this.state = {
            showOptIn,
          };
        }

        public componentDidMount() {
          const query = removeUTMParamsFromQuery(updateQueryFromLocalStorage({ ...locationStore.query })); // should run after `PageTimer.Collector`’s call to `trackPage`
          locationStore.router.replace(locationStore.getResolvedUrl(locationStore.pathname, query as any));
        }

        public componentDidUpdate(prevProps) {
          if (!isEqual(this.props.location.query, prevProps.location.query)) {
            const query = updateQueryFromLocalStorage({ ...locationStore.query });
            locationStore.router.replace(locationStore.getResolvedUrl(locationStore.pathname, query as any));
          }
        }

        private showUserNotification(): boolean {
          const { user_category } = userStore.currentUser;
          return (
            user_category?.category_name === CategoryName.FirstParty ||
            organizationStore.firstPartyOrganizations.some((org) => organizationStore.isCurrentUserAnAdmin(org))
          );
        }

        public render() {
          const { t, location } = this.props;
          const { query } = location;
          const osFilter = query[AppFilterQueryParams.OS];
          const roleFilter = query[AppFilterQueryParams.Role];
          const releaseTypeFilter = query[AppFilterQueryParams.ReleaseType];

          const hasOSFilter = typeof osFilter !== "undefined" && isValidAppOSFilter(osFilter);
          const hasRoleFilter = typeof roleFilter !== "undefined" && isValidAppRoleFilter(roleFilter);
          const hasReleaseTypeFilter = typeof releaseTypeFilter !== "undefined" && isValidReleaseType(releaseTypeFilter);
          let filteredApps;

          if (!hasOSFilter && !hasRoleFilter && !hasReleaseTypeFilter) {
            filteredApps = appStore.apps;
          } else {
            filteredApps = appStore.apps.filter((app) => {
              return (
                (!hasOSFilter || app.os === osFilter) && // apply OS filter
                (!hasRoleFilter || isAppFilterRole(app, roleFilter)) && // apply Role filter
                (!hasReleaseTypeFilter || app.release_type === releaseTypeFilter)
              ); // apply Environment filter
            });
          }

          return (
            <>
              {this.showUserNotification() ? <FirstPartyUserNotification /> : null}
              <Page
                data-test-id="apps-page"
                supportsMobile={isMobileBrowser}
                header={
                  <>
                    <PageHeader title={t("management:apps.greeting", { firstName: userStore.currentUserFriendlyName })}>
                      <Menu>
                        <Trigger>
                          {layoutStore.isMobile && isMobileBrowser ? (
                            <PrimaryButton
                              size={ButtonSize.Small}
                              data-test-id="apps-add-new-menu-button"
                              aria-label={t("management:common.addNew")}
                              icon={IconName.Add}
                            />
                          ) : (
                            <DropdownButton
                              aria-label={t("management:common.addNew")}
                              size={ButtonSize.Small}
                              color={Color.Blue}
                              data-test-id="apps-add-new-menu-button"
                            >
                              {t("management:common.addNew")}
                            </DropdownButton>
                          )}
                        </Trigger>
                        <Action
                          text={t("management:app.addNew")}
                          to={locationStore.getResolvedUrl("/apps/create", query)}
                          data-test-id="apps-add-new-app-menu-item"
                        />
                        <Action
                          text={t("management:org.addNew")}
                          to={locationStore.getResolvedUrl("/orgs/create", query)}
                          data-test-id="apps-add-new-org-menu-item"
                        />
                      </Menu>
                    </PageHeader>
                  </>
                }
              >
                <div>
                  <PageTimer.Reporter path={locationStore.pathname} loading={false} />
                  {this.state.showOptIn && safeLocalStorage.getItem(this._hideBannerStorageKey) ? <OptInCard /> : null}
                  <Invites />
                  {appStore.hasApps ? (
                    <AppList query={query} apps={filteredApps} release_types={appStore.release_types} />
                  ) : (
                    <EmptyState
                      title={(titleProps) => {
                        return (
                          <Title {...titleProps} spaceAbove={Space.Small}>
                            {t("management:apps.welcome.message", { display_name: this._userStore.currentUserFriendlyName })}
                          </Title>
                        );
                      }}
                      imgSrc={noAppsImage}
                      imageSize={EmptyStateImageSize.Huge}
                      subtitle={t("management:apps.welcome.subMessage.withOrg")}
                      renderPrimaryButton={(primaryButtonProps) => {
                        return (
                          <PrimaryButton {...primaryButtonProps} to="/apps/create" data-test-id="apps-add-new-app-button">
                            {t("management:app.addNew")}
                          </PrimaryButton>
                        );
                      }}
                      renderSecondaryButton={(secondaryButtonProps) => {
                        return (
                          <Button {...secondaryButtonProps} to="/orgs/create" data-test-id="apps-add-new-org-button">
                            {t("management:org.addNew")}
                          </Button>
                        );
                      }}
                    />
                  )}
                </div>
                <PanelOutlet>{this.props.children}</PanelOutlet>
              </Page>
            </>
          );
        }
      }
    )
  )
);

export { AppsComponent as Apps };
