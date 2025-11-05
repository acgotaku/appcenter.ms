import { observable, computed, action, runInAction, IObservableArray } from "mobx";
import { OS, NotificationType, PLATFORMS, IPlatform, IAppOwner, PLATFORM } from "@lib/common-interfaces";
import { FetchError } from "@root/lib/http/fetch-error";
import { App } from "@root/data/shell/models/app";
import { appStore } from "@root/stores/app-store";
import { IMessageBarMessage } from "../../constants/constants";
import { t } from "@root/lib/i18n";
import { reduce, compact, intersection } from "lodash";
import { objectIntersection } from "@root/shared/utils/object-intersection";
import { metrics, logger } from "@root/lib/telemetry";
import { validateImage } from "@root/shared/utils/image-validator";
import { updateAppIcon } from "@root/management/stores/apps/update-app-icon";

const platformsByOS: { [O in OS]?: IPlatform[] } = reduce(
  PLATFORMS,
  (hash, platform) => {
    return platform.supportedOSs.reduce(
      (hash, os) => ({
        ...hash,
        [os]: (hash[os] || []).concat(platform),
      }),
      hash
    );
  },
  {}
);

export type Owner = {
  name: IAppOwner["name"];
  email?: IAppOwner["email"];
  display_name?: IAppOwner["display_name"];
};

type AppForm = {
  displayName: string;
  description: string;
  release_type: string;
  oses: IObservableArray<OS>;
  platform: PLATFORM | null;
  owner: Owner | null;
};

/** A language value coming from GitHub repos that helps make an OS/Platform auto selection */
export type KnownLanguage = "Swift" | "Objective-C" | "Java" | "C#" | "JavaScript" | "TypeScript" | "Kotlin";

/**
 * For each OS supported in App Center, enumerates the supported platforms (`platforms`),
 * a guess of which supported platform is correct given a repo language (`defaultsByLanguage`),
 * and an optional default platform that should be the default guess if the language isn’t known
 * or isn’t recognized. `fallback` is used generally when one platform is much more popular than
 * others.
 */
const platformLanguageOSMap: {
  [O in OS]: { platforms: IPlatform[]; fallback?: IPlatform; defaultsByLanguage: { [K in KnownLanguage]?: IPlatform } };
} = {
  iOS: {
    platforms: platformsByOS["iOS"] || [],
    fallback: PLATFORMS.OBJECTIVE_C_SWIFT,
    defaultsByLanguage: {
      Swift: PLATFORMS.OBJECTIVE_C_SWIFT,
      "Objective-C": PLATFORMS.OBJECTIVE_C_SWIFT,
      JavaScript: PLATFORMS.REACT_NATIVE,
      TypeScript: PLATFORMS.REACT_NATIVE,
      "C#": PLATFORMS.XAMARIN,
    },
  },
  Android: {
    platforms: platformsByOS["Android"] || [],
    fallback: PLATFORMS.JAVA,
    defaultsByLanguage: {
      Java: PLATFORMS.JAVA,
      Kotlin: PLATFORMS.JAVA,
      JavaScript: PLATFORMS.REACT_NATIVE,
      TypeScript: PLATFORMS.REACT_NATIVE,
      "C#": PLATFORMS.XAMARIN,
    },
  },
  Windows: {
    platforms: platformsByOS["Windows"] || [],
    fallback: PLATFORMS.UWP,
    defaultsByLanguage: {},
  },
  macOS: {
    platforms: platformsByOS["macOS"] || [],
    fallback: PLATFORMS.OBJECTIVE_C_SWIFT,
    defaultsByLanguage: {},
  },
  tvOS: {
    platforms: platformsByOS["tvOS"] || [],
    fallback: PLATFORMS.OBJECTIVE_C_SWIFT,
    defaultsByLanguage: {},
  },
  Tizen: {
    platforms: platformsByOS["Tizen"] || [],
    fallback: PLATFORMS.XAMARIN,
    defaultsByLanguage: {},
  },
  Linux: {
    platforms: platformsByOS["Linux"] || [],
    fallback: PLATFORMS.ELECTRON,
    defaultsByLanguage: {},
  },
  Custom: {
    platforms: platformsByOS["Custom"] || [],
    fallback: PLATFORMS.CUSTOM,
    defaultsByLanguage: {},
  },
};

