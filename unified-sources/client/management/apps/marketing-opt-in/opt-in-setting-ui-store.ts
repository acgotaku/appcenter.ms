import { observable, action, computed } from "mobx";
import { userStore } from "@root/stores";
import { logger } from "../../../lib/telemetry";
import { portalServer } from "@root/lib/http";
import { AccountsManagementServiceApi } from "@root/api/clients/accounts-management-service/api";

const OPT_IN_SETTING_NAME = "marketing_opt_in";
const REQUIREMENT_TO_FORCE_NOT_SHOWN = "DOUBLE-OPT-IN"; // REMOVEME later once we fully support the double-opt-in scenario where the user is notificated by email

export interface IOptInSettingResponse {
  optInSetting: string;
}

export class OptIntSettingUIStore {
  @observable private optInRequirement?: string;

  public optIn = () => {
    logger.info("notifications/opt-in");
    this.saveOptInSetting(true);
  };

  public optOut = () => {
    logger.info("notifications/opt-out");
    this.saveOptInSetting(false);
  };

  @action
  private saveOptInSetting(setting: boolean) {
    if (userStore.currentUser.settings) {
      userStore.currentUser.settings.marketing_opt_in = setting ? "true" : "false";
    }

    AccountsManagementServiceApi.putUsersSettings({ name: OPT_IN_SETTING_NAME }, { value: setting.toString() });
  }

  @computed
  private get userHasAlreadyOptedInOrOut() {
    return typeof userStore.currentUser.settings?.marketing_opt_in !== "undefined";
  }

  @computed
  private get hasLoadedOptInRequirement() {
    return typeof this.optInRequirement !== "undefined";
  }

  @computed
  public get shouldShowNotification(): boolean {
    return (
      !this.userHasAlreadyOptedInOrOut && this.hasLoadedOptInRequirement && this.optInRequirement !== REQUIREMENT_TO_FORCE_NOT_SHOWN
    );
  }

  @action
  public loadOptInRequirementIfNecessary() {
    if (!this.userHasAlreadyOptedInOrOut) {
      portalServer
        .get<IOptInSettingResponse>("/iptooptin", {
          noBifrostToken: true,
        })
        .then(
          action((response: IOptInSettingResponse) => {
            this.optInRequirement = response.optInSetting;
          })
        )
        .catch((error) => {
          console.error(error);
        });
    }
  }
}

export const optInSettingUIStore = new OptIntSettingUIStore();
