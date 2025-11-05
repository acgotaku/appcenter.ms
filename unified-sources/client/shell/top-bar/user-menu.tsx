import * as React from "react";
import { observer } from "mobx-react";
import {
  Gravatar,
  IconName,
  Menu,
  Trigger,
  ItemGroup,
  Action,
  IconItem,
  AvatarItem,
  UnstyledButton,
  UserInitialsAvatar,
} from "@root/shared";
import { IUser } from "@lib/common-interfaces";
import { userStore } from "@root/stores";
import { withTranslation, WithTranslation } from "react-i18next";

const styles = require("./user-menu.scss");

export const UserMenu = withTranslation("common")(
  observer(
    class UserMenu extends React.Component<WithTranslation, {}> {
      public render() {
        const { t } = this.props;
        const userMenuListStyles = styles.userMenuList;
        const userMenuStyles = styles.userMenu;

        return (
          <Menu
            listClassName={userMenuListStyles}
            backdrop
            backdropClassName={styles.lightBackdrop}
            data-test-id="user-menu"
            tooltip={{ text: t("common:navigation.userMenu.label"), alignRight: true }}
            header={<AvatarItem email={userStore.currentUser.email} name={userStore.currentUserFriendlyName} />}
          >
            <Trigger activeClassName={styles.active} data-test-id="user-menu-trigger">
              <UnstyledButton className={userMenuStyles} aria-label={t("common:navigation.userMenu.label")}>
                <Gravatar
                  email={userStore.currentUser.email}
                  size={24}
                  fallback={
                    <UserInitialsAvatar
                      initialsName={
                        userStore.currentUserFriendlyName || userStore.currentUser.display_name || userStore.currentUser.name
                      }
                      size={24}
                    />
                  }
                />
              </UnstyledButton>
            </Trigger>
            <ItemGroup>
              <Action text={t("common:navigation.userMenu.accountSettings")} to="/settings">
                <IconItem icon={IconName.AccountSettings} title={t("common:navigation.userMenu.accountSettings")} />
              </Action>
            </ItemGroup>
            <ItemGroup>
              <Action text={t("common:navigation.supportMenu.privacy")} target="_blank" href="https://aka.ms/appcenterprivacy">
                <IconItem icon={IconName.Shield} title={t("common:navigation.supportMenu.privacy")} />
              </Action>
              <Action
                text={t("common:navigation.supportMenu.legal")}
                target="_blank"
                href="https://azure.microsoft.com/en-us/support/legal"
              >
                <IconItem icon={IconName.Certificate} title={t("common:navigation.supportMenu.legal")} />
              </Action>
            </ItemGroup>
            <ItemGroup>
              {this.canShowAdminPanelLink(userStore.currentUser) ? (
                <Action text={t("common:navigation.userMenu.admin")} href="/admin">
                  <IconItem icon={IconName.Admin} title={t("common:navigation.userMenu.admin")} />
                </Action>
              ) : null}
              <Action text={t("common:navigation.userMenu.logout")} href="/logout">
                <IconItem icon={IconName.SignOut} title={t("common:navigation.userMenu.logout")} />
              </Action>
            </ItemGroup>
          </Menu>
        );
      }

      /**
       * Returns true if the admin panel link should be shown.
       */
      private canShowAdminPanelLink(user: IUser): boolean {
        if (!user) {
          return false;
        }

        if (!user.admin_role) {
          return false;
        }

        return true;
      }
    }
  )
);