const languageOSGuessMap: { [K in KnownLanguage]: OS[] } = {
  Swift: ["iOS"],
  "Objective-C": ["iOS"],
  Java: ["Android"],
  Kotlin: ["Android"],
  "C#": ["iOS", "Android"],
  JavaScript: ["iOS", "Android"],
  TypeScript: ["iOS", "Android"],
};

export class NewAppUIStore {
  public language?: string;
  @observable private showOSError: boolean = false;
  public appsToCreate = observable.array<App>([], { deep: false });

  @observable
  public appForm: AppForm = {
    displayName: "",
    description: "",
    release_type: null as any,
    oses: observable.array([]),
    platform: null,
    owner: null,
  };

  @observable public iconFile: File = null as any;
  @observable public iconSrc = "";
  @observable public iconValidationMessageKey = "";

  public availableOtherOS: string[] = [];

  constructor(options: { defaultValues?: Partial<AppForm>; language?: string } = { defaultValues: {} }) {
    this.availableOtherOS.push(OS.MACOS);
    this.availableOtherOS.push(OS.TVOS);

    this.language = options.language;
    this.appForm = { ...this.appForm, ...options.defaultValues };
  }

  get canUseOtherOS() {
    return this.availableOtherOS.length > 0;
  }

  @computed
  get isCreating() {
    return this.appsToCreate && this.appsToCreate.some((app) => appStore.isCreating(app));
  }

  @computed
  get notification(): IMessageBarMessage {
    const errors = compact(this.appsToCreate.map((app) => appStore.creationError<FetchError>(app)));
    if (!errors.length) {
      return null as any;
    }

    // Only handle one error at a time, I guess ¯\_(ツ)_/¯
    const error = errors[0];
    return {
      type: NotificationType.Error,
      // @ts-ignore. [Should fix it in the future] Strict error.
      message: ((status) => {
        switch (error.status) {
          case 409:
            return null; // Handled in `conflictError()`
          case 400:
            return error.message ?? t("management:app.errors.badAppDataError");
          case 429:
            return error.message;
          default:
            return t("management:app.errors.appCreationFailedError");
        }
      })(status),
    };
  }

  @computed
  get multiOSValidationMessage(): string | null {
    return this.showOSError
      ? this.appForm.oses.length
        ? NewAppUIStore.getAvailablePlatforms(this.appForm.oses).length
          ? null
          : t("management:app.errors.osInvalidError")
        : t("management:app.errors.osRequiredError")
      : null;
  }

  // This does not tell you if the whole form is valid.
  // We have to get rid of Formsy. This should not be this difficult.
  @computed
  get isValid() {
    return !this.multiOSValidationMessage;
  }

  @action
  public create = () => {
    const {
      // @ts-ignore. [Should fix it in the future] Strict error.
      owner: { name: ownerName },
      oses,
      displayName,
      description,
      ...appProperties
    } = this.appForm;
    this.appsToCreate.replace(
      oses.map(
        (os) =>
          // @ts-ignore. [Should fix it in the future] Strict error.
          new App({
            ...appProperties,
            os,
            display_name: displayName,
          })
      )
    );

    return this.appsToCreate.map((app) =>
      appStore.create(app, false, { ownerName }).onSuccess((newApp) => {
        const telemetryProperties = { os: newApp!.os, platform: newApp!.platform };
        logger.info("app-created", telemetryProperties);
        metrics.emitMetric("portal-app-created", 1, telemetryProperties);
        // Check if the newApp is an org owned app.
        // If it is, optimistically add "manager" role to its permissions and empty repositories property.
        if (newApp!.isOrgApp) {
          newApp!.applyChanges({
            member_permissions: ["manager"],
            repositories: [],
          });
        }

        if (!!this.iconFile) {
          updateAppIcon(newApp!, this.iconFile);
        }
      })
    );
  };

