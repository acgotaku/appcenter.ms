import * as React from "react";
import { observer } from "mobx-react";
import { Identicon, IdenticonProps } from "../identicon";
import { IconName } from "../icon/icon-name";
import { IOrganization } from "@lib/common-interfaces";

const css = require("./organization-icon.scss");

export interface OrganizationIconProps extends IdenticonProps {
  organization?: Partial<Pick<IOrganization, "display_name" | "name" | "avatar_url">>;
}

@observer
export class OrganizationIcon extends React.Component<OrganizationIconProps, {}> {
  public static defaultProps: OrganizationIconProps = {
    size: 60,
    styles: css,
    icon: IconName.Organization,
  };

  public render() {
    const { organization } = this.props;
    const { styles, value: valueFromProps, className, ...passthrough } = this.props;
    const value = valueFromProps && valueFromProps.length > 0 ? valueFromProps : undefined;

    return (
      <Identicon
        {...passthrough}
        // app.owner.avatar_url is currently set to the id of the org which doesn't make any sense
        // and obviously results in a broken image, so we want to make sure avatar_url looks like a
        // URL for now
        src={((organization && organization.avatar_url) || "").startsWith("https://") ? organization!.avatar_url : undefined}
        value={organization ? organization.display_name || organization.name : value}
        className={[className, styles.org].join(" ")}
      />
    );
  }
}
