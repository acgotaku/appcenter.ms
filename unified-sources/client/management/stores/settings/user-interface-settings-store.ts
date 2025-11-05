import { action, observable, computed } from "mobx";
import { safeLocalStorage } from "@root/lib/utils/safe-local-storage";
import { logger } from "@root/lib/telemetry";
import { supportsAutoTheme } from "@root/lib/utils/supports-auto-theme";

export type ThemeOptions = "auto" | PreviousThemeOptions;
export type PreviousThemeOptions = "light" | "dark";
class UserInterfaceSettingsStore {
  @observable private themeValue: ThemeOptions;
  private prevThemeValue?: PreviousThemeOptions;

  constructor() {
    this.themeValue = (safeLocalStorage.getItem("theme-value") as ThemeOptions) || (supportsAutoTheme() ? "auto" : "light");
    this.prevThemeValue = safeLocalStorage.getItem("previous-theme-value") as PreviousThemeOptions;
  }

  @computed get theme(): ThemeOptions {
    return this.themeValue;
  }

  get previousTheme(): PreviousThemeOptions {
    return this.prevThemeValue || "light";
  }

  @action setTheme = (theme: ThemeOptions) => {
    if (theme !== "auto") {
      safeLocalStorage.setItem("previous-theme-value", theme);
      this.prevThemeValue = theme;
      logger.info("theme-selected", { theme, effectiveTheme: theme });
    } else {
      logger.info("theme-selected", { theme, effectiveTheme: this.prevThemeValue });
    }
    safeLocalStorage.setItem("theme-value", theme);
    this.themeValue = theme;
  };
}

export const userInterfaceSettingsStore = new UserInterfaceSettingsStore();
