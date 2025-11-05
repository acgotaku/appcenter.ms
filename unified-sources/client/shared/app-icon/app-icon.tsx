import * as React from "react";
import { observer } from "mobx-react";
import { Identicon, IdenticonProps } from "../identicon/identicon";
import { IApp, OS } from "@lib/common-interfaces";
import { Skeletal } from "../skeleton";

const css = require("./app-icon.scss");

export interface AppIconProps extends IdenticonProps, Skeletal {
  /** The app whose icon the component will render. */
  app?: IApp;
}

export interface AppIconState {
  srcError: boolean;
}

@observer
export class AppIcon extends React.Component<AppIconProps, AppIconState> {
  public static defaultProps = {
    size: 60,
    styles: css,
  };

  constructor(props: AppIconProps) {
    super(props);
    this.state = {
      srcError: false,
    };
  }

  public render() {
    const { app, className, hashValue = app ? app.id : undefined, src = app && app.icon_url ? app.icon_url : undefined } = this.props;

    const isUploaded = app && app.icon_source === "uploaded";
    const { styles, value, ...passthrough } = this.props;
    const name = value || (app && app.display_name ? app.display_name : undefined);

    const classNames = [className, styles["app"]];
    if (app && app.os && src && !isUploaded && !this.state.srcError) {
      classNames.push(styles[this.classNameForOs(app.os)]);
    }

    const icon = (
      <Identicon
        {...passthrough}
        value={name}
        hashValue={hashValue}
        src={src}
        onError={this.setSrcError}
        className={classNames.join(" ")}
        defaultIconColor={"empty-icon"}
      />
    );

    return app && app.os && app.os === OS.IOS && src && !isUploaded && !this.state.srcError ? (
      <div className={styles["os-icon"]}>{icon}</div>
    ) : (
      icon
    );
  }

  private classNameForOs(os: string): string {
    switch (os) {
      case OS.IOS:
      case OS.MACOS:
      case OS.ANDROID:
      case OS.WINDOWS:
        return os.toLowerCase();
      default:
        return "generic";
    }
  }

  private setSrcError = (): void => {
    this.setState({ srcError: true });
  };
}
