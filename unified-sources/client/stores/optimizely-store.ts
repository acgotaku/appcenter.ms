import * as optimizelySDK from "@optimizely/optimizely-sdk";
import { userStore } from "./user-store";
import { npsSurveyStore } from "./nps/nps-survey-store";
import { appStore } from "@root/stores/app-store";
import { UserAttributes } from "@optimizely/optimizely-sdk";
import {
  OptimizelyCustomAttributes,
  OptimizelyExperimentNames,
  OptimizelyFeatureNames,
  OptimizelyEventNames,
} from "@lib/common-interfaces/optimizely-features";

interface OptimizelyDataFile {
  attributes: OptimizelyDataFileAttribute[];
}

interface OptimizelyDataFileAttribute {
  id: string;
  key: string;
}

type OptimizelyMetaData = { [index: string]: { message: string } };

export class OptimizelyStore {
  private optimizelyClient?: optimizelySDK.Client;
  private readonly featureOverrides: { [K in OptimizelyFeatureNames]?: boolean };
  private metadata: OptimizelyMetaData = {};
  private dataFile: OptimizelyDataFile = { attributes: [] };
  private get defaultAttributes(): OptimizelyCustomAttributes {
    const npsRating = npsSurveyStore.selectedRating && npsSurveyStore.selectedRating > 10 ? 10 : npsSurveyStore.selectedRating;
    return {
      origin: "portal-client",
      environment: process.env.NODE_ENV,
      internalUser: this.isInternalUser,
      ...(npsRating && { npsSurveyRating: npsRating }),
      ...this.mappedMetaData,
    };
  }

  constructor(optimizelyDataFile: OptimizelyDataFile, metaData: OptimizelyMetaData) {
    this.setupClient(optimizelyDataFile, metaData);
    this.featureOverrides = {};
  }

  private get mappedMetaData() {
    const mappedMetaData = {};
    const attributes = this.dataFile.attributes;
    for (const [key, value] of Object.entries(this.metadata)) {
      const mappedId = attributes.find((attribute) => attribute.id === key);
      if (mappedId) mappedMetaData[mappedId.key] = value;
    }
    return mappedMetaData;
  }

  public track(metricName: OptimizelyEventNames, customAttributes: UserAttributes = {}): void {
    const attributes = Object.assign(this.defaultAttributes, customAttributes);
    return this.optimizelyClient && this.optimizelyClient.track(metricName, this.currentUserId, attributes);
  }

  public activate(experimentName: OptimizelyExperimentNames, customAttributes: UserAttributes = {}): string | null | undefined {
    const attributes = Object.assign(this.defaultAttributes, customAttributes);
    return this.optimizelyClient && this.optimizelyClient.activate(experimentName, this.currentUserId, attributes);
  }

  // Can be used from the browser, e.g. commonContext.optimizelyStore.setForcedVariation("support_menu_icon", "new_large")
  public setForcedVariation(experimentName: OptimizelyExperimentNames, variationKey: string, userId?: string) {
    return (
      this.optimizelyClient && this.optimizelyClient.setForcedVariation(experimentName, userId || this.currentUserId, variationKey)
    );
  }

  public isFeatureEnabled(featureName: OptimizelyFeatureNames, customAttributes: UserAttributes = {}): boolean {
    // Have to assign the value from the hash to a variable in order to play nicely with the type narrowing
    const override = this.featureOverrides[featureName];
    if (override !== undefined) {
      return override;
    }
    if (appStore && appStore.app) {
      customAttributes["appId"] = appStore.app.id;
    }
    const attributes = Object.assign(this.defaultAttributes, customAttributes);
    return !!this.optimizelyClient && this.optimizelyClient.isFeatureEnabled(featureName, this.currentUserId, attributes);
  }

  public getEnabledFeatures(): string[] {
    if (!this.optimizelyClient) {
      return [];
    }
    return this.optimizelyClient.getEnabledFeatures(this.currentUserId);
  }

  private get currentUserId(): string {
    // Login shell has no userStore
    if ((window as any).initProps && (window as any).initProps.userId) {
      return (window as any).initProps.userId;
    }
    return userStore.currentUser?.id || "";
  }

  private get isInternalUser(): boolean {
    if (window.initProps && window.initProps.hasOwnProperty("internalUser")) {
      return window.initProps.internalUser;
    }
    return userStore.currentUser ? !!userStore.currentUser.is_microsoft_internal : false;
  }

  private setupClient(optimizelyDataFile: OptimizelyDataFile, metadata: OptimizelyMetaData): void {
    if (optimizelyDataFile && Object.keys(optimizelyDataFile).length > 0) {
      this.metadata = metadata;
      this.dataFile = optimizelyDataFile;
      this.optimizelyClient = optimizelySDK.createInstance({
        datafile: optimizelyDataFile,
      });
    }
    if (URLSearchParams) {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams) {
        const experimentName = urlParams.get("opz-experiment") as OptimizelyExperimentNames;
        const variantId = urlParams.get("opz-variant");
        if (experimentName && variantId) {
          this.setForcedVariation(experimentName, variantId);
        }
      }
    }
  }
}

export const optimizelyStore = new OptimizelyStore(
  ((window as any).initProps || {}).optimizelyDataFile || {},
  ((window as any).initProps || {}).optimizelyMetaData || {}
);
