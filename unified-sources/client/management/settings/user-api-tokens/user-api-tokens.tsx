import * as React from "react";
import { Panelify } from "@root/shared";
import { ApiTokens } from "@root/management/shared/api-tokens/api-tokens";

@Panelify
export class UserApiTokens extends React.Component<{}, {}> {
  public render() {
    return (
      <ApiTokens
        {...this.props}
        principalType="user"
        pageTitle="User API tokens"
        emptyMessage="You do not have any API tokens."
        toNewPath="/settings/apitokens/create"
      />
    );
  }
}
