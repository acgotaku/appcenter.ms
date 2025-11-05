import * as React from "react";
import { layoutStore } from "@root/stores";
import { observer } from "mobx-react";
import { Icon, IconName, IconSize, UnstyledButton, IconArea, Autofocus } from "@root/shared";
import { runInAction } from "mobx";
import { withTranslation, WithTranslation } from "react-i18next";
import { Navigation } from "../../navigation";
import { INavigationItem } from "@lib/common-interfaces";
import { Utils } from "../../../lib/http/utils";
import { logger } from "@root/lib/telemetry";
const styles = require("./left-nav-footer.scss");

export interface ILeftNavFooterProps {
  isExpanded?: boolean;
  toggleExpanded(event: React.MouseEvent<HTMLButtonElement>): void;
}

export const LeftNavFooter = withTranslation("common")(
  observer(
    class LeftNavFooter extends React.Component<ILeftNavFooterProps & WithTranslation, {}> {
      state = {
        narratorRefocus: false,
      };

      forceDesktopVersion(event) {
        logger.info("switchToDesktop");
        runInAction(() => (layoutStore.desktopViewOverride = true));
        event.preventDefault();
      }

      logout() {
        location.href = "/logout";
      }

      public render() {
        const { isExpanded, toggleExpanded, t } = this.props;
        const isMobile = layoutStore.isMobile;
        const onClick = (event: React.MouseEvent<HTMLButtonElement>) => {
          event.preventDefault();
          toggleExpanded(event);
          this.setState({ narratorRefocus: false });
          setTimeout(() => {
            this.setState({ narratorRefocus: true });
          }, 350);
        };
        const expandButtonLabel = isExpanded
          ? t("navigation.expandCollapseToggle.collapse")
          : t("navigation.expandCollapseToggle.expand");
        const iconName = isExpanded ? IconName.DoubleChevronLeft : IconName.DoubleChevronRight;
        const renderDesktopNavBarFooter = () => {
          return (
            <div className={styles.expander}>
              <Autofocus focus={this.state.narratorRefocus}>
                <UnstyledButton
                  className={styles.expanderButton}
                  data-test-id="left-nav-expand-button"
                  onClick={onClick}
                  aria-label={expandButtonLabel}
                >
                  <Icon icon={iconName} size={IconSize.XSmall} area={IconArea.Compact} />
                </UnstyledButton>
              </Autofocus>
            </div>
          );
        };

        const footerItems: INavigationItem[] = [];

        if (Utils.isInstallSubdomain()) {
          footerItems.push({
            title: t("navigation.userMenu.logout"),
            icon: IconName.LogOut,
            mobileReady: true,
            onClick: this.logout,
            route: "",
          });
        } else {
          footerItems.push({
            title: t("navigation.mobileMenu.switchToDesktop"),
            onClick: this.forceDesktopVersion,
            route: "#",
            icon: IconName.Desktop,
            mobileReady: true,
          });
        }

        return !isMobile ? (
          renderDesktopNavBarFooter()
        ) : (
          <div>
            <Navigation items={footerItems} isExpanded={isExpanded} onlyMobile={isMobile} />
            <div className={styles.legalAndPolicy}>
              <a className={styles.legal} href="https://azure.microsoft.com/en-us/support/legal/">
                Terms
              </a>
              <a className={styles.legal} href="https://privacy.microsoft.com/en-us/privacystatement">
                Privacy Policy
              </a>
            </div>
          </div>
        );
      }
    }
  )
);
