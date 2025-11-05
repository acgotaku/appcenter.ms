import { observable, action } from "mobx";
import { IHttpOptions } from "@lib/common-interfaces";
import { apiGateway } from "@root/lib/http";
import { API } from "../data/management/constants";
import { logger } from "../lib/telemetry";
import { safeLocalStorage } from "../lib/utils/safe-local-storage";

interface DeviceProfile {
  data_url: string;
}

interface ProfileRequest {
  original_url: string;
  [key: string]: string;
}

export class RegisterDeviceStore {
  @observable isFetchingProfile = false;

  get udid(): string | null {
    return safeLocalStorage.getItem("udid");
  }

  public fetchProfile(originalUrl: string, registrationId?: string) {
    const params: ProfileRequest = {
      original_url: encodeURI(originalUrl),
    };

    if (registrationId) {
      params.registration_id = registrationId;
    }

    const options: IHttpOptions = {
      params: params,
      // No authenticaiton is needed when dioing registration with a registration ID, authentication was done previously to get the registration ID.
      noBifrostToken: registrationId ? true : undefined,
    };

    this.isFetchingProfile = true;
    apiGateway
      .get<DeviceProfile>(API.GET_DEVICE_MANAGEMENT_PROFILE, options)
      .then((result) => {
        this.setIsFetchingProfile(false);
        // Install the profile
        window.location.href = result.data_url;
      })
      .catch((error) => {
        this.setIsFetchingProfile(false);
        console.error("A problem occurred downloading the device management profile to register a device", error);
        return;
      });
  }

  public finishDeviceRegistration(udid: string, enterprise?: boolean, fromApp?: boolean) {
    logger.info("Device registration complete", { skip: false, registered: true, enterprise, fromApp, mainPortal: true });
    safeLocalStorage.setItem("udid", udid);
    safeLocalStorage.removeItem("skip");
  }

  @action
  private setIsFetchingProfile = (fetching: boolean) => {
    this.isFetchingProfile = fetching;
  };
}
