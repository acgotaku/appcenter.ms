import * as React from "react";
import { observer } from "mobx-react";
import { Link } from "react-router";
import { Breadcrumb } from "../breadcrumb";
import { globalUIStore, layoutStore, locationStore, userStore } from "@root/stores";
import { loadingStore } from "@root/stores/loading-store";
import {
  Button,
  Gravatar,
  Icon,
  IconArea,
  IconName,
  IconSize,
  PageProgress,
  PanelPosition,
  Size,
  Stretch,
  Text,
  TextColor,
  UnstyledButton,
  UserInitialsAvatar,
} from "@root/shared";
import { logger } from "@root/lib/telemetry";
import { SupportMenu } from "./support-menu";
import { UserMenu } from "./user-menu";
import { AppCenterLogo } from "@root/shared/appcenter-logo";
import { IApp, IOrganization } from "@lib/common-interfaces";
import { Routes } from "@root/install-beacon/utils/constants";
import { Utils } from "../../lib/http/utils";
import { withTranslation, WithTranslation } from "react-i18next";
import { SkipLink } from "./skipLink";

const styles = require("./top-bar.scss");

const HamburgerButton: React.FunctionComponent<{ onClick?: () => void }> = ({ onClick }) => (
  <UnstyledButton
    aria-label="Open Side Menu"
    aria-expanded={globalUIStore.isNavBarOpen ? "true" : "false"}
    className={styles.hamburger}
    onClick={onClick}
  >
    <Icon icon={IconName.Menu} size={IconSize.XSmall} area={IconArea.Relaxed} />
  </UnstyledButton>
);

export const DocsButton = withTranslation("common")(
  class DocsButton extends React.Component<WithTranslation, {}> {
    render() {
      const { t } = this.props;
      return (
        <Button
          target="_blank"
          href="https://aka.ms/appcenterdocs"
          onClick={() => {
            logger.info("top-bar/docs");
          }}
          aria-label={t("common:navigation.docs")}
          subtle
          className={styles["docs-button"]}
        >
          <Icon icon={IconName.OpenInNew} className={styles["docs-icon"]} size={IconSize.XSmall} />
          <Text size={Size.Medium} color={TextColor.Secondary} className={styles["docs-text"]}>
            {t("common:navigation.docs")}
          </Text>
        </Button>
      );
    }
  }
);

interface TopBarMenuProps {
  isMobile?: boolean;
}

const TopBarMenu: React.FunctionComponent<TopBarMenuProps> = ({ isMobile }) => (
  <div className={styles["menu-options"]}>
    {!isMobile ? <DocsButton /> : null}
    <SupportMenu isMobile={isMobile} />
    <UserMenu />
  </div>
);

export interface TopBarProps {
  app?: IApp;
  org?: IOrganization;
  ownerType?: string;
  showProfileLink?: boolean;
  loading?: boolean;
  controlsArea?: React.ReactNode;
  headerLogo?: JSX.Element;
}

@observer
export class TopBar extends React.Component<TopBarProps, {}> {
  private isInstallPortal: boolean = Utils.isInstallSubdomain();

  private onHamburgerClick() {
    layoutStore.toggleNavSize();
    if (layoutStore.leftNavExpanded) {
      logger.info("Hamburger navbar expanded");
    }
  }

  render() {
    const { app, org, ownerType, loading, controlsArea } = this.props;
    const user = ownerType === "users" ? userStore.currentUser : undefined;
    const { isMobile = false } = layoutStore;
    const isLoading = locationStore.loading;
    const shouldShowMobileLogo = isMobile && !app && !org && !user;

    const showLoader = loadingStore.isLoading && !loadingStore.modalLoading;
    return (
      <div
        className={styles.navigationWrapper}
        aria-hidden={globalUIStore.isDialogOrPopoverOpen ? true : undefined}
        tabIndex={globalUIStore.isDialogOrPopoverOpen ? -1 : undefined}
      >
        <Stretch centered>
          {this.renderAppCenterNav(shouldShowMobileLogo, isMobile)}
          <SkipLink />
          {this.isInstallPortal ? null : <Breadcrumb isLoading={isLoading} isMobile={isMobile} user={user} app={app} org={org} />}
          <div className={styles.spacing} />
          {controlsArea}
          {this.isInstallPortal ? this.renderProfileButton() : <TopBarMenu isMobile={isMobile} />}
        </Stretch>
        <PageProgress panelPosition={PanelPosition.Primary} loading={showLoader || !!loading} />
      </div>
    );
  }

  public renderAppCenterNav(shouldShowMobileLogo: boolean, isMobile: boolean): JSX.Element {
    const { leftNavExpanded = true } = layoutStore;
    const { headerLogo } = this.props;

    if (!isMobile) {
      return !!headerLogo ? headerLogo : <AppCenterLogo to="/" collapsed={!leftNavExpanded} />;
    } else {
      return (
        <>
          <HamburgerButton onClick={this.onHamburgerClick} />
          {!!headerLogo ? (
            headerLogo
          ) : Utils.isInstallSubdomain() || shouldShowMobileLogo ? (
            <AppCenterLogo to="/" collapsed={false} mobile={true} />
          ) : null}
        </>
      );
    }
  }

  public renderProfileButton(): JSX.Element | undefined {
    if (!userStore.currentUser || !this.props.showProfileLink) {
      return;
    }
    const { email, display_name, name } = userStore.currentUser;

    return userStore.userLoggedIn ? this.renderAvatarButton(email, display_name || name) : this.renderLoginButton();
  }

  public renderAvatarButton(email: string, name: string | undefined): JSX.Element {
    return (
      <Link className={styles["profile"]} to={Routes.Profile} aria-label="Profile">
        <Gravatar email={email} size={24} fallback={name ? <UserInitialsAvatar initialsName={name} size={24} /> : undefined} />
      </Link>
    );
  }

  public renderLoginButton(): JSX.Element {
    return (
      <a className={styles["signin"]} href={Routes.SignIn}>
        Sign In
      </a>
    );
  }
}
