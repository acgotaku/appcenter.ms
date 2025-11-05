import * as React from "react";
import { RouteComponentProps } from "react-router";
import { observer } from "mobx-react";
import { Panelify, PanelOutlet, Page, EmptyState, BreadcrumbBuilder, getStorageManager } from "@root/shared";
import { AppList } from "../../apps/app-list/app-list";
import { withTranslation, WithTranslation } from "react-i18next";
import { AppFilterQueryParams, isValidAppOSFilter, isValidAppRoleFilter, isValidReleaseType } from "../../constants/constants";
import { isAppFilterRole } from "@root/stores/utils/app-utils";
import { Helmet } from "react-helmet";
import { locationStore, appStore, organizationStore, userStore } from "@root/stores";
import { isEqual } from "lodash";
import { CategoryName } from "@lib/common-interfaces";
import { FirstPartyUserNotification } from "@root/management/shared/notification-users/firstparty-user-notification";
const noAppsImg = require("../images/no-apps.svg");

type AppsProps = RouteComponentProps<any, any> & WithTranslation;

function updateURLFromLocalStorage() {
  // Retrieve “role” from local storage, if it is stored there
  const selectedRole = getStorageManager().getObject("appListRole");
  const selectedOS = getStorageManager().getObject("appListOS");
  const selectedReleaseType = getStorageManager().getObject("appListReleaseType");

  // Store current URL params in a new object
  let query = { ...locationStore.query };

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
  locationStore.router.replace(locationStore.getResolvedUrl(locationStore.pathname, query as any));
}

export const Apps = Panelify(
  withTranslation(["management"])(
    observer(
      class Apps extends React.Component<AppsProps, {}> {
        public componentDidMount() {
          updateURLFromLocalStorage();
        }

        public componentDidUpdate(prevProps) {
          if (!isEqual(this.props.location.query, prevProps.location.query)) {
            updateURLFromLocalStorage();
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
          const orgName = this.props.params["org_name"];
          const userName = this.props.params["username"];
          const osFilter = query[AppFilterQueryParams.OS];
          const roleFilter = query[AppFilterQueryParams.Role];
          const releaseTypeFilter = query[AppFilterQueryParams.ReleaseType];

          if (!orgName && !userName) {
            return null;
          }

          const allApps = orgName ? appStore.appsForOwner("orgs", orgName) : appStore.nonDogfoodingAppsOwnedByUser;
          const noApps = allApps.length === 0;
          const hasOSFilter = typeof osFilter !== "undefined" && isValidAppOSFilter(osFilter);
          const hasRoleFilter = typeof roleFilter !== "undefined" && isValidAppRoleFilter(roleFilter);
          const hasReleaseTypesFilter = typeof releaseTypeFilter !== "undefined" && isValidReleaseType(releaseTypeFilter);

          const filteredApps =
            !hasOSFilter && !hasRoleFilter && !hasReleaseTypesFilter
              ? allApps
              : allApps.filter((app) => {
                  return (
                    (!hasOSFilter || app.os === osFilter) && // apply OS filter
                    (!hasRoleFilter || isAppFilterRole(app, roleFilter)) && // apply Role filter
                    (!hasReleaseTypesFilter || app.release_type === releaseTypeFilter)
                  ); // apply App Environment filter
                });

          const organization = organizationStore.find(orgName);
          const newAppUrl = orgName
            ? locationStore.getResolvedUrl(`/orgs/${orgName}/applications/create`, query as any)
            : locationStore.getResolvedUrl(`/users/${userName}/applications/create`, query as any);

          return (
            <>
              {this.showUserNotification() ? <FirstPartyUserNotification /> : null}
              <Page data-test-id="org-apps-page" supportsMobile>
                <>
                  <Helmet title={t("management:apps.orgTitle")} />
                  <BreadcrumbBuilder.Value title={t("management:apps.orgTitle")} />
                  {noApps ? (
                    <EmptyState
                      data-test-id="org-manage-apps-empty-state"
                      imgSrc={noAppsImg}
                      title={
                        orgName
                          ? t("management:orgApps.empty.title", { name: organization?.display_name || organization?.name })
                          : t("management:personalOrg.empty.title", { name: userName })
                      }
                      subtitle={t("management:orgApps.empty.subtitle")}
                      buttonText={t("management:orgApps.empty.addApp")}
                      to={newAppUrl}
                    />
                  ) : (
                    <AppList
                      hideOwner
                      query={query}
                      apps={filteredApps}
                      newAppUrl={newAppUrl}
                      release_types={appStore.release_types}
                    />
                  )}
                </>
                <PanelOutlet>{this.props.children}</PanelOutlet>
              </Page>
            </>
          );
        }
      }
    )
  )
);
