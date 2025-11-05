import * as React from "react";
import { Helmet } from "react-helmet";
import { observer, Provider } from "mobx-react";
import { withRouter, WithRouterProps } from "react-router";
import LoadingPlaceholder from "./loading-placeholder";
import { LayoutWithLeftNav } from "./layout-with-left-nav/layout-with-left-nav";
import { appStore } from "../stores/app-store";
import { browserStore } from "../stores/browser-store";
import { layoutStore } from "../stores/layout-store";
import { locationStore } from "../stores/location-store";
import { userStore } from "../stores/user-store";
import { npsSurveyStore } from "../stores/nps/nps-survey-store";
import { moveFocusToNextSection, moveFocusToPreviousSection } from "../stores/focus-switcher-store";
import { KeyboardEventManager, HotkeyManager, HotkeyHandlers, Outliner, RefocusManager } from "@root/shared";
import * as PageTimer from "@root/shared/page-timer";
import { NpsSurvey } from "./nps-survey/nps-survey";
import { metrics } from "../lib/telemetry";
import { ScrollStopper } from "./scroll-stopper";
import { loadingStore } from "@root/stores/loading-store";
import { BreadcrumbBuilder } from "@root/shared/context-stack-builder/variants/breadcrumb-builder";
import { withTranslation, WithTranslation } from "react-i18next";
import {
  InterfaceSettingsStore,
  InterfaceSettingsStoreContext,
} from "../management/settings/user-interface/user-interface-settings-ui-store";
import { CreateSupportCaseModal } from "@root/management/support/create-support-case-modal";
import { SupportUIStore, SupportUIStoreContext } from "./support-ui-store";

/**
 * Shell is a simple component which will load all
 * its child components.
 *
 * This is the primary wrapper and serves as the
 * top-level component for our app.
 */
export const Shell = withTranslation("common")(
  withRouter(
    observer(
      class Shell extends React.Component<WithRouterProps & WithTranslation> {
        private interfaceSettingsStore = new InterfaceSettingsStore();
        private supportUIStore = new SupportUIStore();

        public UNSAFE_componentWillMount() {
          // Initialize the router.
          locationStore.setRouter(this.props.router);

          // Try to show the survey
          npsSurveyStore.tryShowSurvey({
            user: userStore.currentUser,
            numOfApps: appStore.apps.length,
          });
        }

        public render() {
          const hotkeyHandlers: HotkeyHandlers = {
            moveFocusToNextSection: { keys: ["mod+f6"], onKeysPressed: moveFocusToNextSection },
            moveFocusToPreviousSection: { keys: ["mod+shift+f6"], onKeysPressed: moveFocusToPreviousSection },
          };

          const supportsMobileShouldFallback = !document.documentElement.hasAttribute("data-supports-mobile");

          // Enable dark theme support based on what the user has chosen
          const { effectiveTheme: prefersColorScheme, themeValue: theme } = this.interfaceSettingsStore;
          const supportsDarkTheme = prefersColorScheme === "dark";
          const htmlAttributes = {
            ...(supportsMobileShouldFallback ? { "data-supports-mobile": "" } : {}),
            ...(supportsDarkTheme ? { "data-supports-dark-theme": true } : {}),
            ...(supportsDarkTheme && ["light", "dark"].includes(prefersColorScheme)
              ? { "data-prefers-color-scheme": prefersColorScheme }
              : {}),
          };

          metrics.emitMetric("portal-theme-loaded", 1, {
            theme,
            effectiveTheme: prefersColorScheme,
            userId: userStore.currentUser?.id || "",
          });

          // Use `Provider` to inject stores into the app
          return (
            <Provider
              loadingStore={loadingStore}
              userStore={userStore}
              locationStore={locationStore}
              appStore={appStore}
              layoutStore={layoutStore}
              browserStore={browserStore}
            >
              <InterfaceSettingsStoreContext.Provider value={this.interfaceSettingsStore}>
                <SupportUIStoreContext.Provider value={this.supportUIStore}>
                  <KeyboardEventManager>
                    <RefocusManager>
                      <Outliner>
                        <PageTimer.Collector>
                          <ScrollStopper />
                          <LayoutWithLeftNav>
                            <BreadcrumbBuilder.Collector onStackChange={locationStore.updateBreadcrumbs}>
                              <HotkeyManager handlers={hotkeyHandlers} />
                              <Helmet
                                titleTemplate={appStore.app ? `%s · ${appStore.app.display_name} · App Center` : "%s · App Center"}
                                htmlAttributes={htmlAttributes}
                              />
                              {!layoutStore.isMobile ? <NpsSurvey /> : null}
                              {this.props.children}
                              {locationStore.loading ? <LoadingPlaceholder /> : null}
                            </BreadcrumbBuilder.Collector>
                            <CreateSupportCaseModal />
                          </LayoutWithLeftNav>
                        </PageTimer.Collector>
                      </Outliner>
                    </RefocusManager>
                  </KeyboardEventManager>
                </SupportUIStoreContext.Provider>
              </InterfaceSettingsStoreContext.Provider>
            </Provider>
          );
        }
      }
    )
  )
);
