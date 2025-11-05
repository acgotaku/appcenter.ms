import * as React from "react";
import { AppIcon, Color, Heading, MediaObject, Pill, Size } from "@root/shared";
import { IApp, IUser } from "@lib/common-interfaces";
import { layoutStore } from "@root/stores";
import { observer } from "mobx-react";
const classNames = require("classnames");

const styles = require("./app-info.scss");

export interface AppInfoProps extends React.HTMLAttributes<HTMLElement> {
  app: IApp;
  isExpanded?: boolean;
  currentUser: IUser;
}

@observer
export class AppInfo extends React.Component<AppInfoProps, {}> {
  public render() {
    const { app, isExpanded, currentUser, ...props } = this.props;
    const isMobile = layoutStore.isMobile;
    const newNavBarFeatureDesktop = !isMobile;
    const infoContainerStyles = !isExpanded
      ? classNames(styles["infoContainer"], { [styles["new-nav"]]: newNavBarFeatureDesktop })
      : classNames(styles["infoContainer"], styles["expanded"], { [styles["new-nav"]]: newNavBarFeatureDesktop });
    const appIconSize = 24;
    return (
      <MediaObject {...props} className={infoContainerStyles}>
        <AppIcon size={appIconSize} app={app} className={styles["appIcon"]} />
        <div className={styles.appInfoAndPlatform}>
          <Heading className={styles.appName} size={Size.Medium} invert data-test-id="app-info-app-display-name">
            {app.display_name}
          </Heading>
          {isExpanded ? (
            <Pill className={styles.platformTag} subtle color={Color.Gray}>
              {app.os}
            </Pill>
          ) : null}
        </div>
      </MediaObject>
    );
  }
}
