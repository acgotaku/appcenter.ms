import * as React from "react";
import { omit } from "lodash";
import { OrganizationIcon, Text, Size } from "@root/shared";
import { IOrganization } from "@lib/common-interfaces";

const classNames = require("classnames");
const styles = require("./organization-badge.scss");

export interface OrganizationBadgeProps extends React.HTMLAttributes<HTMLElement> {
  organization: IOrganization;
}

export class OrganizationBadge extends React.Component<OrganizationBadgeProps, {}> {
  public render() {
    const { organization } = this.props;
    const passthrough = omit(this.props, "organization", "children", "className");
    const name = organization.display_name || organization.name;
    const className = classNames(styles["icon-container"], this.props.className);

    return (
      <div className={className} {...passthrough}>
        <OrganizationIcon size={80} className={styles.icon} organization={organization} />
        <div className={styles.name}>
          <Text size={Size.Medium} ellipsize bold>
            {name}
          </Text>
        </div>
      </div>
    );
  }
}
