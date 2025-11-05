import * as React from "react";
import * as PropTypes from "prop-types";
import { partition } from "lodash";
import { Component, Children, cloneElement, createElement, ReactNode, StatelessComponent } from "react";
import { IACL } from "@lib/common-interfaces/acl";

const makeWrapperSFC = (): StatelessComponent<React.HTMLAttributes<HTMLElement> & { children?: React.ReactChild }> => (
  props: React.HTMLAttributes<HTMLElement> & { children?: React.ReactChild }
) => {
  const child = React.Children.only(props.children);
  return typeof child === "string" ? createElement("span", props, child) : cloneElement(child, props, child.props.children);
};

export const Allowed = makeWrapperSFC();
export const Forbidden = makeWrapperSFC();

const DefaultElement: StatelessComponent<any> = (props: any) => createElement("div");

export class AclGuardProps {
  public permission: any;
  public acl!: IACL;
}

/**
 * React component to display another component based on a permission.
 *
 * Usage:
 *
 *    <AclGuard permission={myPermission} acl={myAcl}>
 *      <Allowed>
 *        <YourComponent1 />
 *      </Allowed>
 *      <Forbidden>
 *        <YourComponent2 />
 *      </Forbidden>
 *    </AclGuard>
 *
 * Or, a simpler version if you don't want to display anything if the user doesn't have the
 * required permission:
 *
 *    <AclGuard permission={myPermission} acl={myAcl}>
 *      <YourComponent />
 *    </AclGuard>
 *
 */
export class AclGuard extends Component<AclGuardProps, {}> {
  public static propTypes = {
    permission: PropTypes.number.isRequired,

    children(props: any, propName: string, componentName: string) {
      const partitions = partitionChildren(props[propName]);
      const errors = [] as string[];
      if (partitions.allowed.length > 1) {
        errors.push(`${componentName} can only include one <Allowed> element`);
      }

      if (partitions.forbidden.length > 1) {
        errors.push(`${componentName} can only include one <Forbidden> element`);
      }

      if (partitions.allowed.length === 1 && partitions.content.length > 0) {
        errors.push(`${componentName} cannot include an <Allowed> element and a content element`);
      } else if (partitions.content.length > 1) {
        errors.push(`${componentName} must have only one content element`);
      }

      if (errors.length > 0) {
        return new Error(errors.join(", "));
      }
    },
  };

  public render(): JSX.Element {
    const [allowedElement, forbiddenElement] = this._findStateChildren();
    if (this.props.acl.checkPermission(this.props.permission)) {
      return allowedElement as JSX.Element;
    } else {
      return forbiddenElement as JSX.Element;
    }
  }

  public _findStateChildren() {
    const children = partitionChildren(this.props.children);

    // Make the default allowed element the first child if there is no <Allowed> component.
    const allowed = children.allowed[0] || children.content[0];

    return [this._defaultAllowedElement(allowed), this._defaultForbiddenElement(children.forbidden[0])];
  }

  public _defaultAllowedElement(pendingChild: ReactNode) {
    return pendingChild || createElement(Allowed, {}, createElement(DefaultElement, {}));
  }

  public _defaultForbiddenElement(failedChild: ReactNode) {
    return failedChild || createElement(Forbidden, {}, createElement(DefaultElement, {}));
  }
}

/**
 * Split a child props array into three partitions, returning each.
 *
 * @param {ReactNode} childProps
 * @returns
 */
function partitionChildren(childProps: ReactNode) {
  const children = Children.toArray(childProps);
  const [allowed, rest] = partition(children, (child: any) => child.type && child.type === Allowed);
  const [forbidden, content] = partition(rest, (child: any) => child.type && child.type === Forbidden);

  return { allowed, forbidden, content };
}
