import * as React from "react";
import { withTranslation, WithTranslation } from "react-i18next";
import { layoutStore } from "@root/stores";
import { AppCenterLogo } from "@root/shared/appcenter-logo";
import { observer } from "mobx-react";
import { Autofocus } from "@root/shared/autofocus";

const styles = require("./left-nav-header.scss");

export interface LeftNavHeaderProps {
  isExpanded?: boolean;
  toggleExpanded(event: React.MouseEvent<HTMLButtonElement>): void;
}

export const LeftNavHeader = withTranslation("common")(
  observer(
    class LeftNavHeader extends React.Component<LeftNavHeaderProps & WithTranslation, {}> {
      public state = { narratorRefocus: false };

      public componentDidUpdate(prevProps) {
        if (this.props.isExpanded !== prevProps.isExpanded) {
          this.setState({ narratorRefocus: true });
        } else if (this.state.narratorRefocus) {
          this.setState({ narratorRefocus: false });
        }
      }

      public render() {
        const isMobile = layoutStore.isMobile;
        return isMobile ? (
          <div className={styles.divider}>
            <Autofocus focus={layoutStore.leftNavExpanded}>
              <AppCenterLogo to="/apps" />
            </Autofocus>
          </div>
        ) : (
          <div tabIndex={0}></div>
        );
      }
    }
  )
);
