import * as React from "react";
import { PLATFORM, OS } from "@lib/common-interfaces/app";
import { template } from "lodash";
import { AsyncContentLoader, AsyncContentLoadedProps } from "@root/shared";

export interface GettingStartedSingleProps extends AsyncContentLoadedProps {
  platform: PLATFORM;
  os: OS;
  app_secret: string;
  contentLoader: (platform: string, variant?: string) => Promise<{ content: string }>;
  transform?: (content: string) => string;
}

/**
 * Getting Started page
 */
export class GettingStartedSingle extends React.Component<GettingStartedSingleProps, {}> {
  public render() {
    const { os, contentLoader, transform } = this.props;
    const content = () => contentLoader(os.toLowerCase(), this.props.platform.toLowerCase());
    return (
      <AsyncContentLoader
        moduleProvider={content}
        transform={transform ? transform : this.transform}
        completedCallback={this.props.completedCallback}
      />
    );
  }

  public transform = (content: string) => {
    const { app_secret } = this.props;
    const compiled = template(content);
    return compiled({ appSecret: app_secret });
  };
}
