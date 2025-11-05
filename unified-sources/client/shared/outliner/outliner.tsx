import * as React from "react";
import { Keys } from "../utils/keys";
import { globalUIStore, NavigationMode } from "@root/stores/global-ui-store";

export class Outliner extends React.Component<{}, {}> {
  public onClick = (event: MouseEvent) => {
    /* Enter keypresses also fire `onClick`, but we want to ignore those
     *   - Identify them with detail in Chrome/Safari
     *   - Identify them with screenX & screenY in Chrome/Firefox
     */
    if (event.detail === 0 || (event.screenX === 0 && event.screenY === 0)) {
      return;
    }
    globalUIStore.setNavigationMode(NavigationMode.Mouse);
    document.body.removeAttribute("data-outline");
    document.removeEventListener("click", this.onClick);
    document.addEventListener("keydown", this.onKeyDown);
  };
  public onKeyDown = (event: KeyboardEvent) => {
    if (event.which === Keys.Tab || ((event.metaKey || event.ctrlKey) && event.key === "F6")) {
      globalUIStore.setNavigationMode(NavigationMode.Keyboard);
      document.body.setAttribute("data-outline", "");
      document.removeEventListener("keydown", this.onKeyDown);
      document.addEventListener("click", this.onClick);
    }
  };

  public componentDidMount() {
    globalUIStore.setNavigationMode(NavigationMode.Mouse);
    document.addEventListener("keydown", this.onKeyDown);
  }
  public componentWillUnmount() {
    globalUIStore.setNavigationMode(NavigationMode.Mouse);
    document.body.removeAttribute("data-outline");
    document.removeEventListener("click", this.onClick);
    document.removeEventListener("keydown", this.onKeyDown);
  }

  public render() {
    return React.Children.only(this.props.children);
  }
}
