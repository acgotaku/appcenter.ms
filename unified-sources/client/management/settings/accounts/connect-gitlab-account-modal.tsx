import { observer } from "mobx-react";
import { Modalify } from "@root/shared";
import { locationStore } from "@root/stores";
import { withTranslation, WithTranslation } from "react-i18next";
import { ConnectGitLabAccount } from "@root/build/components/shared/connect-gitlab-account";
import { WithRouterProps } from "react-router";

export const ConnectGitLabAccountModal = Modalify({
  onRequestClose: () => {
    locationStore.router.push("/settings/accounts");
  },
})(
  withTranslation(["build", "common"])(
    observer(
      class ConnectGitLabAccountModal extends ConnectGitLabAccount {
        public constructor(props: WithRouterProps & WithTranslation) {
          super(props, () => {
            locationStore.router.push("/settings/accounts");
          });
        }
      }
    )
  )
);