  @action
  public validate() {
    this.showOSError = true;
  }

  @action
  public updateForm = <K extends keyof AppForm>(key: K, value: AppForm[K]) => {
    if (key === "oses") {
      this.showOSError = false;
      const platform = this.getDefaultPlatform(value as IObservableArray<OS>, !this.language);
      this.appForm.platform = platform ? platform.value : null;
    }

    this.appForm[key] = value;
  };

  @action
  public updateIcon = (file: File) => {
    validateImage(file, { fileSize: { min: 0, max: 1023e3 } }, { width: { min: 0, max: 512 }, height: { min: 0, max: 512 } })
      .then((validationResult) => {
        runInAction(() => {
          if (validationResult.valid) {
            this.iconFile = file;
            this.iconSrc = validationResult.dataUrl!;
            this.iconValidationMessageKey = "";
          } else {
            if (validationResult.failures.some((failure) => failure.attribute === "fileSize")) {
              this.iconValidationMessageKey = "management:common.icon.fileSizeTooBigMessage";
            } else if (validationResult.failures.some((failure) => ["width", "height"].includes(failure.attribute))) {
              this.iconValidationMessageKey = "management:common.icon.dimensionsTooBigMessage";
            }
          }
        });
      })
      .catch(
        action(() => {
          this.iconFile = file;
          this.iconValidationMessageKey = "management:common.icon.uploadError";
        })
      );
  };

  @action
  public deleteIcon = () => {
    this.iconFile = null as any;
    this.iconSrc = "";
    this.iconValidationMessageKey = "";
  };

  public addOrRemoveOS = (os: OS) =>
    action((event: React.ChangeEvent<HTMLInputElement>) => {
      this.showOSError = false;
      const telemetryProperties: { [key: string]: string } = {};

      if (event.target.checked) {
        this.appForm.oses.push(os);
        telemetryProperties.action = "added";
      } else {
        this.appForm.oses.remove(os);
        telemetryProperties.action = "removed";
      }

      const platform = this.getDefaultPlatform(this.appForm.oses, !this.language);
      telemetryProperties.platform = platform!.displayName;

      logger.info("App os selection changed", telemetryProperties);

      this.appForm.platform = platform ? platform.value : null;
    });

  public getDefaultPlatform(oses: OS[], allowNull?: boolean): IPlatform | null {
    if (!oses.length) {
      return null;
    }

    const availablePlatforms = NewAppUIStore.getAvailablePlatforms(oses);

    // If you’re switching OSes and previously had a platform selected that’s still available, just keep it
    const alreadySelectedPlatform = availablePlatforms.find((platform) => platform.value === this.appForm.platform);
    if (alreadySelectedPlatform) {
      return alreadySelectedPlatform;
    }

    // Try using repo language to make an intelligent guess
    if (this.language) {
      const languageDefaults = objectIntersection(oses.map((os) => platformLanguageOSMap[os].defaultsByLanguage));
      if (languageDefaults[this.language]) {
        return languageDefaults[this.language];
      }
    }

    // If every available option has the same fallback, use that
    if (oses.every((os) => platformLanguageOSMap[os].fallback === platformLanguageOSMap[oses[0]].fallback)) {
      return platformLanguageOSMap[oses[0]].fallback!;
    }

    // Pick the first available one if we’ve said to pick something no matter what
    if (!allowNull) {
      return availablePlatforms[0];
    }

    return null;
  }

  public static getAvailablePlatforms(oses: OS[]) {
    return intersection(...oses.map((os) => platformLanguageOSMap[os].platforms));
  }

  public static getDefaultOSes(language: string): OS[] {
    return languageOSGuessMap[language] || [];
  }
}
