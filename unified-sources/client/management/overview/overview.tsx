import * as React from "react";
import { observer } from "mobx-react";
import { RouteComponentProps } from "react-router";
import {
  Page,
  PanelOutlet,
  Panelify,
  PanelInjectedProps,
  IconName,
  EmptyState,
  NotificationType,
  Button,
  PageHeader,
  Card,
  HeaderArea,
  ClickableIcon,
  Icon,
  IconSize,
  MediaObject,
  AppIcon,
  Title,
  TitleH3,
  Size,
  Paragraph,
  TextColor,
  Space,
  Grid,
  RowCol,
  EmptyStateButtonType,
  MessageBar,
  isMobileBrowser,
} from "@root/shared";
import { GettingStartedTabbed } from "@root/shared/getting-started/getting-started-tabbed";
import { GettingStartedSingle } from "@root/shared/getting-started/getting-started-single";
import { GettingStartedElectron } from "@root/shared/getting-started/getting-started-electron";
import { OS, PLATFORMS } from "@lib/common-interfaces/app";
import { withTranslation, WithTranslation } from "react-i18next";
import { gettingStarted } from "../../i18n/content/loaders";
import { OverviewUIStore } from "@root/management/overview/overview-ui-store";
import { appStore, layoutStore, locationStore } from "@root/stores";
import { formatDate } from "@root/lib/utils/time";
import { FooterArea } from "@root/shared/footer-area";
import { QRCodeDialog } from "@root/shared/qr-code/qr-code-dialog";
import { ReleaseHelper } from "@root/distribute/utils/release-helper";

const styles = require("./overview.scss");
const defaultHeaderImg = require("./overview.svg");
const notSupportedImg = require("./not-supported-overview.svg");
const notSupportedWindwsImg = require("./not-supported-overview-windows.svg");
const mobileNotConfiguredImg = require("./mobile-not-configured-overview.svg");

export interface OverviewProps extends PanelInjectedProps {
  // nothing to add here.
}

@observer
class NotSupported extends React.Component<{ headerImage: any }, {}> {
  render() {
    const { app } = appStore;
    const { headerImage } = this.props;
    const platform = app.platform;
    const os = app.os;
    const isAppIosOrAndroidWithUnknownPlatform = app.isAnAndroidAppWithUnknownPlatform || app.isAnIosAppWithUnknownPlatform;

    return (platform === PLATFORMS.REACT_NATIVE.value || platform === PLATFORMS.CORDOVA.value) && os === OS.WINDOWS ? (
      <EmptyState
        className={styles["empty-state-wrapper"]}
        title="App not supported."
        subtitle="Your app currently isn’t supported, but you can continue to use the CodePush CLI and service with it."
        hideButton
        imgSrc={headerImage}
      />
    ) : (
      <EmptyState
        className={styles["empty-state-wrapper"]}
        title={
          isAppIosOrAndroidWithUnknownPlatform
            ? "We're working on supporting your app."
            : `Don’t be mad but… we don’t support ${app.humanReadablePlatform} on ${app.os} yet`
        }
        subtitle={
          isAppIosOrAndroidWithUnknownPlatform
            ? "Good news is you can still distribute and investigate crashes in HockeyApp while we work on bringing support to App Center. (For some apps, you'll be able to see Crashes and Analytics stream in from HockeyApp)."
            : "Good news are that you can still manage and distribute your app using HockeyApp while we work on bringing support for this platform to App Center."
        }
        hideButton
        imgSrc={headerImage}
      />
    );
  }
}

