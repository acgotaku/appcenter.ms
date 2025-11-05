import * as React from "react";
import { RouteComponentProps } from "react-router";
import { Page, TopBar, Panelify, PanelInjectedProps, PanelOutlet, SecondaryNavigation } from "@root/shared";
import { CategoryName, IOrganization, OrganizationUserRole } from "@lib/common-interfaces";
import { OrganizationBadge } from "../organization-badge/organization-badge";
import { organizationStore, locationStore } from "@root/stores";
import { withTranslation, WithTranslation } from "react-i18next";

const styles = require("./manage.scss");

type ManageProps = PanelInjectedProps & RouteComponentProps<any, any> & WithTranslation;

export interface NavItem {
  title: string;
  route: string;
}

export const Manage = Panelify(
  withTranslation(["common", "management"])(
    class Manage extends React.Component<ManageProps, NavItem, {}> {
      private _navItems: NavItem[] = [];
      private organizationName: string = "";

      private get getOrganization(): IOrganization {
        return organizationStore.find(this.organizationName)!;
      }

      public UNSAFE_componentWillMount() {
        this._handlePropsChange(this.props);
      }

      public UNSAFE_componentWillReceiveProps(nextProps: ManageProps) {
        this._handlePropsChange(nextProps);
      }

      private _handlePropsChange(props: ManageProps) {
        const { params, t } = props;
        const { org_name } = params;
        this.organizationName = org_name;
        const organization: IOrganization = this.getOrganization;

        // If the current user is not an Admin on the organization, route to the org's landing page.
        if (organization.collaborator_role !== OrganizationUserRole.Admin) {
          locationStore.router.push(`/orgs/${organization.name}`);
        } else {
          const manageOrganizationRootPath = `/orgs/${org_name}/manage`;
          this._navItems = [
            {
              title: t("title.settings"),
              route: `${manageOrganizationRootPath}/settings`,
            },
          ];

          if (organization.organization_category?.category_name === CategoryName.FirstParty) {
            this._navItems.push({
              route: `${manageOrganizationRootPath}/billing`,
              title: t("management:billingPlans.title"),
            });
          }

          this._navItems.push({
            route: `${manageOrganizationRootPath}/azure`,
            title: t("management:azureSettings.title"),
          });
        }
      }

      public render() {
        const { t } = this.props;

        return (
          <Page>
            <TopBar title={t("title.manage")}></TopBar>
            <div>
              <OrganizationBadge organization={this.getOrganization} className={styles.badge} />
              <SecondaryNavigation items={this._navItems} />
            </div>
            <PanelOutlet>{this.props.children}</PanelOutlet>
          </Page>
        );
      }
    }
  )
);
