import * as React from "react";
import { GettingStartedState } from "./getting-started-common";
import { Tabs, Tab, TabSections, TabSection, AsyncContentLoader, AsyncContentLoadedProps } from "@root/shared";
import { template, every } from "lodash";
import { OS } from "@lib/common-interfaces/app";

const css = require("./getting-started.scss");

export type GettingStartedTabOptions = "Swift" | "Objective-C" | "Xamarin" | "Xamarin.Forms" | "UWP" | "Java" | "Kotlin";
interface GettingStartedTabbedState extends GettingStartedState {
  loaded: any;
  tabAutofocusEnabled: boolean;
}

export interface GettingStartedTabbedProps extends AsyncContentLoadedProps {
  flavors: GettingStartedTabOptions[];
  os: OS;
  app_secret: string;
  contentLoader: (platform: string, variant?: string) => Promise<{ content: string }>;
  transform?: (content: string) => string;
}

/**
 * Getting started page for iOS applications.
 */
export class GettingStartedTabbed extends React.Component<GettingStartedTabbedProps, GettingStartedTabbedState> {
  constructor(props: any) {
    super(props);
    const beginningState = { currentTab: 0, loaded: {}, tabAutofocusEnabled: false };
    this.props.flavors.forEach((flavor) => {
      beginningState.loaded[this.transformOptionName(flavor)] = false;
    });
    this.state = beginningState;
  }

  public flavorCompleted = (flavor: string) => {
    const { loaded } = this.state;
    loaded[flavor] = true;
    this.setState({ loaded }, this.tryCompletedCallack);
  };

  public tryCompletedCallack = () => {
    const { completedCallback } = this.props;
    if (completedCallback && every(Object.values(this.state.loaded))) {
      completedCallback();
    }
  };

  public transformOptionName(option: string): string {
    if (option === "Objective-C") {
      return "objc";
    }

    return option.replace(".", "-").toLowerCase();
  }

  public render() {
    const { os } = this.props;
    return (
      <div>
        <Tabs
          selectedIndex={this.state.currentTab}
          onSelect={(index: number) => this.setState({ currentTab: index, tabAutofocusEnabled: true })}
          centered
        >
          {this.props.flavors.map((flavor, index) => {
            const transformed = this.transformOptionName(flavor);
            const panelId = this.createPanelId(os, flavor);
            return (
              <Tab key={index} id={transformed} aria-controls={panelId} autofocusEnabled={this.state.tabAutofocusEnabled}>
                {flavor}
              </Tab>
            );
          })}
        </Tabs>

        <TabSections selectedIndex={this.state.currentTab}>
          {this.props.flavors.map((flavor) => {
            const transformed = this.transformOptionName(flavor);
            return this.renderTab(os.toLowerCase(), transformed);
          })}
        </TabSections>
      </div>
    );
  }

  /**
   * Render the instructions for a given OS and platform flavor
   */
  public renderTab(os: string, flavor: string) {
    const { contentLoader, transform } = this.props;
    const content = () => contentLoader(os, flavor);
    const id = this.createPanelId(os, flavor);

    return (
      <TabSection key={id} className={css["tab-section"]} id={id} aria-labelledby={this.transformOptionName(flavor)}>
        <AsyncContentLoader
          moduleProvider={content}
          transform={transform ? transform : this.transform}
          completedCallback={() => this.flavorCompleted(flavor)}
        />
      </TabSection>
    );
  }

  public transform = (content: string) => {
    const { app_secret, os } = this.props;
    const compiled = template(content);
    return compiled({ appSecret: app_secret, os: os.toLowerCase() });
  };

  private createPanelId(os: string, flavor: string): string {
    return `getting-started-${os}-${this.transformOptionName(flavor)}-panel`.toLowerCase();
  }
}
