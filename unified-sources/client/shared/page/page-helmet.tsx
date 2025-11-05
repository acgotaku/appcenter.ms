import * as React from "react";
import { layoutStore } from "@root/stores";
import { Helmet } from "react-helmet";
import { observer } from "mobx-react";

export interface PageHelmetProps {
  supportsMobile: boolean;
}

@observer
export class PageHelmet extends React.Component<PageHelmetProps, {}> {
  render() {
    const { supportsMobile } = this.props;
    return (
      <>
        {supportsMobile && !layoutStore.desktopViewOverride ? (
          <Helmet
            meta={[{ name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=2" }]}
            htmlAttributes={{ "data-supports-mobile": "true" }}
          />
        ) : null}
        {!supportsMobile || layoutStore.desktopViewOverride ? (
          <Helmet
            meta={[{ name: "viewport", content: "width=1100, initial-scale=0" }]}
            htmlAttributes={{ "data-supports-mobile": "false" }}
          />
        ) : null}
      </>
    );
  }
}
