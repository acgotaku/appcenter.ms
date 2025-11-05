import * as React from "react";
import { EmptyState } from "../empty-state";

/**
 * Getting Started page for Electron apps
 */
export class GettingStartedElectron extends React.Component<{ headerImage: any }, {}> {
  render() {
    const { headerImage } = this.props;

    return (
      <EmptyState
        title="App Center currently only supports CodePush and Handled Errors for Electron apps."
        hideButton
        imgSrc={headerImage}
      />
    );
  }
}
