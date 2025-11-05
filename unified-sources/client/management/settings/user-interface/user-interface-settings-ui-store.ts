import { action, computed } from "mobx";
import { createObservableContext } from "@root/shared/utils/create-observable-context";
import { ThemeOptions, userInterfaceSettingsStore } from "@root/management/stores/settings/user-interface-settings-store";
import { supportsAutoTheme } from "@root/lib/utils/supports-auto-theme";

export const InterfaceSettingsStoreContext = createObservableContext<InterfaceSettingsStore>(null as any);

export class InterfaceSettingsStore {
  @action
  public selectThemeOption = (themeValue: ThemeOptions) => {
    userInterfaceSettingsStore.setTheme(themeValue);
  };

  @action
  public updateToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    userInterfaceSettingsStore.setTheme(e.target.checked ? "auto" : userInterfaceSettingsStore.previousTheme);
  };

  @computed get themeValue(): ThemeOptions {
    return userInterfaceSettingsStore.theme;
  }

  @computed get effectiveTheme(): ThemeOptions {
    if (this.isAutoSelected) {
      const x = window.matchMedia("(prefers-color-scheme: dark)");
      if (x.matches) {
        return "dark";
      } else {
        return "light";
      }
    }

    return this.themeValue;
  }

  @computed get supportsAutoTheme() {
    return supportsAutoTheme();
  }

  @computed get isAutoSelected() {
    return userInterfaceSettingsStore.theme === "auto";
  }
}
