import * as React from "react";
import { Panelify } from "@root/shared";
import { locationStore } from "@root/stores";
import { ApiTokens } from "@root/management/shared/api-tokens/api-tokens";

@Panelify
export class AppApiTokens extends React.Component<{}, {}> {
  public render() {
    return (
      <ApiTokens
        {...this.props}
        principalType="app"
        pageTitle="App API tokens"
        emptyMessage="There are no API tokens for this app."
        toNewPath={locationStore.getUrlWithCurrentApp("settings/apitokens/create")}
      />
    );
  }
}