@observer
class GettingStartedContents extends React.Component<{ allowedToSeeSDKInstructions: boolean; asyncContentLoaded: () => void }, {}> {
  render() {
    const { allowedToSeeSDKInstructions, asyncContentLoaded } = this.props;
    const { app } = appStore;
    const { os, platform, app_secret } = app;
    const headerImg = (() => {
      if (!app.isSupportedForBeacon("apps")) {
        return notSupportedImg;
      } else if (os === OS.WINDOWS && (platform === PLATFORMS.REACT_NATIVE.value || platform === PLATFORMS.CORDOVA.value)) {
        return notSupportedWindwsImg;
      } else {
        return defaultHeaderImg;
      }
    })();

    let sdkName: string = null as any;
    let osInstructions: JSX.Element;

    // Choose which component to display depending on the application's OS.
    if (platform === PLATFORMS.XAMARIN.value) {
      sdkName = PLATFORMS.XAMARIN.displayName;
      osInstructions = (
        <GettingStartedTabbed
          os={os}
          app_secret={app_secret as any}
          flavors={["Xamarin", "Xamarin.Forms"]}
          completedCallback={asyncContentLoaded}
          contentLoader={gettingStarted}
        />
      );
    } else if (platform === PLATFORMS.UNITY.value) {
      sdkName = PLATFORMS.UNITY.displayName;
      osInstructions = (
        <GettingStartedSingle
          os={os}
          platform={PLATFORMS.UNITY.value}
          app_secret={app_secret as any}
          completedCallback={asyncContentLoaded}
          contentLoader={gettingStarted}
        />
      );
    } else if (platform === PLATFORMS.WPF.value) {
      sdkName = PLATFORMS.WPF.displayName;
      osInstructions = (
        <GettingStartedSingle
          os={os}
          platform={PLATFORMS.WPF.value}
          app_secret={app_secret as any}
          completedCallback={asyncContentLoaded}
          contentLoader={gettingStarted}
        />
      );
    } else if (platform === PLATFORMS.WINFORMS.value) {
      sdkName = PLATFORMS.WINFORMS.displayName;
      osInstructions = (
        <GettingStartedSingle
          os={os}
          platform={PLATFORMS.WINFORMS.value}
          app_secret={app_secret as any}
          completedCallback={asyncContentLoaded}
          contentLoader={gettingStarted}
        />
      );
    } else if (platform === PLATFORMS.REACT_NATIVE.value) {
      sdkName = PLATFORMS.REACT_NATIVE.displayName;
      osInstructions = (
        <GettingStartedSingle
          os={os}
          platform={PLATFORMS.REACT_NATIVE.value}
          app_secret={app_secret as any}
          completedCallback={asyncContentLoaded}
          contentLoader={gettingStarted}
        />
      );
    } else if (platform === PLATFORMS.CORDOVA.value) {
      sdkName = PLATFORMS.CORDOVA.displayName;
      osInstructions = (
        <GettingStartedSingle
          os={os}
          platform={PLATFORMS.CORDOVA.value}
          app_secret={app_secret as any}
          completedCallback={asyncContentLoaded}
          contentLoader={gettingStarted}
        />
      );
    } else if (os === OS.ANDROID) {
      sdkName = OS.ANDROID;
      osInstructions = (
        <GettingStartedSingle
          os={os}
          platform={PLATFORMS.JAVA.value}
          app_secret={app_secret as any}
          completedCallback={asyncContentLoaded}
          contentLoader={gettingStarted}
        />
      );
    } else if (os === OS.IOS) {
      sdkName = OS.IOS;
      osInstructions = (
        <GettingStartedTabbed
          os={os}
          flavors={["Swift", "Objective-C"]}
          app_secret={app_secret as any}
          completedCallback={asyncContentLoaded}
          contentLoader={gettingStarted}
        />
      );
    } else if (platform === PLATFORMS.UWP.value) {
      sdkName = PLATFORMS.UWP.displayName;
      osInstructions = (
        <GettingStartedTabbed
          os={os}
          flavors={["UWP", "Xamarin.Forms"]}
          app_secret={app_secret as any}
          completedCallback={asyncContentLoaded}
          contentLoader={gettingStarted}
        />
      );
    } else if (os === OS.MACOS) {
      sdkName = OS.MACOS;
      osInstructions = (
        <GettingStartedTabbed
          os={os}
          flavors={["Swift", "Objective-C"]}
          app_secret={app_secret as any}
          completedCallback={asyncContentLoaded}
          contentLoader={gettingStarted}
        />
      );
    } else if (os === OS.TVOS) {
      sdkName = OS.TVOS;
      osInstructions = (
        <GettingStartedTabbed
          os={os}
          flavors={["Swift", "Objective-C"]}
          app_secret={app_secret as any}
          completedCallback={asyncContentLoaded}
          contentLoader={gettingStarted}
        />
      );
    }

    if (app.platform === PLATFORMS.ELECTRON.displayName) {
      return (
        <div>
          <GettingStartedElectron headerImage={headerImg} />
        </div>
      );
    }

    if (!app.isSupportedForBeacon("apps") || app.isCodePushCapableButLimitedOtherSupport) {
      return (
        <div>
          <NotSupported headerImage={headerImg} />
        </div>
      );
    }

    return (
      <div>
        <div className={styles.gettingStarted}>
          <div className={styles.header}>
            <img alt="" role="presentation" className={styles.splashImage} src={headerImg} />
            <div>
              <Title spaceAbove={Space.Small} spaceBelow={Space.Small} tagName="h2" size={Size.Medium}>
                Add App Center’s SDK to your app.
              </Title>
              <div>
                {allowedToSeeSDKInstructions
                  ? "For detailed instructions on SDK integration go to:"
                  : "Have a teammate add the App Center SDK."}
              </div>
              {allowedToSeeSDKInstructions ? (
                <a target="_blank" href={appStore.sdkDocUrl}>
                  Getting Started with the {sdkName} SDK
                </a>
              ) : null}
            </div>
          </div>
          {allowedToSeeSDKInstructions ? osInstructions! : null}
        </div>
      </div>
    );
  }
}

