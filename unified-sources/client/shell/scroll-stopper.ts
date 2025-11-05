import * as React from "react";
import { reaction } from "mobx";
import { globalUIStore, layoutStore } from "@root/stores";
import { Utils } from "@root/lib/http/utils";
const styles = Utils.isInstallSubdomain() ? require("@root/install/install.scss") : require("./shell.scss");

export class ScrollStopper extends React.Component {
  private disposeReaction = reaction(
    () =>
      globalUIStore.isModalOpen ||
      (layoutStore.isMobile && globalUIStore.isNavBarOpen) ||
      (layoutStore.isMobile && globalUIStore.isDialogOrPopoverOpen),
    () => {
      if (globalUIStore.isModalOpen || (layoutStore.isMobile && globalUIStore.isNavBarOpen)) {
        document.documentElement.classList.add(styles.superStopScrolling);
      } else {
        document.documentElement.classList.remove(styles.superStopScrolling);
      }
      if (layoutStore.isMobile && globalUIStore.isDialogOrPopoverOpen) {
        document.documentElement.classList.add(styles.stopScrolling);
      } else {
        document.documentElement.classList.remove(styles.stopScrolling);
      }
    }
  );

  componentWillUnmount() {
    this.disposeReaction();
  }

  render() {
    return this.props.children || null;
  }
}
