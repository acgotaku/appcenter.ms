import * as React from "react";
import { RouteComponentProps } from "react-router";
import { Page, TopBar, Panelify, PanelInjectedProps, PanelOutlet, SecondaryNavigation } from "@root/shared";
import { CategoryName, IOrganization, OrganizationUserRole } from "@lib/common-interfaces";
import { organizationStore, locationStore } from "@root/stores";
import { OrganizationBadge } from "../organization-badge/organization-badge";
import { withTranslation, WithTranslation } from "react-i18next";

const styles = require("./people.scss");

type PeopleProps = PanelInjectedProps & RouteComponentProps<any, any> & WithTranslation;

export const People = Panelify(
  withTranslation(["common", "management"])(
    class People extends React.Component<PeopleProps, {}> {
      private _navItems: any = [];
      private _organization!: IOrganization;

      constructor(props: PeopleProps) {
        super(props);
      }

      public UNSAFE_componentWillMount() {
        const { params, t } = this.props;
        const { org_name } = params;

        this._organization = organizationStore.find(org_name)!;

        // org members are not allowed read or write access to any resources under the "People" tab
        if (this._organization.collaborator_role === OrganizationUserRole.Member) {
          locationStore.pushOrgAppList();
        }

        this._navItems = [
          {
            title: t("access.collaborator", { count: 0 }),
            route: `/orgs/${org_name}/people/collaborators`,
          },
          {
            title: t("access.team", { count: 0 }),
            route: `/orgs/${org_name}/people/teams`,
          },
        ];
        if (
          [CategoryName.FirstParty, CategoryName.ThirdParty].includes(
            this._organization.organization_category?.category_name || CategoryName.None
          )
        ) {
          this._navItems.push({
            title: t("access.distributionGroup", { count: 0 }),
            route: `/orgs/${org_name}/people/distribution-groups`,
          });
        }
      }

      public render() {
        const { t } = this.props;

        return (
          <Page>
            <TopBar title={t("management:people.title")}></TopBar>
            <div>
              <OrganizationBadge organization={this._organization} className={styles.badge} />
              <SecondaryNavigation items={this._navItems} />
            </div>
            <PanelOutlet>{this.props.children}</PanelOutlet>
          </Page>
        );
      }
    }
  )
);
