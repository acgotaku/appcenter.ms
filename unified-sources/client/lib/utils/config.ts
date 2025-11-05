const CONFIG_KEYS = {
  BIFROST_HOST: "bifrostHost",
  BIFROST_INSTALL_HOST: "bifrostInstallHost",
  ENV: "env",
  ROOT_PATHS_NOT_IN_NAV: "rootPathsNotInNav",
  ENFORCE_REGISTER_REDIRECT: "enforceRegisterRedirect",
  AI_INSTRUMENTATION_KEY: "aiInstrumentationKey",
  HOST: "host",
  ACCOUNT_MANAGEMENT_URL: "accountManagementUrl",
  CLIENT_ID: "clientId",
};

// Load configuration from window.
const configuration = ((window as any).initProps || {}).config || {};

export const config = {
  get(key: string): any {
    return configuration[key];
  },

  getEnv(): string {
    return config.get(CONFIG_KEYS.ENV);
  },

  getApiGatewayUrl(): string {
    return config.get(CONFIG_KEYS.BIFROST_HOST);
  },

  getApiGatewayUrlInstall(): string {
    return config.get(CONFIG_KEYS.BIFROST_INSTALL_HOST);
  },

  getCookieDomain(): string {
    return config.get(CONFIG_KEYS.HOST);
  },

  getEnforceRegisterRedirect(): string {
    return config.get(CONFIG_KEYS.ENFORCE_REGISTER_REDIRECT);
  },

  getAppInsightsInstrumentationKey(): string {
    return config.get(CONFIG_KEYS.AI_INSTRUMENTATION_KEY);
  },

  getRootPathsNotInNav(): string[] {
    return config.get(CONFIG_KEYS.ROOT_PATHS_NOT_IN_NAV);
  },

  getAccountManagementUrl(): string {
    return config.get(CONFIG_KEYS.ACCOUNT_MANAGEMENT_URL);
  },

  getClientId(): string {
    return config.get(CONFIG_KEYS.CLIENT_ID);
  },
};
