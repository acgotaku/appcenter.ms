import { StorageManager } from "../utils/storage-manager";
import * as i18next from "i18next";

// This is a plugin for i18next, specifically a language detector. Information about the
// methods and members that must exist can be found here:
// https://www.i18next.com/misc/creating-own-plugins.html#languagedetector
export class LocalStorageDetector implements i18next.Module {
  public type: i18next.ModuleType = "languageDetector";
  private storageManager: StorageManager;
  private services: any;
  private i18nextOptions?: i18next.InitOptions;

  constructor() {
    this.storageManager = new StorageManager(undefined, "shell");
  }

  public init(services: any, detectorOptions: any, i18nextOptions: i18next.InitOptions) {
    this.services = services;
    this.i18nextOptions = i18nextOptions;
  }

  public detect() {
    const lng = this.storageManager.getObject("language");
    const cleanedLng = this.services.languageUtils.formatLanguageCode(lng);
    if (cleanedLng && this.services.languageUtils.isSupportedCode(cleanedLng)) {
      return cleanedLng;
    }

    return this.i18nextOptions && this.i18nextOptions.fallbackLng && this.i18nextOptions.fallbackLng[0];
  }

  public cacheUserLanguage(lng) {
    this.storageManager.saveObject("language", lng);
  }
}
