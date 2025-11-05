import * as React from "react";
import { ActionText, Paragraph, Size, Icon, IconName, IconSize, Color } from "@root/shared";
import { layoutStore } from "@root/stores";
import { action } from "mobx";

const styles = require("./mobile-banner.scss");

export class MobileBanner extends React.Component {
  componentDidMount() {
    document.body.setAttribute("mobile-banner-visible", "true");
  }

  componentWillUnmount() {
    document.body.removeAttribute("mobile-banner-visible");
  }

  @action
  forceMobileVersion() {
    layoutStore.desktopViewOverride = false;
  }

  render() {
    return (
      <ActionText onClick={() => this.forceMobileVersion()} className={styles.banner}>
        <Icon icon={IconName.Phone} color={Color.White} size={IconSize.Large} />
        <Paragraph className={styles.text} size={Size.Large} invert bold>
          Switch to mobile version
        </Paragraph>
      </ActionText>
    );
  }
}