export const Overview = Panelify(
  withTranslation(["management"])(
    observer(
      class Overview extends React.Component<RouteComponentProps<any, any> & OverviewProps & WithTranslation, {}> {
        private uiStore: OverviewUIStore;

        private get allowedToSeeSDKInstructions() {
          return appStore.hasAnyCollaboratorRole(["manager", "developer"]);
        }

        constructor(props: RouteComponentProps<any, any> & OverviewProps & WithTranslation) {
          super(props);
          this.uiStore = new OverviewUIStore();
          // If user isn't allowed to see SDK instructions, no need to show the progress bar.
          if (!this.allowedToSeeSDKInstructions) {
            this.uiStore.asyncContentLoaded();
          }
        }

        public render() {
          const { t } = this.props;
          const {
            latestRelease,
            asyncContentLoaded,
            isLoading,
            appQRCodeDialogVisible,
            hideAppQRCodeDialog,
            appInstallPortalUrl,
            showAppQRCodeDialog,
            isReleasesFetched,
          } = this.uiStore;
          const { app } = appStore;

          return (
            <Page
              data-test-id="getting-started-page"
              supportsMobile={isMobileBrowser}
              constrainedWidth
              header={<PageHeader title={t("management:overview.topBar.title")} loading={isLoading} />}
            >
              {!isLoading ? (
                <Grid>
                  {app.isCordovaApp ? (
                    <RowCol>
                      <MessageBar
                        type={NotificationType.Warning}
                        renderActionButton={(props) => (
                          <Button {...props} target="_blank" href="https://aka.ms/cordovaretirement">
                            {t("management:apps.openDocs")}
                          </Button>
                        )}
                      >
                        {t("management:apps.cordovaSupportRetired")}
                      </MessageBar>
                    </RowCol>
                  ) : null}
                  {(app.isMacOSApp || app.isTvOSApp || app.isCordovaApp) &&
                  (app.isCreatedInAppCenter || app.isCreatedInTestCloud) &&
                  !app.isElectronApp ? (
                    <RowCol>
                      <MessageBar
                        type={NotificationType.Info}
                        renderActionButton={(props) => (
                          <Button {...props} target="_blank" href="https://aka.ms/appcenter-platform-matrix">
                            {t("management:apps.openDocs")}
                          </Button>
                        )}
                      >
                        {t("management:apps.servicesNotSupported", { os: app.os, platform: app.friendlyPlatform })}
                      </MessageBar>
                    </RowCol>
                  ) : null}
                  {isReleasesFetched && !!latestRelease ? (
                    <RowCol>
                      <Card
                        dividedFooter
                        header={
                          <HeaderArea inline title={t("management:overview.cards.distribution.title")}>
                            {layoutStore.isMobile && isMobileBrowser ? (
                              <ClickableIcon
                                role="button"
                                aria-label={t("management:overview.cards.distribution.download.mobile", {
                                  version: latestRelease.shortVersion,
                                })}
                                icon={<Icon icon={IconName.Download} size={IconSize.Small} />}
                                href={appInstallPortalUrl}
                                target="_blank"
                              />
                            ) : (
                              <ClickableIcon
                                role="button"
                                aria-label={t("management:overview.cards.distribution.download.desktop", {
                                  version: latestRelease.shortVersion,
                                })}
                                icon={<Icon icon={IconName.Download} size={IconSize.Small} />}
                                onClick={showAppQRCodeDialog}
                              />
                            )}
                          </HeaderArea>
                        }
                        footer={
                          <FooterArea to={locationStore.getUrlWithCurrentApp("distribute/releases", { top: "false" })} centered>
                            <Paragraph size={Size.Small} color={TextColor.Link}>
                              See all releases
                            </Paragraph>
                          </FooterArea>
                        }
                      >
                        <MediaObject hSpace={Space.Small}>
                          <AppIcon app={app} size={40} />
                          <TitleH3 size={Size.XSmall}>
                            {ReleaseHelper.versionString(latestRelease.shortVersion, latestRelease.version)}
                          </TitleH3>
                          <Paragraph size={Size.Small} color={TextColor.Secondary}>
                            {formatDate(latestRelease.uploadedAt, "shortFullDate")}
                          </Paragraph>
                        </MediaObject>
                      </Card>
                      <QRCodeDialog app={app} visible={appQRCodeDialogVisible} onClose={hideAppQRCodeDialog} />
                    </RowCol>
                  ) : null}
                  <RowCol>
                    {layoutStore.isMobile && isMobileBrowser ? (
                      <EmptyState
                        title={"What's next?"}
                        subtitle={"Get started by learning more about what you can do in App Center."}
                        buttonText={"Learn more"}
                        href={"https://docs.microsoft.com/en-us/appcenter/"}
                        buttonType={EmptyStateButtonType.ExternalLink}
                        imgSrc={mobileNotConfiguredImg}
                        className={styles.mobileEmpty}
                      />
                    ) : (
                      <Card header={t("management:overview.cards.gettingStarted")}>
                        <GettingStartedContents
                          allowedToSeeSDKInstructions={this.allowedToSeeSDKInstructions}
                          asyncContentLoaded={asyncContentLoaded}
                        />
                      </Card>
                    )}
                  </RowCol>
                </Grid>
              ) : null}
              <PanelOutlet>{this.props.children}</PanelOutlet>
            </Page>
          );
        }
      }
    )
  )
);
