import * as React from "react";
import { RouteComponentProps } from "react-router";
import { IOrganization } from "@lib/common-interfaces";
import { organizationStore } from "@root/stores";
import { notFoundStore } from "../../stores/not-found-store";

export interface OrgsProps {
  // Nothing to add here yet.
}

export class Orgs extends React.Component<OrgsProps & RouteComponentProps<any, any>, {}> {
  public UNSAFE_componentWillMount() {
    if (!this.findOrganization(this.props)) {
      notFoundStore.notify404();
    }
  }

  public render() {
    if (!this.findOrganization(this.props)) {
      return null;
    }

    return this.props.children;
  }

  private findOrganization(props): IOrganization {
    const organizationName = props.params["org_name"];

    return organizationStore.find(organizationName) as any;
  }
}
