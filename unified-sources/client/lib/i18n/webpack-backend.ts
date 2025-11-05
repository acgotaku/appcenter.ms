import * as i18next from "i18next";

function replaceLeaves(object: object) {
  const result: any = {};
  Object.keys(object).forEach((key) => {
    if (typeof object[key] === "string") {
      result[key] = "XXXXXX";
    } else {
      result[key] = replaceLeaves(object[key]);
    }
  });
  return result;
}

class WebpackI18nextBackend implements i18next.Module {
  private defaultLocale?: string;
  public type: i18next.ModuleType = "backend";

  init(services, backendOptions, { fallbackLng = "en-US" }: i18next.InitOptions) {
    if (typeof fallbackLng === "string") {
      this.defaultLocale = fallbackLng;
    } else if (typeof fallbackLng === "object") {
      this.defaultLocale = fallbackLng[0];
    }
  }

  read(language: string, namespace: string, callback: (err: Error | null, results?: object) => void) {
    const cb = (content: object) => {
      callback(null, content);
      return null;
    };

    try {
      if (language === this.defaultLocale) {
        const content = require(`../../i18n/${namespace}.json`);
        cb(content);
      } else if (language === "debug") {
        const content = require(`../../i18n/${namespace}.json`);
        cb(replaceLeaves(content));
      } else {
        const content = require(`../../../handback/${language}/${namespace}.resjson`)
        cb(content);
      }
    } catch (error: any) {
      callback(error);
    }

  }
}

export const webpackBackend = new WebpackI18nextBackend();
