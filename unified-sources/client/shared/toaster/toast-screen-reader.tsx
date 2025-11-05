import * as React from "react";
import { ScreenReaderToasty } from "@lib/common-interfaces/toaster";
import { LiveRegion } from "../live-region";

export interface ScreenReaderToastProps extends Partial<ScreenReaderToasty> {
  styles: any;
  role?: "status" | "alert";
}

export class ScreenReaderToast extends React.Component<ScreenReaderToastProps, {}> {
  public render() {
    const { styles, message, ...passthrough } = this.props;
    return (
      <LiveRegion className={styles.toastScreenReader} {...passthrough}>
        {message}
      </LiveRegion>
    );
  }
}
