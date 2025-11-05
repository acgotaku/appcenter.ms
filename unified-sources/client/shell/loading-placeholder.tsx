import * as React from "react";
import { observer } from "mobx-react";
import { Page, PanelPosition, PageHeader } from "@root/shared";
import { locationStore } from "../stores/location-store";
const styles = require("./shell.scss");

@observer
export default class LoadingPlaceholder extends React.Component<{}, {}> {
  public render() {
    return (
      <Page
        supportsMobile
        withoutPadding
        className={styles.loading}
        panelPosition={PanelPosition.Primary}
        header={<PageHeader title="" loading={locationStore.loading} />}
      >
        <div className={styles.cover} />
      </Page>
    );
  }
}
