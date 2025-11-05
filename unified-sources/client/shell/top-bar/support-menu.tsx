import * as React from "react";
import { observer } from "mobx-react";
import { Action, Icon, IconItem, IconName, IconSize, ItemGroup, Menu, Trigger, UnstyledButton } from "@root/shared";
import { withTranslation, WithTranslation } from "react-i18next";
import { logger } from "@root/lib/telemetry";
import { SupportUIStoreContext } from "../support-ui-store";

const styles = require("./support-menu.scss");

interface SupportMenuProps {
  isMobile?: boolean;
}

export const SupportMenu = withTranslation("common")(
  observer(
    class SupportMenu extends React.Component<SupportMenuProps & WithTranslation, {}> {
      public render() {
        const { isMobile, t } = this.props;
        const supportMenuListStyles = styles.supportMenuList;
        const supportMenuStyles = styles.supportMenu;

        return (
          <Menu
            listClassName={supportMenuListStyles}
            backdrop
            backdropClassName={styles.lightBackdrop}
            data-test-id="support-menu"
            tooltip={{ text: t("common:navigation.supportMenu.label"), alignRight: true }}
          >
            <Trigger activeClassName={styles.active} data-test-id="support-menu-trigger">
              <UnstyledButton
                className={supportMenuStyles}
                aria-label={t("common:navigation.supportMenu.label")}
                onClick={this.openSupportMenu}
              >
                <Icon icon={IconName.QuestionMark} size={IconSize.XSmall} />
              </UnstyledButton>
            </Trigger>

            <ItemGroup>
              <Action
                text={t("common:navigation.supportMenu.systemStatus")}
                onClick={this.systemStatus}
                target="_blank"
                href="https://status.appcenter.ms/"
              >
                <IconItem icon={IconName.Satellite} title={t("common:navigation.supportMenu.systemStatus")} />
              </Action>
            </ItemGroup>
            {isMobile ? (
              <ItemGroup>
                <Action
                  text={t("common:navigation.supportMenu.docs")}
                  onClick={this.openDocs}
                  target="_blank"
                  href="https://aka.ms/appcenterdocs"
                >
                  <IconItem icon={IconName.Docs} title={t("common:navigation.supportMenu.docs")} />
                </Action>
              </ItemGroup>
            ) : null}
            <ItemGroup>
              <SupportUIStoreContext.Consumer>
                {({ show }) => (
                  <Action
                    text={t("common:navigation.supportMenu.contactSupport")}
                    onClick={() => this.contactSupport(show)}
                    tabIndex={0}
                  >
                    <IconItem icon={IconName.Support} title={t("common:navigation.supportMenu.contactSupport")} />
                  </Action>
                )}
              </SupportUIStoreContext.Consumer>
            </ItemGroup>
          </Menu>
        );
      }

      private systemStatus() {
        logger.info("support-menu/system-status");
      }

      private openDocs() {
        logger.info("support-menu/docs");
      }

      private openSupportMenu() {
        logger.info("support-menu/open-support-menu");
      }

      private contactSupport = (show: any) => {
        show();
        logger.info("support-menu/open-contact-support");
      };
    }
  )
);
