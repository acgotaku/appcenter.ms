import { getCurrentLanguage } from "../../lib/i18n/utils";

export const gettingStarted = (platform: string, variant?: string): Promise<{ content: string }> => {
  return new Promise((resolve) => {
    require.ensure(
      [],
      (require) => {
        variant = variant ? `-${variant}` : "";
        const withTemp = ["-uwp", "-winforms", "-wpf"];
        let isTemp = false;
        withTemp.forEach((x) => {
          if (x === variant) {
            isTemp = true;
          }
        });
        if (platform === "windows" && isTemp) {
          // eslint-disable-next-line security/detect-non-literal-require
          resolve({ content: require(`./${getCurrentLanguage()}/getting-started/${platform}${variant}-temporary.md`).default });
        } else {
          // eslint-disable-next-line security/detect-non-literal-require
          resolve({ content: require(`./${getCurrentLanguage()}/getting-started/${platform}${variant}.md`).default });
        }
      },
      () => undefined,
      "getting-started"
    );
  });
};

export const analyticsSDKInstructions = (platform: string, variant?: string): Promise<{ content: string }> => {
  return new Promise((resolve) => {
    require.ensure(
      [],
      (require) => {
        variant = variant ? `-${variant}` : "";
        // eslint-disable-next-line security/detect-non-literal-require
        resolve({ content: require(`./${getCurrentLanguage()}/analytics-sdk-instructions/${platform}${variant}.md`).default });
      },
      () => undefined,
      "analytics-sdk-instructions"
    );
  });
};

export const authAADB2CSDKInstructions = (platform: string, variant?: string): Promise<{ content: string }> => {
  return new Promise((resolve) => {
    require.ensure(
      [],
      (require) => {
        variant = variant ? `-${variant}` : "";
        // eslint-disable-next-line security/detect-non-literal-require
        resolve({ content: require(`./${getCurrentLanguage()}/auth-aadb2c-sdk-instructions/${platform}${variant}.md`).default });
      },
      () => undefined,
      "auth-aadb2c-sdk-instructions"
    );
  });
};

export const authAADSDKInstructions = (platform: string, variant?: string): Promise<{ content: string }> => {
  return new Promise((resolve) => {
    require.ensure(
      [],
      (require) => {
        variant = variant ? `-${variant}` : "";
        // eslint-disable-next-line security/detect-non-literal-require
        resolve({ content: require(`./${getCurrentLanguage()}/auth-aad-sdk-instructions/${platform}${variant}.md`).default });
      },
      () => undefined,
      "auth-aad-sdk-instructions"
    );
  });
};

export const authAuth0SDKInstructions = (platform: string, variant?: string): Promise<{ content: string }> => {
  return new Promise((resolve) => {
    require.ensure(
      [],
      (require) => {
        variant = variant ? `-${variant}` : "";
        // eslint-disable-next-line security/detect-non-literal-require
        resolve({ content: require(`./${getCurrentLanguage()}/auth-auth0-sdk-instructions/${platform}${variant}.md`).default });
      },
      () => undefined,
      "auth-auth0-sdk-instructions"
    );
  });
};

export const authFirebaseSDKInstructions = (platform: string, variant?: string): Promise<{ content: string }> => {
  return new Promise((resolve) => {
    require.ensure(
      [],
      (require) => {
        variant = variant ? `-${variant}` : "";
        // eslint-disable-next-line security/detect-non-literal-require
        resolve({ content: require(`./${getCurrentLanguage()}/auth-firebase-sdk-instructions/${platform}${variant}.md`).default });
      },
      () => undefined,
      "auth-firebase-sdk-instructions"
    );
  });
};

export const dataSDKInstructions = (platform: string, variant?: string): Promise<{ content: string }> => {
  return new Promise((resolve) => {
    require.ensure(
      [],
      (require) => {
        variant = variant ? `-${variant}` : "";
        // eslint-disable-next-line security/detect-non-literal-require
        resolve({ content: require(`./${getCurrentLanguage()}/data-sdk-instructions/${platform}${variant}.md`).default });
      },
      () => undefined,
      "data-sdk-instructions"
    );
  });
};

// the handled-errors feature works only for xamarin apps so platform and variant are ignored
export const handledErrors = (platform: string, variant?: string): Promise<{ content: string }> => {
  return new Promise((resolve) => {
    require.ensure(
      [],
      (require) => {
        // NOTE:
        // we CAN use the variant here but if we do - a bundle isn't created for handled-errors
        // until more platforms are supported for this feature, it remains hard-coded as "xamarin"
        // eslint-disable-next-line security/detect-non-literal-require
        resolve({ content: require(`./${getCurrentLanguage()}/handled-errors/xamarin.md`).default });
      },
      () => undefined,
      "handled-errors"
    );
  });
};

// the handled-errors feature works only for xamarin apps so platform and variant are ignored
export const diagnosticsIssues = (platform: string, variant?: string): Promise<{ content: string }> => {
  return new Promise((resolve) => {
    require.ensure(
      [],
      (require) => {
        // NOTE:
        // we CAN use the variant here but if we do - a bundle isn't created for handled-errors
        // until more platforms are supported for this feature, it remains hard-coded as "xamarin"
        // eslint-disable-next-line security/detect-non-literal-require
        resolve({ content: require(`./${getCurrentLanguage()}/handled-errors/xamarin-issues.md`).default });
      },
      () => undefined,
      "diagnostics-issues"
    );
  });
};
