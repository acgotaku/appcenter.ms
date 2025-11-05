//
// React component to display ExternalData, rendering
// a Loading, Loaded, or Failed screen depending on
// which state the externaldata is in at the time.
//
// Usage:
//    <ExternalDataDisplay data={externalData}>
//      <YourContentWhenLoaded data={externalData}} />
//      <LoadingDisplay>
//        <YourContentWhenLoading />
//      </LoadingDisplay>
//      <FailedDisplay>
//        <YourContentWhenLoadFails data={externalData} />
//      </FailedDisplay>
//    </ExternalDataDisplay>
//
// The component can have at most three children: one loaded content,
// an optional <LoadingDisplay> child, and an optional <FailedDisplay>.
// The order they appear in does not matter.
//

import * as React from "react";
import * as PropTypes from "prop-types";
import { partition } from "lodash";
import { Component, Children, cloneElement, createElement, ReactNode, StatelessComponent } from "react";
import { ExternalData, ExternalDataState } from "@root/lib/utils/external-data";
import { Spinner } from "../spinner/spinner";
const { observer } = require("mobx-react");
const classNames = require("classnames");
const css = require("./external-data-display.scss");

const makeWrapperSFC = (): StatelessComponent<React.HTMLAttributes<HTMLElement>> => (props: React.HTMLAttributes<HTMLElement>) => {
  const child = React.Children.only(props.children);
  return typeof child === "string" ? createElement("span", props, child) : cloneElement(child, props, child.props.children);
};

export const LoadingDisplay = makeWrapperSFC();
export const FailedDisplay = makeWrapperSFC();

// we use `className`'s here just so tests can find the elements. The styles aren't actually used.
const DefaultLoadingDisplay: StatelessComponent<any> = () =>
  createElement(Spinner, { className: "external-data-loading" }, "Loading...");
const DefaultFailedDisplay: StatelessComponent<any> = (props: any) =>
  createElement("div", { className: classNames(props.styles.failed, "external-data-failed") }, "Error while loading data.");
DefaultFailedDisplay.defaultProps = { styles: css };

export interface ExternalDataDisplayProps {
  data: ExternalData<any>;
}

@observer
export class ExternalDataDisplay extends Component<ExternalDataDisplayProps, {}> {
  public static propTypes = {
    data: PropTypes.object.isRequired,

    children(props: any, propName: string, componentName: string) {
      const partitions = partitionChildren(props[propName]);
      const errors = [] as string[];
      if (partitions.pending.length > 1) {
        errors.push(`${componentName} can only include one <LoadingDisplay> element`);
      }

      if (partitions.failed.length > 1) {
        errors.push(`${componentName} can only include one <FailedDisplay> element`);
      }

      if (partitions.content.length > 1) {
        errors.push(`${componentName} must have only one content element`);
      }

      if (errors.length > 0) {
        return new Error(errors.join(", "));
      }
    },
  };

  public render() {
    const [pendingElement, loadedElement, failedElement] = this._findStateChildren();
    if (this.props.data.state === ExternalDataState.Pending) {
      return pendingElement;
    }
    if (this.props.data.state === ExternalDataState.Loaded) {
      return loadedElement || null;
    }
    if (this.props.data.state === ExternalDataState.Failed) {
      return failedElement;
    }
    console.error(`Unknown state '{this.props.data.state}' for external data, something\'s wrong.`);
    return null;
  }

  public _findStateChildren() {
    const children = partitionChildren(this.props.children);

    return [this._defaultPendingElement(children.pending[0]), children.content[0], this._defaultFailedElement(children.failed[0])];
  }

  public _defaultPendingElement(pendingChild: ReactNode) {
    return pendingChild || createElement(LoadingDisplay, {}, createElement(DefaultLoadingDisplay, {}));
  }

  public _defaultFailedElement(failedChild: ReactNode) {
    return failedChild || createElement(FailedDisplay, {}, createElement(DefaultFailedDisplay, {}));
  }
}

//
// Split a child props array into three partitions, returning each.
//
function partitionChildren(childProps: ReactNode) {
  const children = Children.toArray(childProps);
  const [pending, rest] = partition(children, (child: any) => child.type && child.type === LoadingDisplay);
  const [failed, content] = partition(rest, (child: any) => child.type && child.type === FailedDisplay);

  return { pending, failed, content };
}
