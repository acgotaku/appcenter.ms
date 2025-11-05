import * as React from "react";
import { Link } from "react-router";
import { observer } from "mobx-react";
import { IApp, IOrganization, IUser } from "@lib/common-interfaces";
import { Gravatar, Space, spaceValues, OrganizationIcon, AppIcon, UserInitialsAvatar } from "@root/shared";
import { locationStore } from "@root/stores";
import { compact } from "lodash";

const styles = require("./breadcrumb.scss");

const Crumb: React.SFC<{ children: string | undefined }> = ({ children }) => (
  <div className={styles.crumb} aria-label={`Breadcrumb item ${children}`}>
    <span className={styles.crumbText}>{children}</span>
  </div>
);
Crumb.displayName = "Crumb";

const CrumbLink: React.SFC<{ url: string; current?: boolean; children: string | undefined }> = ({ url, current, children }) => (
  <Link
    className={styles.crumbLink}
    to={url}
    role="link"
    aria-label={`Breadcrumb link ${children || ""}`}
    aria-current={current ? "page" : undefined}
  >
    <span className={styles.crumbText}>{children}</span>
  </Link>
);
CrumbLink.displayName = "CrumbLink";

const Separator: React.SFC<{}> = ({}) => <div className={styles.separator}>/</div>;
Separator.displayName = "Separator";

const AppCrumb: React.SFC<{ app: IApp; isMobile: boolean }> = ({ app, isMobile }) => {
  const appName = app.display_name || app.name;
  const url = locationStore.getUrlWithApp("", app);
  return isMobile ? (
    <>
      <div className={styles.appIcon}>
        <AppIcon size={spaceValues[Space.XMedium]} app={app} value={appName} />
      </div>
      <Crumb>{appName}</Crumb>
    </>
  ) : (
    <CrumbLink url={url}>{appName}</CrumbLink>
  );
};
AppCrumb.displayName = "AppCrumb";

const OrgCrumb: React.SFC<{ org: IOrganization; app: IApp | undefined; isMobile: boolean }> = ({ org, app, isMobile }) => {
  const orgName = org.display_name || org.name;
  const url = `/orgs/${org.name}/applications`;
  return isMobile ? (
    <>
      <OrganizationIcon organization={org} className={styles.orgIcon} size={spaceValues[Space.XMedium]} />
      <Crumb>{orgName}</Crumb>
    </>
  ) : (
    <CrumbLink url={url}>{orgName}</CrumbLink>
  );
};
OrgCrumb.displayName = "OrgCrumb";

const UserCrumb: React.SFC<{ user: IUser; app: IApp | undefined; isMobile: boolean }> = ({ user, app, isMobile }) => {
  const userName = user.display_name || user.name;
  const url = `/users/${user.name}/applications`;
  return isMobile ? (
    <>
      <Gravatar
        email={user.email}
        className={styles.gravatar}
        size={spaceValues[Space.XMedium]}
        fallback={
          user.display_name ? (
            <UserInitialsAvatar size={spaceValues[Space.XMedium]} initialsName={user.display_name} className={styles.gravatar} />
          ) : user.name ? (
            <UserInitialsAvatar size={spaceValues[Space.XMedium]} initialsName={user.name} className={styles.gravatar} />
          ) : undefined
        }
      />
      <Crumb>{userName}</Crumb>
    </>
  ) : (
    <CrumbLink url={url}>{userName}</CrumbLink>
  );
};
UserCrumb.displayName = "UserCrumb";

export interface BreadcrumbProps {
  isLoading: boolean;
  isMobile: boolean;
  app?: IApp;
  org?: IOrganization;
  user?: IUser;
}

@observer
export class Breadcrumb extends React.Component<BreadcrumbProps, {}> {
  render() {
    const { isLoading, isMobile } = this.props;

    if (isLoading) {
      return null;
    }

    return (
      <nav aria-label="Breadcrumb" role="navigation" className={!isMobile ? styles.container : null}>
        <ol className={styles.list}>
          {this.getBreadcrumbs().reduce((prev, curr) => {
            return (
              <>
                {prev}
                {prev ? (
                  <li>
                    <Separator />
                  </li>
                ) : null}
                <li className={styles.listItem}>{curr}</li>
              </>
            );
          }, null)}
        </ol>
      </nav>
    );
  }

  private getBreadcrumbs(): (JSX.Element | null)[] {
    const { isMobile, app, org, user } = this.props;
    const breadcrumbs: (JSX.Element | null)[] = [];
    breadcrumbs.push(!org || (app && isMobile) ? null : <OrgCrumb org={org} app={app} isMobile={isMobile} />);
    breadcrumbs.push(!user || (app && isMobile) ? null : <UserCrumb user={user} app={app} isMobile={isMobile} />);
    breadcrumbs.push(!app || (!user && !org) ? null : <AppCrumb app={app} isMobile={isMobile} />);
    if (!isMobile) {
      locationStore.breadcrumbs.forEach((crumb, idx, arr) => {
        const isLast = idx === arr.length - 1;
        if (!crumb) {
          return;
        } else if (crumb.path) {
          breadcrumbs.push(
            <CrumbLink url={crumb.path} current={isLast}>
              {crumb.title}
            </CrumbLink>
          );
        } else {
          breadcrumbs.push(<Crumb>{crumb.title}</Crumb>);
        }
      });
      const filteredCrumbs = compact(breadcrumbs);
      // A single link should never be shown
      return filteredCrumbs.length > 1 ? filteredCrumbs : [];
    } else {
      // Mobile breadcrumbs don't have the same rules
      return compact(breadcrumbs);
    }
  }
}
